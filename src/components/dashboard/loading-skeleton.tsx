import { Skeleton } from "@/components/ui/misc";

/** Esqueleto exibido enquanto uma página do painel/área do cliente carrega. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72" />
    </div>
  );
}
