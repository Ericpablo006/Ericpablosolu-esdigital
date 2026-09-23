"use server";

// Clientes, pedidos, orçamentos, projetos, financeiro/recibos e configurações.
import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { SETTING_DEFAULTS, SETTING_KEYS, type SettingKey } from "@/lib/settings";
import { zBool, zEmail, zImageRef, zInt, zMoney, zMoneyOptional, zName, zOptDateInput, zOptText, zPhone } from "@/lib/validation";
import { confirmPayment, refundPayment } from "@/services/payments/confirm";
import { notifyUser } from "@/services/notifications";
import { PROJECT_STATUS, QUOTE_STATUS } from "@/types/labels";
import { fromInputDate, onlyDigits, quoteNumber } from "@/utils/format";
import { isValidCpfCnpj } from "@/utils/validators";

const idSchema = z.object({ id: z.string().min(1) });

// ── Clientes ─────────────────────────────────────────────────

const newCustomerSchema = z.object({
  name: zName,
  email: zEmail,
  whatsapp: zPhone,
  company: zOptText(150),
  cpfCnpj: z.string().trim().optional().transform((v) => (v ? onlyDigits(v) : null)).refine((v) => v === null || isValidCpfCnpj(v), "CPF/CNPJ inválido."),
});

/** Cria a conta de um cliente (ex.: quem contratou por fora). A senha temporária é exibida UMA vez. */
export async function createCustomer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(newCustomerSchema, fd);
    if (!parsed.success) return parsed.state;
    const { company, cpfCnpj, ...u } = parsed.data;
    if (await db.user.findUnique({ where: { email: u.email } })) return fail("Já existe uma conta com esse e-mail.", { email: "E-mail já cadastrado." });

    const temp = `Ep${randomBytes(6).toString("base64url")}9`;
    await db.user.create({ data: { ...u, passwordHash: await hashPassword(temp), customer: { create: { company, cpfCnpj } } } });
    revalidatePath("/admin/clientes");
    return ok(`Cliente criado. Senha temporária (anote agora, ela não será exibida novamente): ${temp} — o cliente pode trocá-la em "Meu perfil".`);
  });
}

export async function toggleUserActive(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const admin = await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    if (parsed.data.id === admin.id) return fail("Você não pode desativar a própria conta.");
    const u = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!u) return fail("Usuário não encontrado.");
    // Ao desativar, incrementa tokenVersion para derrubar as sessões ativas.
    await db.user.update({ where: { id: u.id }, data: { active: !u.active, tokenVersion: { increment: 1 } } });
    revalidatePath("/admin/clientes");
    return ok(u.active ? "Conta desativada." : "Conta reativada.");
  });
}

export async function setUserRole(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const admin = await requireAdmin();
    const parsed = parseForm(z.object({ id: z.string().min(1), role: z.enum(["ADMIN", "CUSTOMER"]) }), fd);
    if (!parsed.success) return parsed.state;
    if (parsed.data.id === admin.id) return fail("Você não pode alterar o próprio papel.");
    const u = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!u) return fail("Usuário não encontrado.");
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: u.id }, data: { role: parsed.data.role, tokenVersion: { increment: 1 } } });
      if (parsed.data.role === "ADMIN") await tx.admin.upsert({ where: { userId: u.id }, create: { userId: u.id, title: "Administrador" }, update: {} });
      else await tx.admin.deleteMany({ where: { userId: u.id } });
    });
    revalidatePath("/admin/clientes");
    return ok(parsed.data.role === "ADMIN" ? "Usuário agora é administrador." : "Acesso administrativo removido.");
  });
}

export async function saveCustomerNotes(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(z.object({ id: z.string().min(1), notes: zOptText(3000) }), fd);
    if (!parsed.success) return parsed.state;
    await db.customer.upsert({ where: { userId: parsed.data.id }, create: { userId: parsed.data.id, notes: parsed.data.notes }, update: { notes: parsed.data.notes } });
    revalidatePath(`/admin/clientes/${parsed.data.id}`);
    return ok("Anotações salvas.");
  });
}

// ── Pedidos ──────────────────────────────────────────────────

export async function confirmOrderPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const payment = await db.payment.findFirst({ where: { orderId: parsed.data.id, status: { in: ["PENDING", "REJECTED"] } }, orderBy: { createdAt: "desc" } });
    if (!payment) return fail("Nenhum pagamento pendente para este pedido.");
    const res = await confirmPayment(payment.id);
    revalidatePath("/admin/pedidos");
    revalidatePath("/admin");
    return res.ok ? ok("Pagamento confirmado. Downloads liberados ao cliente.") : fail(res.error ?? "Falha ao confirmar.");
  });
}

export async function adminCancelOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const order = await db.order.findUnique({ where: { id: parsed.data.id } });
    if (!order || order.status !== "PENDING") return fail("Só pedidos pendentes podem ser cancelados.");
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { status: "CANCELED" } }),
      db.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "REJECTED" } }),
    ]);
    revalidatePath("/admin/pedidos");
    return ok("Pedido cancelado.");
  });
}

export async function adminRefundOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const payment = await db.payment.findFirst({ where: { orderId: parsed.data.id, status: "APPROVED" } });
    if (!payment) return fail("Nenhum pagamento aprovado neste pedido.");
    const res = await refundPayment(payment.id);
    revalidatePath("/admin/pedidos");
    return res.ok ? ok("Pagamento estornado e downloads revogados.") : fail(res.error ?? "Falha ao estornar.");
  });
}

// ── Orçamentos ───────────────────────────────────────────────

const quoteSchema = z.object({
  id: z.string().min(1),
  status: z.enum(Object.keys(QUOTE_STATUS) as [string, ...string[]]),
  estimated: zMoneyOptional,
  adminNotes: zOptText(3000),
});

export async function updateQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(quoteSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, estimated, ...d } = parsed.data;
    const q = await db.quote.findUnique({ where: { id } });
    if (!q) return fail("Orçamento não encontrado.");
    await db.quote.update({ where: { id }, data: { ...d, status: d.status as never, estimatedCents: estimated } });
    if (q.status !== d.status) {
      const target = q.userId ?? (await db.user.findUnique({ where: { email: q.email }, select: { id: true } }))?.id;
      if (target) await notifyUser(target, "Orçamento atualizado", `${quoteNumber(q.number)}: ${QUOTE_STATUS[d.status].label}`, "/cliente/orcamentos").catch(() => {});
    }
    revalidatePath("/admin/orcamentos");
    revalidatePath("/admin");
    return ok("Orçamento atualizado.", { redirectTo: "/admin/orcamentos" });
  });
}

export async function deleteQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.quote.deleteMany({ where: { id: parsed.data.id } });
    revalidatePath("/admin/orcamentos");
    return ok("Orçamento excluído.", { redirectTo: "/admin/orcamentos" });
  });
}

// ── Projetos ─────────────────────────────────────────────────

const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(150),
  description: zOptText(3000),
  userId: z.string().min(1, "Selecione o cliente."),
  serviceId: zOptText(40),
  quoteId: zOptText(40),
  status: z.enum(Object.keys(PROJECT_STATUS) as [string, ...string[]]),
  progress: zInt(0, 100),
  deadline: zOptDateInput,
  value: zMoney,
});

export async function saveProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(projectSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, deadline, value, ...d } = parsed.data;
    if (!(await db.user.findUnique({ where: { id: d.userId }, select: { id: true } }))) return fail("Cliente não encontrado.", { userId: "Cliente inválido." });

    const data = {
      ...d,
      status: d.status as never,
      progress: d.status === "DONE" ? 100 : d.progress,
      deadline: deadline ? fromInputDate(deadline) : null,
      valueCents: value,
    };
    if (id) {
      const before = await db.project.findUnique({ where: { id } });
      if (!before) return fail("Projeto não encontrado.");
      await db.project.update({ where: { id }, data });
      if (before.status !== data.status || before.progress !== data.progress) {
        await notifyUser(d.userId, "Projeto atualizado", `${d.title}: ${PROJECT_STATUS[d.status].label} (${data.progress}%)`, "/cliente/projetos").catch(() => {});
      }
    } else {
      await db.project.create({ data });
      await notifyUser(d.userId, "Novo projeto criado", d.title, "/cliente/projetos").catch(() => {});
      if (d.quoteId) await db.quote.updateMany({ where: { id: d.quoteId, status: { in: ["NEW", "ANALYZING", "SENT"] } }, data: { status: "APPROVED" } });
    }
    revalidatePath("/admin/projetos");
    revalidatePath("/cliente/projetos");
    return ok(id ? "Projeto atualizado." : "Projeto criado.", { redirectTo: "/admin/projetos" });
  });
}

export async function deleteProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.project.deleteMany({ where: { id: parsed.data.id } });
    revalidatePath("/admin/projetos");
    return ok("Projeto excluído.", { redirectTo: "/admin/projetos" });
  });
}

// ── Financeiro: pagamentos avulsos e recibos ─────────────────

const paymentSchema = z.object({
  userId: zOptText(40),
  projectId: zOptText(40),
  description: z.string().trim().min(3, "Descreva o pagamento.").max(200),
  amount: zMoney,
  method: z.enum(["PIX", "CARD", "BOLETO", "CASH", "TRANSFER", "OTHER"]),
  approved: zBool,
});

export async function registerPayment(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(paymentSchema, fd);
    if (!parsed.success) return parsed.state;
    const { amount, approved, ...d } = parsed.data;
    if (amount <= 0) return fail("O valor deve ser maior que zero.", { amount: "Informe um valor maior que zero." });

    let userId = d.userId;
    if (d.projectId) {
      const project = await db.project.findUnique({ where: { id: d.projectId } });
      if (!project) return fail("Projeto não encontrado.");
      userId = project.userId;
    }
    const payment = await db.payment.create({ data: { ...d, userId, amountCents: amount, provider: "manual", status: "PENDING" } });
    if (approved) await confirmPayment(payment.id);
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin");
    return ok(approved ? "Pagamento registrado e confirmado." : "Pagamento registrado como pendente.");
  });
}

export async function confirmPaymentById(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const res = await confirmPayment(parsed.data.id);
    revalidatePath("/admin/pagamentos");
    return res.ok ? ok("Pagamento confirmado.") : fail(res.error ?? "Falha ao confirmar.");
  });
}

export async function refundPaymentById(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const res = await refundPayment(parsed.data.id);
    revalidatePath("/admin/pagamentos");
    return res.ok ? ok("Pagamento estornado.") : fail(res.error ?? "Falha ao estornar.");
  });
}

const receiptSchema = z.object({
  userId: zOptText(40),
  customerName: z.string().trim().min(2, "Informe o cliente.").max(150),
  customerDocument: z.string().trim().optional().transform((v) => (v ? onlyDigits(v) : null)).refine((v) => v === null || isValidCpfCnpj(v), "CPF/CNPJ inválido."),
  description: z.string().trim().min(3, "Descreva o serviço.").max(500),
  amount: zMoney,
  method: z.enum(["PIX", "CARD", "BOLETO", "CASH", "TRANSFER", "OTHER"]),
  issuedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
});

export async function createReceipt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(receiptSchema, fd);
    if (!parsed.success) return parsed.state;
    const { amount, issuedAt, ...d } = parsed.data;
    if (amount <= 0) return fail("O valor deve ser maior que zero.", { amount: "Informe um valor maior que zero." });
    await db.receipt.create({ data: { ...d, amountCents: amount, issuedAt: fromInputDate(issuedAt) } });
    revalidatePath("/admin/pagamentos/recibos");
    return ok("Recibo gerado! Baixe o PDF na lista abaixo.");
  });
}

export async function deleteReceipt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.receipt.deleteMany({ where: { id: parsed.data.id } });
    revalidatePath("/admin/pagamentos/recibos");
    return ok("Recibo excluído.");
  });
}

// ── Mensagens de contato ─────────────────────────────────────

export async function toggleContactHandled(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const m = await db.contactMessage.findUnique({ where: { id: parsed.data.id } });
    if (!m) return fail("Mensagem não encontrada.");
    await db.contactMessage.update({ where: { id: m.id }, data: { handled: !m.handled } });
    revalidatePath("/admin/suporte");
    return ok(m.handled ? "Marcada como pendente." : "Marcada como atendida.");
  });
}

export async function deleteContactMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.contactMessage.deleteMany({ where: { id: parsed.data.id } });
    revalidatePath("/admin/suporte");
    return ok("Mensagem excluída.");
  });
}

// ── Configurações do site ────────────────────────────────────

const text = (max: number) => z.string().trim().max(max).default("");
const settingsSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  slogan: text(160),
  tagline: text(160),
  logoUrl: zImageRef.transform((v) => v ?? ""),
  whatsapp: z.string().trim().default("").transform(onlyDigits).refine((v) => v === "" || (v.length >= 10 && v.length <= 13), "WhatsApp inválido (use DDD + número)."),
  instagram: text(200),
  email: z.string().trim().toLowerCase().max(190).default("").refine((v) => v === "" || z.string().email().safeParse(v).success, "E-mail inválido."),
  companyDocument: z.string().trim().default("").transform(onlyDigits).refine((v) => v === "" || isValidCpfCnpj(v), "CPF/CNPJ inválido."),
  companyCity: text(60),
  heroTitle: z.string().trim().min(5).max(160),
  heroSubtitle: text(400),
  solutionsTitle: text(160),
  aboutTitle: text(160),
  aboutText: text(2000),
  mission: text(1000),
  vision: text(1000),
  values: text(1000),
  seoDescription: text(300),
  pixKey: text(140),
  pixReceiverName: text(25),
});

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(settingsSchema, fd);
    if (!parsed.success) return parsed.state;
    const values = parsed.data as Record<string, string>;
    await db.$transaction(
      SETTING_KEYS.filter((k) => k in values).map((key: SettingKey) =>
        db.setting.upsert({ where: { key }, create: { key, value: values[key] ?? SETTING_DEFAULTS[key] }, update: { value: values[key] ?? SETTING_DEFAULTS[key] } }),
      ),
    );
    revalidateTag("settings");
    revalidatePath("/", "layout");
    return ok("Configurações salvas.");
  });
}
