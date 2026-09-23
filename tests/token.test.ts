import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/token";

const secret = "segredo-de-teste-com-mais-de-32-caracteres-ok";

describe("sessão (JWT)", () => {
  it.each(["CUSTOMER", "ADMIN", "MANAGER"] as const)("aceita o papel %s", async (role) => {
    const token = await signSession({ sub: "u1", role, tv: 3 }, secret);
    expect(await verifySession(token, secret)).toEqual({ sub: "u1", role, tv: 3 });
  });

  it("recusa papel desconhecido, token adulterado e segredo errado", async () => {
    const token = await signSession({ sub: "u1", role: "MANAGER", tv: 0 }, secret);
    expect(await verifySession(token, "outro-segredo-com-mais-de-32-caracteres!!")).toBeNull();
    expect(await verifySession(token.slice(0, -2) + "xx", secret)).toBeNull();
    const forged = await signSession({ sub: "u1", role: "SUPERUSER" as never, tv: 0 }, secret);
    expect(await verifySession(forged, secret)).toBeNull();
  });
});
