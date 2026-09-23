import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, ListChecks, PackageOpen, ShieldCheck, Wrench } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/icons";
import { AddToCartButton, BuyNowButton } from "@/components/cart/buy-buttons";
import { Gallery } from "@/components/shop/gallery";
import { ReviewForm } from "@/components/shop/review-form";
import { ProductCard } from "@/components/shop/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Stars } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { jsonLd } from "@/lib/utils";
import { getProductBySlug } from "@/services/catalog";
import { formatDate, whatsappUrl } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { discountPercent, effectivePriceCents, isOnPromo } from "@/utils/pricing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const p = await db.product.findFirst({ where: { slug, active: true } });
  if (!p) return { title: "Produto não encontrado" };
  return pageMetadata({ title: p.name, description: p.shortDescription || p.description.slice(0, 155), path: `/produtos/${p.slug}`, image: p.images[0] });
}

function Section({ icon: Icon, title, items }: { icon: typeof ListChecks; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="card p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold">
        <Icon className="h-5 w-5 text-sky" aria-hidden /> {title}
      </h2>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-silver">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden /> {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [data, settings, user] = await Promise.all([getProductBySlug(slug), getSettings(), getCurrentUser()]);
  if (!data) notFound();
  const { product: p, rating, reviews, related } = data;

  const price = effectivePriceCents(p);
  const promo = isOnPromo(p);
  const canReview = user ? !!(await db.download.findFirst({ where: { userId: user.id, productId: p.id, order: { status: "PAID" } }, select: { id: true } })) : false;

  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.shortDescription || p.description,
    category: p.category,
    ...(p.images[0] ? { image: p.images[0].startsWith("http") ? p.images[0] : `${appUrl()}${p.images[0]}` } : {}),
    offers: { "@type": "Offer", priceCurrency: "BRL", price: (price / 100).toFixed(2), availability: "https://schema.org/InStock", url: `${appUrl()}/produtos/${p.slug}` },
    ...(rating.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.avg.toFixed(1), reviewCount: rating.count } } : {}),
  };

  return (
    <div className="pt-28 md:pt-32">
      <div className="container-x">
        <nav aria-label="Você está em" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-steel">
          <Link href="/" className="hover:text-white">Home</Link><ChevronRight className="h-3.5 w-3.5" />
          <Link href="/produtos" className="hover:text-white">Produtos</Link><ChevronRight className="h-3.5 w-3.5" />
          <span className="text-silver">{p.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <Gallery images={p.images} name={p.name} category={p.category} seed={p.slug} />

          <div>
            <Badge tone="blue">{p.category}</Badge>
            <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{p.name}</h1>
            <div className="mt-3"><Stars value={rating.avg} count={rating.count} size={16} /></div>
            {p.shortDescription && <p className="mt-4 text-lg leading-relaxed text-silver">{p.shortDescription}</p>}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-white">{formatBRL(price)}</span>
              {promo && (
                <>
                  <span className="text-lg text-steel line-through">{formatBRL(p.priceCents)}</span>
                  <Badge tone="green">-{discountPercent(p)}% OFF</Badge>
                </>
              )}
            </div>
            {promo && p.promoEndsAt && <p className="mt-1 text-xs text-steel">Promoção válida até {formatDate(p.promoEndsAt)}</p>}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <BuyNowButton productId={p.id} size="lg" className="flex-1" />
              <AddToCartButton productId={p.id} name={p.name} size="lg" className="flex-1" />
            </div>
            <ButtonLink href={whatsappUrl(settings.whatsapp, `Olá! Tenho interesse no produto ${p.name}.`)} variant="whatsapp" className="mt-3 w-full">
              <WhatsAppIcon className="h-4 w-4" /> Tirar dúvidas no WhatsApp
            </ButtonLink>

            <ul className="mt-7 grid gap-3 border-t border-white/8 pt-6 text-sm text-silver sm:grid-cols-2">
              <li className="flex items-center gap-2.5"><PackageOpen className="h-4 w-4 text-sky" aria-hidden /> Entrega digital</li>
              <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-sky" aria-hidden /> Acesso liberado após o pagamento</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-3">
            <h2 className="mb-4 text-lg font-bold">Descrição</h2>
            <div className="prose-x whitespace-pre-line text-silver">{p.description}</div>
          </div>
          <Section icon={ListChecks} title="Funcionalidades" items={p.features} />
          <Section icon={PackageOpen} title="Conteúdo incluso" items={p.includes} />
          <Section icon={Wrench} title="Requisitos" items={p.requirements} />
        </div>

        <section className="mt-14" aria-labelledby="avaliacoes">
          <h2 id="avaliacoes" className="mb-6 text-2xl font-bold">Avaliações</h2>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {reviews.length === 0 && <p className="card p-6 text-sm text-steel">Este produto ainda não tem avaliações.</p>}
              {reviews.map((r) => (
                <article key={r.id} className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{r.user.name.split(" ")[0]}</p>
                    <span className="text-xs text-steel">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="mt-1"><Stars value={r.rating} showCount={false} /></div>
                  {r.comment && <p className="mt-3 text-sm leading-relaxed text-silver">{r.comment}</p>}
                </article>
              ))}
            </div>
            <div className="card h-fit p-6">
              <h3 className="mb-4 text-lg font-bold">Avaliar este produto</h3>
              {canReview ? (
                <ReviewForm productId={p.id} />
              ) : user ? (
                <p className="text-sm text-steel">Somente clientes que compraram este produto podem avaliar.</p>
              ) : (
                <p className="text-sm text-steel">
                  <Link href={`/entrar?next=/produtos/${p.slug}`} className="font-semibold text-sky hover:text-white">Entre na sua conta</Link> para avaliar produtos que você comprou.
                </p>
              )}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="relacionados">
            <h2 id="relacionados" className="mb-6 text-2xl font-bold">Produtos relacionados</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </section>
        )}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
    </div>
  );
}
