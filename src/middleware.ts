import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

// Primeira barreira (rápida, no edge): exige sessão válida nas áreas protegidas.
// A checagem definitiva (usuário ativo, papel, versão do token) é feita no servidor
// por requireUser()/requireAdmin() em cada página e ação.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET || "");

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Gerente: só a área /gerente (consulta de pedidos). O administrador também pode entrar.
  if (pathname.startsWith("/gerente")) {
    if (!session || (session.role !== "MANAGER" && session.role !== "ADMIN")) {
      const url = new URL("/entrar", req.url);
      url.searchParams.set("next", "/gerente");
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/cliente")) {
    if (!session) {
      const url = new URL("/entrar", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === "MANAGER") return NextResponse.redirect(new URL("/gerente", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/cliente/:path*", "/gerente/:path*"] };
