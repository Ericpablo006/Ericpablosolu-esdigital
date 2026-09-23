type Priced = { priceCents: number; promoPriceCents: number | null; promoEndsAt: Date | null };

export function isOnPromo(p: Priced, now = new Date()): boolean {
  return (
    p.promoPriceCents !== null &&
    p.promoPriceCents >= 0 &&
    p.promoPriceCents < p.priceCents &&
    (!p.promoEndsAt || new Date(p.promoEndsAt) > now)
  );
}

/** Preço realmente cobrado (considera promoção vigente). */
export function effectivePriceCents(p: Priced, now = new Date()): number {
  return isOnPromo(p, now) ? (p.promoPriceCents as number) : p.priceCents;
}

export function discountPercent(p: Priced): number {
  return isOnPromo(p) ? Math.round((1 - (p.promoPriceCents as number) / p.priceCents) * 100) : 0;
}
