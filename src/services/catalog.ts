import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { effectivePriceCents } from "@/utils/pricing";

export type Rating = { avg: number; count: number };

export async function getRatings(productIds: string[]): Promise<Map<string, Rating>> {
  if (productIds.length === 0) return new Map();
  const rows = await db.productReview.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.productId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

export type ProductFilters = {
  q?: string;
  category?: string;
  sort?: "recent" | "price-asc" | "price-desc" | "name";
  page?: number;
  pageSize?: number;
};

export async function listProducts(filters: ProductFilters = {}) {
  const { q, category, sort = "recent", page = 1, pageSize = 12 } = filters;
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc" ? { priceCents: "asc" } : sort === "price-desc" ? { priceCents: "desc" } : sort === "name" ? { name: "asc" } : { createdAt: "desc" };

  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  const ratings = await getRatings(items.map((i) => i.id));
  return {
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    items: items.map((p) => ({ ...p, rating: ratings.get(p.id) ?? { avg: 0, count: 0 }, price: effectivePriceCents(p) })),
  };
}

export async function listProductCategories(): Promise<string[]> {
  const rows = await db.product.findMany({ where: { active: true }, distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } });
  return rows.map((r) => r.category);
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findFirst({ where: { slug, active: true } });
  if (!product) return null;
  const [ratings, reviews, related] = await Promise.all([
    getRatings([product.id]),
    db.productReview.findMany({ where: { productId: product.id }, orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } }),
    db.product.findMany({ where: { active: true, id: { not: product.id }, category: product.category }, take: 4, orderBy: { createdAt: "desc" } }),
  ]);
  const relatedRatings = await getRatings(related.map((r) => r.id));
  return {
    product,
    rating: ratings.get(product.id) ?? { avg: 0, count: 0 },
    reviews,
    related: related.map((p) => ({ ...p, rating: relatedRatings.get(p.id) ?? { avg: 0, count: 0 }, price: effectivePriceCents(p) })),
  };
}

export type ProductCardData = Awaited<ReturnType<typeof listProducts>>["items"][number];

export const listActiveServices = () => db.service.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
export const listActivePortfolio = () => db.portfolioItem.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
export const listActivePlans = () => db.plan.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }] });
