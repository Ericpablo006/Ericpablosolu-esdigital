import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Paginação por links (funciona sem JavaScript e mantém os filtros da URL). */
export function Pagination({ page, pageCount, basePath, params = {} }: { page: number; pageCount: number; basePath: string; params?: Record<string, string | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const cell = "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition";
  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} aria-label="Página anterior" className={cn(cell, "border-white/10 hover:border-sky hover:text-white")}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-steel">…</span>}
          <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn(cell, p === page ? "border-neon bg-neon/20 text-white" : "border-white/10 hover:border-sky hover:text-white")}>
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} aria-label="Próxima página" className={cn(cell, "border-white/10 hover:border-sky hover:text-white")}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
