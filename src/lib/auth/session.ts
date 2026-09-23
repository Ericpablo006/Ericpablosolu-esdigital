import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAuthSecret, useSecureCookies } from "@/lib/env";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type Role } from "./token";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  role: Role;
};

/** Página inicial de cada perfil depois do login (o login é o mesmo para todos: /entrar). */
export function homePath(role: Role, next?: string | null): string {
  return role === "ADMIN" ? "/admin" : role === "MANAGER" ? "/gerente" : safeNext(next);
}

export async function createSession(user: { id: string; role: Role; tokenVersion: number }) {
  const token = await signSession({ sub: user.id, role: user.role, tv: user.tokenVersion }, getAuthSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // inacessível para JavaScript (mitiga roubo via XSS)
    sameSite: "lax", // mitiga CSRF
    secure: useSecureCookies(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Usuário logado, validado no banco a cada requisição
 * (conta ativa + versão do token → permite revogar sessões).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token, getAuthSecret());
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, whatsapp: true, role: true, active: true, tokenVersion: true },
  });
  if (!user || !user.active || user.tokenVersion !== payload.tv) return null;
  return { id: user.id, name: user.name, email: user.email, whatsapp: user.whatsapp, role: user.role };
});

export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

/** Área do gerente (somente leitura de pedidos). O administrador também pode entrar para conferir. */
export async function requireManager(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=%2Fgerente");
  if (user.role !== "MANAGER" && user.role !== "ADMIN") redirect("/cliente");
  return user;
}

/** Aceita somente caminhos internos (evita open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/cliente"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
