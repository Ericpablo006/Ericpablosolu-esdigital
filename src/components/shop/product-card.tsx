import Link from "next/link";
import { Cover } from "@/components/ui/cover";
import { Badge, Stars } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { BuyNowButton } from "@/components/cart/buy-buttons";
import type { ProductCardData } from "@/services/catalog";
import { formatBRL } from "@/utils/money";
import { discountPercent, isOnPromo } from "@/utils/pricing";

export function ProductCard({ product: p }: { product: ProductCardData }) {
  const promo = isOnPromo(p);
  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      <Link href={`/produtos/${p.slug}`} className="relative block" aria-label={`Ver ${p.name}`}>
        <Cover src={p.images[0]} alt={p.name} category={p.category} seed={p.slug} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="aspect-[16/10] transition duration-500 group-hover:scale-[1.03]" />
        {promo && <Badge tone="green" className="absolute left-3 top-3 bg-ink/80 backdrop-blur">-{discountPercent(p)}% OFF</Badge>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Badge tone="blue" className="self-start">{p.category}</Badge>
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link href={`/produtos/${p.slug}`} className="transition hover:text-sky">{p.name}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-steel">{p.shortDescription || p.description}</p>
        <div className="mt-3"><Stars value={p.rating.avg} count={p.rating.count} /></div>
        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white">{formatBRL(p.price)}</span>
            {promo && <span className="text-sm text-steel line-through">{formatBRL(p.priceCents)}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href={`/produtos/${p.slug}`} className={buttonClass("outline", "sm")}>Ver produto</Link>
            <BuyNowButton productId={p.id} size="sm" label="Comprar" />
          </div>
        </div>
      </div>
    </article>
  );
}
