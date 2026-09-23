import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/cliente", "/api", "/checkout", "/carrinho", "/pedido", "/entrar", "/cadastro", "/esqueci-senha", "/redefinir-senha"] }],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
