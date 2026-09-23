"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { zOptText } from "@/lib/validation";
import { emailCompany } from "@/services/mail";
import { notifyAdmins, notifyUser } from "@/services/notifications";
import { ticketNumber } from "@/utils/format";

const createSchema = z.object({
  subject: z.string().trim().min(3, "Informe o assunto.").max(150),
  projectId: zOptText(40),
  message: z.string().trim().min(5, "Descreva sua solicitação.").max(5000),
});

export async function createTicket(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser("/cliente/suporte");
    const parsed = parseForm(createSchema, fd);
    if (!parsed.success) return parsed.state;
    const { subject, projectId, message } = parsed.data;

    const limit = await rateLimit(`ticket:${user.id}`, 10, 3600);
    if (!limit.ok) return fail("Você abriu muitos chamados em pouco tempo. Tente mais tarde.");

    // O projeto vinculado precisa ser do próprio cliente.
    if (projectId && !(await db.project.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } }))) {
      return fail("Projeto inválido.", { projectId: "Projeto inválido." });
    }
    const ticket = await db.supportTicket.create({
      data: { userId: user.id, projectId, subject, messages: { create: { authorId: user.id, body: message } } },
    });
    await notifyAdmins("Novo chamado de suporte", `${ticketNumber(ticket.number)} — ${subject}`, `/admin/suporte/${ticket.id}`).catch(() => {});
    void emailCompany(`Novo chamado ${ticketNumber(ticket.number)}: ${subject}`, `${user.name} (${user.email})\n\n${message}`);
    revalidatePath("/cliente/suporte");
    return ok("Chamado aberto! Responderemos em breve.", { redirectTo: `/cliente/suporte/${ticket.id}` });
  });
}

const replySchema = z.object({ ticketId: z.string().min(1), body: z.string().trim().min(2, "Escreva uma mensagem.").max(5000) });

export async function replyTicketAsCustomer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser("/cliente/suporte");
    const parsed = parseForm(replySchema, fd);
    if (!parsed.success) return parsed.state;
    const ticket = await db.supportTicket.findFirst({ where: { id: parsed.data.ticketId, userId: user.id } });
    if (!ticket) return fail("Chamado não encontrado.");
    const limit = await rateLimit(`reply:${user.id}`, 30, 3600);
    if (!limit.ok) return fail("Muitas mensagens em pouco tempo.");

    await db.$transaction([
      db.message.create({ data: { ticketId: ticket.id, authorId: user.id, body: parsed.data.body } }),
      db.supportTicket.update({ where: { id: ticket.id }, data: { status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status } }),
    ]);
    await notifyAdmins("Nova resposta em chamado", `${ticketNumber(ticket.number)} — ${ticket.subject}`, `/admin/suporte/${ticket.id}`).catch(() => {});
    revalidatePath(`/cliente/suporte/${ticket.id}`);
    return ok("Mensagem enviada.");
  });
}

export async function replyTicketAsAdmin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const admin = await requireAdmin();
    const parsed = parseForm(replySchema, fd);
    if (!parsed.success) return parsed.state;
    const ticket = await db.supportTicket.findUnique({ where: { id: parsed.data.ticketId } });
    if (!ticket) return fail("Chamado não encontrado.");
    await db.$transaction([
      db.message.create({ data: { ticketId: ticket.id, authorId: admin.id, body: parsed.data.body, isStaff: true } }),
      db.supportTicket.update({ where: { id: ticket.id }, data: { status: ticket.status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS" } }),
    ]);
    await notifyUser(ticket.userId, "Resposta do suporte", `${ticketNumber(ticket.number)} — ${ticket.subject}`, `/cliente/suporte/${ticket.id}`).catch(() => {});
    revalidatePath(`/admin/suporte/${ticket.id}`);
    return ok("Resposta enviada.");
  });
}

const statusSchema = z.object({ ticketId: z.string().min(1), status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]) });

export async function setTicketStatus(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser();
    const parsed = parseForm(statusSchema, fd);
    if (!parsed.success) return parsed.state;
    const ticket = await db.supportTicket.findUnique({ where: { id: parsed.data.ticketId } });
    if (!ticket || (user.role !== "ADMIN" && ticket.userId !== user.id)) return fail("Chamado não encontrado.");
    // Cliente só pode marcar como resolvido ou reabrir.
    if (user.role !== "ADMIN" && parsed.data.status === "IN_PROGRESS") return fail("Ação não permitida.");
    await db.supportTicket.update({ where: { id: ticket.id }, data: { status: parsed.data.status } });
    if (user.role === "ADMIN") await notifyUser(ticket.userId, "Chamado atualizado", `${ticketNumber(ticket.number)} — ${ticket.subject}`, `/cliente/suporte/${ticket.id}`).catch(() => {});
    revalidatePath("/admin/suporte");
    revalidatePath("/cliente/suporte");
    return ok("Status atualizado.");
  });
}
