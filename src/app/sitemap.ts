import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const now = new Date();
  const staticRoutes = ["", "/servicos", "/produtos", "/portfolio", "/planos", "/sobre", "/contato", "/orcamento"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const products = await db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } }).catch(() => []);
  return [
    ...staticRoutes,
    ...products.map((p) => ({ url: `${base}/produtos/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
