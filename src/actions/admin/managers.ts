"use server";

// Gerentes: contas com acesso somente leitura aos pedidos (entram pelo mesmo login do cliente).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import { zEmail, zName, zPassword } from "@/lib/validation";

const newManagerSchema = z.object({ name: zName, email: zEmail, password: zPassword });

export async function createManager(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(newManagerSchema, fd);
    if (!parsed.success) return parsed.state;
    const { name, email, password } = parsed.data;
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) return fail("Já existe uma conta com esse e-mail.", { email: "E-mail já cadastrado." });
    await db.user.create({ data: { name, email, passwordHash: await hashPassword(password), role: "MANAGER" } });
    revalidatePath("/admin/gerentes");
    return ok(`Gerente cadastrado. Ele entra em /entrar com ${email} e a senha que você definiu.`);
  });
}

const resetSchema = z.object({ id: z.string().min(1), password: zPassword });

export async function resetManagerPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(resetSchema, fd);
    if (!parsed.success) return parsed.state;
    const m = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!m || m.role !== "MANAGER") return fail("Gerente não encontrado.");
    // tokenVersion + 1 derruba as sessões abertas desse gerente.
    await db.user.update({ where: { id: m.id }, data: { passwordHash: await hashPassword(parsed.data.password), tokenVersion: { increment: 1 } } });
    revalidatePath("/admin/gerentes");
    return ok("Senha redefinida e sessões antigas encerradas.");
  });
}

/** Ativa/desativa (desativar também derruba as sessões abertas). Só age em contas de gerente. */
export async function toggleManagerActive(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(z.object({ id: z.string().min(1) }), fd);
    if (!parsed.success) return parsed.state;
    const m = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!m || m.role !== "MANAGER") return fail("Gerente não encontrado.");
    await db.user.update({ where: { id: m.id }, data: { active: !m.active, tokenVersion: { increment: 1 } } });
    revalidatePath("/admin/gerentes");
    return ok(m.active ? "Gerente desativado." : "Gerente reativado.");
  });
}

/** Exclui a conta de gerente (não há pedidos vinculados a ela). */
export async function deleteManager(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(z.object({ id: z.string().min(1) }), fd);
    if (!parsed.success) return parsed.state;
    const m = await db.user.findUnique({ where: { id: parsed.data.id } });
    if (!m || m.role !== "MANAGER") return fail("Gerente não encontrado.");
    await db.user.delete({ where: { id: m.id } });
    revalidatePath("/admin/gerentes");
    return ok("Gerente excluído.");
  });
}
