"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, homePath, safeNext } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";
import { getClientIp, limitByIp, rateLimit } from "@/lib/rate-limit";
import { randomToken, sha256 } from "@/lib/security";
import { getSettings } from "@/lib/settings";
import { zEmail, zName, zPassword, zPhone } from "@/lib/validation";
import { sendMail } from "@/services/mail";
import { notifyAdmins } from "@/services/notifications";

const MIN = 60;

const registerSchema = z
  .object({
    name: zName,
    email: zEmail,
    whatsapp: zPhone,
    password: zPassword,
    confirmPassword: z.string().min(1),
    next: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não conferem." });

export async function register(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(registerSchema, fd);
    if (!parsed.success) return parsed.state;
    const { name, email, whatsapp, password, next } = parsed.data;

    const limited = await limitByIp("register", 5, 60 * MIN);
    if (limited) return fail(limited);

    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      return fail("Este e-mail já está cadastrado. Tente entrar ou recuperar a senha.", { email: "E-mail já cadastrado." });
    }
    const user = await db.user.create({
      data: { name, email, whatsapp, passwordHash: await hashPassword(password), customer: { create: {} } },
    });
    await notifyAdmins("Novo cliente cadastrado", `${name} — ${email}`, `/admin/clientes/${user.id}`).catch(() => {});
    await createSession(user);
    redirect(safeNext(next));
  });
}

const loginSchema = z.object({ email: zEmail, password: z.string().min(1, "Informe a senha.").max(200), next: z.string().optional() });

async function authenticate(email: string, password: string, adminOnly: boolean) {
  const ip = await getClientIp();
  // Limite por IP e por e-mail: dificulta força bruta e "credential stuffing".
  const [byIp, byEmail] = await Promise.all([rateLimit(`login-ip:${ip}`, 30, 15 * MIN), rateLimit(`login-email:${email}`, 6, 15 * MIN)]);
  if (!byIp.ok || !byEmail.ok) return { error: "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente." } as const;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    await burnPasswordCheck(password); // tempo de resposta equivalente
    return { error: "E-mail ou senha incorretos." } as const;
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid || (adminOnly && user.role !== "ADMIN")) return { error: "E-mail ou senha incorretos." } as const;
  if (!user.active) return { error: "Sua conta está desativada. Fale com o suporte." } as const;
  return { user } as const;
}

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(loginSchema, fd);
    if (!parsed.success) return parsed.state;
    const res = await authenticate(parsed.data.email, parsed.data.password, false);
    if (res.error !== undefined) return fail(res.error);
    await createSession(res.user);
    redirect(homePath(res.user.role, parsed.data.next));
  });
}

export async function adminLogin(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(loginSchema, fd);
    if (!parsed.success) return parsed.state;
    const res = await authenticate(parsed.data.email, parsed.data.password, true);
    if (res.error !== undefined) return fail(res.error);
    await createSession(res.user);
    redirect("/admin");
  });
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ── Recuperação de senha ──────────────────────────────────────

const forgotSchema = z.object({ email: zEmail });

export async function forgotPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(forgotSchema, fd);
    if (!parsed.success) return parsed.state;
    const { email } = parsed.data;

    const limited = await limitByIp("forgot", 5, 60 * MIN);
    if (limited) return fail(limited);
    const perEmail = await rateLimit(`forgot-email:${email}`, 3, 60 * MIN);

    const generic = ok("Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.");
    if (!perEmail.ok) return generic;

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.active) return generic; // não revela se o e-mail existe

    const token = randomToken(32);
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * MIN * 1000) },
    });
    const settings = await getSettings();
    const link = `${appUrl()}/redefinir-senha?token=${token}`;
    await sendMail({
      to: user.email,
      subject: `Redefinição de senha — ${settings.companyName}`,
      text: `Olá, ${user.name.split(" ")[0]}!\n\nRecebemos um pedido para redefinir sua senha. Use o link abaixo (válido por 1 hora):\n\n${link}\n\nSe você não fez esse pedido, ignore este e-mail.\n\n${settings.companyName}`,
    });
    return generic;
  });
}

const resetSchema = z
  .object({ token: z.string().min(20).max(200), password: zPassword, confirmPassword: z.string().min(1) })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "As senhas não conferem." });

export async function resetPassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(resetSchema, fd);
    if (!parsed.success) return parsed.state;

    const limited = await limitByIp("reset", 10, 60 * MIN);
    if (limited) return fail(limited);

    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return fail("Link inválido ou expirado. Solicite uma nova redefinição.");
    }
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data.password), tokenVersion: { increment: 1 } } }),
      db.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
    ]);
    await destroySession();
    return ok("Senha redefinida! Faça login com a nova senha.", { redirectTo: "/entrar" });
  });
}
