"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, requireUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { zName, zOptText, zPassword, zPhone } from "@/lib/validation";
import { isValidCpfCnpj } from "@/utils/validators";
import { onlyDigits } from "@/utils/format";

const profileSchema = z.object({
  name: zName,
  whatsapp: zPhone,
  company: zOptText(150),
  cpfCnpj: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? onlyDigits(v) : null))
    .refine((v) => v === null || isValidCpfCnpj(v), "CPF/CNPJ inválido."),
});

export async function updateProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser("/cliente/perfil");
    const parsed = parseForm(profileSchema, fd);
    if (!parsed.success) return parsed.state;
    const { name, whatsapp, company, cpfCnpj } = parsed.data;
    await db.user.update({ where: { id: user.id }, data: { name, whatsapp } });
    await db.customer.upsert({ where: { userId: user.id }, create: { userId: user.id, company, cpfCnpj }, update: { company, cpfCnpj } });
    revalidatePath("/cliente", "layout");
    return ok("Perfil atualizado.");
  });
}

const passwordSchema = z
  .object({ current: z.string().min(1, "Informe a senha atual."), password: zPassword, confirmPassword: z.string().min(1) })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não conferem." });

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser("/cliente/perfil");
    const parsed = parseForm(passwordSchema, fd);
    if (!parsed.success) return parsed.state;

    const limit = await rateLimit(`pwd:${user.id}`, 5, 900);
    if (!limit.ok) return fail("Muitas tentativas. Aguarde alguns minutos.");

    const record = await db.user.findUnique({ where: { id: user.id } });
    if (!record || !(await verifyPassword(parsed.data.current, record.passwordHash))) {
      return fail("Senha atual incorreta.", { current: "Senha atual incorreta." });
    }
    // Incrementa a versão do token: encerra as outras sessões abertas. Reemite a sessão atual.
    const updated = await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password), tokenVersion: { increment: 1 } } });
    await createSession(updated);
    return ok("Senha alterada. Outras sessões foram encerradas.");
  });
}
