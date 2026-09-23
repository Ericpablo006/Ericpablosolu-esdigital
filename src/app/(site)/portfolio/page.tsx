import Link from "next/link";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { PortfolioCard } from "@/components/portfolio/portfolio-card";
import { ButtonLink } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { cn, firstParam } from "@/lib/utils";
import { listActivePortfolio } from "@/services/catalog";
import { PORTFOLIO_CATEGORIES } from "@/types/constants";

export const generateMetadata = () =>
  pageMetadata({ title: "Portfólio", description: "Conheça sites, sistemas, aplicativos, lojas virtuais e projetos de design que desenvolvemos.", path: "/portfolio" });

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const category = firstParam((await searchParams).categoria);
  const all = await listActivePortfolio();
  const categories = [...new Set([...PORTFOLIO_CATEGORIES, ...all.map((p) => p.category)])].filter((c) => all.some((p) => p.category === c));
  const items = category ? all.filter((p) => p.category === category) : all;

  const chip = "rounded-full border px-4 py-2 text-sm font-medium transition";
  return (
    <>
      <PageHero eyebrow="Portfólio" title={<>Trabalhos que <span className="text-neon">geram resultado</span></>} description="Uma seleção dos projetos que desenvolvemos para nossos clientes." />
      <section className="py-14 md:py-16">
        <div className="container-x">
          {categories.length > 0 && (
            <nav aria-label="Filtrar por categoria" className="mb-10 flex flex-wrap justify-center gap-2.5">
              <Link href="/portfolio" className={cn(chip, !category ? "border-neon bg-neon/20 text-white" : "border-white/12 text-silver hover:border-sky hover:text-white")}>Todos</Link>
              {categories.map((c) => (
                <Link key={c} href={`/portfolio?categoria=${encodeURIComponent(c)}`} className={cn(chip, category === c ? "border-neon bg-neon/20 text-white" : "border-white/12 text-silver hover:border-sky hover:text-white")}>
                  {c}
                </Link>
              ))}
            </nav>
          )}
          {items.length === 0 ? (
            <EmptyState title="Nenhum projeto por aqui ainda" description="Em breve publicaremos nossos cases. Enquanto isso, que tal começar o seu?" action={<ButtonLink href="/orcamento">Solicitar orçamento</ButtonLink>} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PortfolioCard key={p.id} item={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
