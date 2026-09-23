"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { zCpfCnpj, zEmail, zName, zPhone } from "@/lib/validation";
import { effectivePriceCents } from "@/utils/pricing";
import { validateCoupon } from "@/services/coupons";
import { createOrder, priceCart } from "@/services/orders";
import { getPaymentProvider } from "@/services/payments";
import { confirmPayment } from "@/services/payments/confirm";
import { getSettings } from "@/lib/settings";

export type CartLineView = { productId: string; name: string; slug: string; image: string | null; category: string; unitPriceCents: number; originalPriceCents: number };

/** Dados atuais dos produtos do carrinho (preços vêm do banco). IDs inexistentes/inativos voltam em `missing`. */
export async function getCartLines(ids: string[]): Promise<{ lines: CartLineView[]; missing: string[] }> {
  const clean = [...new Set(ids.filter((i) => typeof i === "string" && i.length < 40))].slice(0, 30);
  if (clean.length === 0) return { lines: [], missing: [] };
  const products = await db.product.findMany({ where: { id: { in: clean }, active: true } });
  const lines = products.map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0] ?? null,
    category: p.category,
    unitPriceCents: effectivePriceCents(p),
    originalPriceCents: p.priceCents,
  }));
  const found = new Set(lines.map((l) => l.productId));
  return { lines, missing: clean.filter((id) => !found.has(id)) };
}

const itemsSchema = z
  .string()
  .transform((s, ctx) => {
    try {
      return JSON.parse(s) as unknown;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Carrinho inválido." });
      return z.NEVER;
    }
  })
  .pipe(z.array(z.object({ productId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(10) })).min(1, "Seu carrinho está vazio.").max(30));

/** Pré-visualiza o desconto de um cupom (o valor final é sempre recalculado ao fechar o pedido). */
export async function previewCoupon(items: { productId: string; quantity: number }[], code: string): Promise<{ ok: boolean; message: string; discountCents?: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Faça login para usar cupons." };
  const limited = await rateLimit(`coupon:${user.id}`, 20, 600);
  if (!limited.ok) return { ok: false, message: "Muitas tentativas. Aguarde um momento." };
  const cart = await priceCart(items);
  if ("error" in cart) return { ok: false, message: cart.error };
  const res = await validateCoupon(code, cart.subtotalCents);
  if (!res.ok) return { ok: false, message: res.error };
  return { ok: true, message: "Cupom aplicado!", discountCents: res.discountCents };
}

const orderSchema = z.object({
  items: itemsSchema,
  name: zName,
  document: zCpfCnpj,
  email: zEmail,
  whatsapp: zPhone,
  method: z.enum(["PIX", "CARD", "BOLETO"], { errorMap: () => ({ message: "Escolha a forma de pagamento." }) }),
  coupon: z.string().trim().max(40).optional(),
});

export async function placeOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser("/checkout");
    const parsed = parseForm(orderSchema, fd);
    if (!parsed.success) return parsed.state;
    const d = parsed.data;

    const limited = await rateLimit(`order:${user.id}`, 15, 3600);
    if (!limited.ok) return fail("Muitos pedidos em pouco tempo. Tente novamente mais tarde.");

    const res = await createOrder({
      userId: user.id,
      items: d.items,
      buyer: { name: d.name, document: d.document, email: d.email, whatsapp: d.whatsapp },
      couponCode: d.coupon || null,
      method: d.method,
    });
    if (!res.ok) return fail(res.error);

    // Guarda CPF/CNPJ e WhatsApp no perfil para as próximas compras.
    await db.customer.upsert({ where: { userId: user.id }, create: { userId: user.id, cpfCnpj: d.document }, update: { cpfCnpj: d.document } });
    if (!user.whatsapp) await db.user.update({ where: { id: user.id }, data: { whatsapp: d.whatsapp } });

    return ok("Pedido criado!", { redirectTo: `/pedido/${res.number}` });
  });
}

// ── Ações sobre um pedido existente ───────────────────────────

/** Simula a aprovação do pagamento — funciona SOMENTE com o provedor "sandbox" (testes). */
export async function simulatePayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser();
    const provider = getPaymentProvider();
    if (!provider.canSimulate) return fail("Simulação indisponível.");
    const payment = await db.payment.findFirst({
      where: { id: String(fd.get("paymentId")), provider: "sandbox", ...(user.role === "ADMIN" ? {} : { order: { userId: user.id } }) },
    });
    if (!payment) return fail("Pagamento não encontrado.");
    const res = await confirmPayment(payment.id);
    return res.ok ? ok("Pagamento aprovado (simulação).") : fail(res.error ?? "Falha ao aprovar.");
  });
}

export async function cancelMyOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser();
    const order = await db.order.findFirst({ where: { id: String(fd.get("orderId")), userId: user.id, status: "PENDING" } });
    if (!order) return fail("Pedido não encontrado ou já processado.");
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { status: "CANCELED" } }),
      db.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "REJECTED" } }),
    ]);
    return ok("Pedido cancelado.");
  });
}

export async function getPaymentAvailability() {
  const provider = getPaymentProvider();
  const settings = await getSettings();
  return { methods: provider.methods, notReady: provider.readiness(settings), label: provider.label, sandbox: !!provider.canSimulate };
}
