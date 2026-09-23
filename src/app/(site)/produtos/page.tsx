import { PackageSearch } from "lucide-react";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { ProductCard } from "@/components/shop/product-card";
import { ButtonLink } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { firstParam, pageParam } from "@/lib/utils";
import { listProductCategories, listProducts } from "@/services/catalog";

export const generateMetadata = () =>
  pageMetadata({ title: "Produtos digitais", description: "Templates, sites prontos, landing pages, layouts, packs de design, sistemas e ferramentas com entrega digital.", path: "/produtos" });

const SORTS = [
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "name", label: "Nome (A–Z)" },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim().slice(0, 80) || undefined;
  const category = firstParam(sp.category) || undefined;
  const sortRaw = firstParam(sp.sort);
  const sort = SORTS.some((s) => s.value === sortRaw) ? (sortRaw as "price-asc" | "price-desc" | "name") : "recent";
  const page = pageParam(sp.page);

  const [categories, { items, pageCount, total }] = await Promise.all([listProductCategories(), listProducts({ q, category, sort, page, pageSize: 12 })]);

  return (
    <>
      <PageHero eyebrow="Loja digital" title={<>Produtos digitais <span className="text-neon">prontos para usar</span></>} description="Compre e receba o acesso assim que o pagamento for confirmado." />
      <section className="py-14 md:py-16">
        <div className="container-x">
          <FilterBar
            placeholder="Buscar produtos…"
            filters={[
              { name: "category", label: "Todas as categorias", options: categories.map((c) => ({ value: c, label: c })) },
              { name: "sort", label: "Mais recentes", options: SORTS },
            ]}
            className="mb-8"
          />
          <p className="mb-5 text-sm text-steel" aria-live="polite">{total} {total === 1 ? "produto encontrado" : "produtos encontrados"}</p>
          {items.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-6 w-6" />}
              title="Nenhum produto encontrado"
              description={q || category ? "Tente outra busca ou remova os filtros." : "Nossa loja está sendo preparada. Volte em breve!"}
              action={q || category ? <ButtonLink href="/produtos" variant="outline">Limpar filtros</ButtonLink> : undefined}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <Pagination page={page} pageCount={pageCount} basePath="/produtos" params={{ q, category, sort: sortRaw }} />
        </div>
      </section>
    </>
  );
}
