import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquareText, PenTool, Rocket, ShieldCheck } from "lucide-react";
import { Particles } from "@/components/effects/particles";
import { HeroVisual } from "@/components/home/hero-visual";
import { WhyUs } from "@/components/home/why-us";
import { ServiceIcon } from "@/components/brand/icons";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/misc";
import { ProductCard } from "@/components/shop/product-card";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { listProducts } from "@/services/catalog";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const s = await getSettings();
  return pageMetadata({ title: s.slogan, path: "/" });
}

export default async function HomePage() {
  const [s, services, products, portfolio] = await Promise.all([
    getSettings(),
    db.service.findMany({ where: { active: true, featured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 6 }),
    listProducts({ pageSize: 4 }),
    db.portfolioItem.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 3 }),
  ]);

  // Destaca as duas últimas palavras do título com gradiente neon.
  const words = s.heroTitle.split(" ");
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <Particles />
        <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-neon/20 blur-[120px]" aria-hidden />
        <div className="container-x relative grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon-2/30 bg-neon/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-sky">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan shadow-[0_0_10px_2px_rgb(34_211_238_/_0.8)]" />
              {s.tagline}
            </span>
            <h1 className="text-[2.5rem] font-bold leading-[1.05] sm:text-5xl lg:text-[3.6rem]">
              {head} <span className="text-neon">{tail}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-silver/90">{s.heroSubtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/orcamento" size="lg">
                Solicitar orçamento <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/servicos" variant="outline" size="lg">Conhecer serviços</ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-silver">
              {["Projetos sob medida", "Atendimento personalizado", "Suporte após a entrega"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="animate-fade-up px-4 pb-10 sm:px-10 lg:px-0" style={{ animationDelay: "0.15s" }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* FAIXA */}
      <div className="border-y border-white/5 bg-white/[0.02] py-4" aria-hidden>
        <div className="flex overflow-hidden">
          <div className="flex min-w-full shrink-0 animate-marquee items-center gap-10 whitespace-nowrap pr-10 text-sm font-medium uppercase tracking-[0.2em] text-steel">
            {[...Array(2)].flatMap((_, k) =>
              ["Sites profissionais", "Lojas virtuais", "Sistemas personalizados", "Aplicativos", "Design e identidade visual", "Marketing digital", "Automação", "Manutenção e suporte"].map((t) => (
                <span key={`${k}-${t}`} className="flex items-center gap-10">
                  {t} <span className="h-1 w-1 rounded-full bg-neon-2" />
                </span>
              )),
            )}
          </div>
        </div>
      </div>

      {/* SOLUÇÕES */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="O que fazemos" title={s.solutionsTitle} description="Da ideia ao ar: cuidamos de todas as etapas para que você foque no seu negócio." />
          {services.length === 0 ? (
            <p className="text-center text-steel">Em breve, novas soluções por aqui.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((sv) => (
                <article key={sv.id} className="card card-hover group flex flex-col p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neon-2/30 bg-gradient-to-br from-neon/25 to-cyan/10 text-sky shadow-[0_0_30px_-6px_rgb(29_107_255_/_0.7)] transition group-hover:scale-105">
                    <ServiceIcon name={sv.icon} className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold">{sv.homeLabel || sv.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-steel">{sv.shortDescription}</p>
                  <Link href={`/servicos#${sv.slug}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition hover:gap-2.5 hover:text-white">
                    Saiba mais <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* COMO TRABALHAMOS */}
      <section className="border-y border-white/5 bg-ink-2/50 py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Como trabalhamos" title="Um processo claro, do primeiro contato à entrega" />
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageSquareText, title: "Conversa", text: "Entendemos seu negócio, objetivos e prazos." },
              { icon: PenTool, title: "Proposta", text: "Você recebe escopo, valor e cronograma claros." },
              { icon: Rocket, title: "Desenvolvimento", text: "Acompanhe o andamento em tempo real pela Área do Cliente." },
              { icon: ShieldCheck, title: "Entrega e suporte", text: "Publicação, treinamento e suporte contínuo." },
            ].map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card relative p-6">
                <span className="absolute right-5 top-4 font-display text-5xl font-bold text-white/[0.06]">{i + 1}</span>
                <Icon className="mb-4 h-7 w-7 text-cyan" aria-hidden />
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRODUTOS */}
      {products.items.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Loja digital" title="Produtos digitais prontos para usar" description="Templates, layouts, packs e ferramentas com entrega imediata após a confirmação do pagamento." />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink href="/produtos" variant="outline">Ver todos os produtos <ArrowRight className="h-4 w-4" /></ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* PORTFÓLIO */}
      {portfolio.length > 0 && (
        <section className="border-y border-white/5 bg-ink-2/50 py-20 md:py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Portfólio" title="Projetos que viraram resultado" />
            <div className="grid gap-5 md:grid-cols-3">
              {portfolio.map((p) => (
                <PortfolioCard key={p.id} item={p} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink href="/portfolio" variant="outline">Ver portfólio completo <ArrowRight className="h-4 w-4" /></ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* POR QUE ESCOLHER */}
      <section className="py-20 md:py-28">
        <div className="container-x">
          <SectionHeading eyebrow="Diferenciais" title={`Por que escolher a ${s.companyName}?`} />
          <WhyUs />
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-4 md:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl border border-neon-2/30 bg-gradient-to-br from-navy-2 via-navy to-ink px-6 py-16 text-center md:py-20">
          <Particles />
          <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-neon/30 blur-[100px]" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">Pronto para transformar sua ideia em resultado?</h2>
            <p className="mx-auto mt-4 max-w-xl text-silver/90">Monte seu orçamento em poucos minutos e receba uma proposta sob medida.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/orcamento" size="lg">Monte seu orçamento <ArrowRight className="h-4 w-4" /></ButtonLink>
              <ButtonLink href="/contato" variant="outline" size="lg">Falar com a gente</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
