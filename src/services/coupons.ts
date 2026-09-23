import type { Coupon } from "@prisma/client";
import { db } from "@/lib/db";

export type CouponResult = { ok: true; coupon: Coupon; discountCents: number } | { ok: false; error: string };

export function computeDiscount(coupon: Pick<Coupon, "type" | "value">, subtotalCents: number): number {
  const raw = coupon.type === "PERCENT" ? Math.round((subtotalCents * coupon.value) / 100) : coupon.value;
  return Math.min(Math.max(raw, 0), subtotalCents);
}

export async function validateCoupon(code: string | null | undefined, subtotalCents: number): Promise<CouponResult> {
  const normalized = (code || "").trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Informe um cupom." };
  const coupon = await db.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) return { ok: false, error: "Cupom inválido." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, error: "Este cupom expirou." };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { ok: false, error: "Este cupom atingiu o limite de usos." };
  if (subtotalCents < coupon.minOrderCents) return { ok: false, error: "O valor do pedido não atinge o mínimo deste cupom." };
  return { ok: true, coupon, discountCents: computeDiscount(coupon, subtotalCents) };
}
