// Assinatura/verificação do JWT de sessão. Compatível com o runtime Edge (middleware).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ep_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export type Role = "CUSTOMER" | "ADMIN" | "MANAGER";
export type SessionPayload = { sub: string; role: Role; tv: number };

const key = (secret: string) => new TextEncoder().encode(secret);

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ role: payload.role, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key(secret));
}

export async function verifySession(token: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    if (!payload.sub || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN" && payload.role !== "MANAGER")) return null;
    return { sub: payload.sub, role: payload.role, tv: Number(payload.tv ?? 0) };
  } catch {
    return null;
  }
}
