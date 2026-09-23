import type { PaymentMethod } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { effectivePriceCents } from "@/utils/pricing";
import { orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { validateCoupon } from "@/services/coupons";
import { getPaymentProvider } from "@/services/payments";
import { confirmPayment } from "@/services/payments/confirm";
import { notifyAdmins } from "@/services/notifications";
import { emailCompany } from "@/services/mail";

export type CartLine = { productId: string; quantity: number };
export type Buyer = { name: string; document: string; email: string; whatsapp: string };

export type PricedCart = {
  lines: { productId: string; name: string; slug: string; image: string | null; unitPriceCents: number; quantity: number }[];
  subtotalCents: number;
};

/** Recalcula o carrinho no servidor com preços do banco — nunca confia em valores do navegador. */
export async function priceCart(items: CartLine[]): Promise<PricedCart | { error: string }> {
  const merged = new Map<string, number>();
  for (const i of items) {
    const q = Math.min(Math.max(Math.floor(i.quantity), 1), 10);
    merged.set(i.productId, Math.min((merged.get(i.productId) ?? 0) + q, 10));
  }
  if (merged.size === 0) return { error: "Seu carrinho está vazio." };
  const products = await db.product.findMany({ where: { id: { in: [...merged.keys()] }, active: true } });
  if (products.length !== merged.size) return { error: "Um ou mais produtos não estão mais disponíveis. Atualize o carrinho." };
  const lines = products.map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0] ?? null,
    unitPriceCents: effectivePriceCents(p),
    quantity: merged.get(p.id) as number,
  }));
  return { lines, subtotalCents: lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0) };
}

export async function createOrder(params: {
  userId: string;
  items: CartLine[];
  buyer: Buyer;
  couponCode?: string | null;
  method: PaymentMethod;
}): Promise<{ ok: true; number: number } | { ok: false; error: string }> {
  const provider = getPaymentProvider();
  const settings = await getSettings();
  const notReady = provider.readiness(settings);
  if (notReady) return { ok: false, error: notReady };
  if (!provider.methods.includes(params.method)) return { ok: false, error: "Forma de pagamento indisponível no momento." };

  const cart = await priceCart(params.items);
  if ("error" in cart) return { ok: false, error: cart.error };

  let discountCents = 0;
  let couponId: string | null = null;
  if (params.couponCode?.trim()) {
    const c = await validateCoupon(params.couponCode, cart.subtotalCents);
    if (!c.ok) return { ok: false, error: c.error };
    discountCents = c.discountCents;
    couponId = c.coupon.id;
  }
  const totalCents = Math.max(cart.subtotalCents - discountCents, 0);

  const { order, payment } = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: params.userId,
        subtotalCents: cart.subtotalCents,
        discountCents,
        totalCents,
        couponId,
        buyerName: params.buyer.name,
        buyerDocument: params.buyer.document,
        buyerEmail: params.buyer.email,
        buyerWhatsapp: params.buyer.whatsapp,
        items: {
          create: cart.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            unitPriceCents: l.unitPriceCents,
            quantity: l.quantity,
          })),
        },
      },
    });
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        userId: params.userId,
        amountCents: totalCents,
        method: params.method,
        provider: provider.id,
        description: `Pedido ${orderNumber(order.number)}`,
      },
    });
    return { order, payment };
  });

  if (totalCents === 0) {
    // Cupom de 100%: aprova sem cobrança.
    await db.payment.update({ where: { id: payment.id }, data: { provider: "coupon", method: "OTHER" } });
    await confirmPayment(payment.id);
  } else {
    try {
      const charge = await provider.createCharge({
        paymentId: payment.id,
        orderNumber: order.number,
        amountCents: totalCents,
        method: params.method,
        buyer: params.buyer,
        settings,
      });
      await db.payment.update({
        where: { id: payment.id },
        data: { providerRef: charge.providerRef ?? null, providerData: charge.data as object },
      });
      if (charge.approved) await confirmPayment(payment.id);
    } catch (err) {
      console.error("[createOrder] falha ao criar cobrança", err);
      await db.payment.update({ where: { id: payment.id }, data: { status: "REJECTED" } });
      await db.order.update({ where: { id: order.id }, data: { status: "CANCELED" } });
      return { ok: false, error: "Não foi possível gerar a cobrança. Tente novamente ou fale conosco." };
    }
  }

  const label = orderNumber(order.number);
  await notifyAdmins("Novo pedido", `${label} — ${params.buyer.name} — ${formatBRL(totalCents)}`, `/admin/pedidos/${order.id}`).catch(() => {});
  void emailCompany(`Novo pedido ${label}`, `${params.buyer.name} (${params.buyer.email}) — ${formatBRL(totalCents)}`);
  return { ok: true, number: order.number };
}
