import type { ReactNode } from "react";
import { Inbox, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types/labels";

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-steel">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-sm text-steel">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stars({ value, count, size = 14, showCount = true }: { value: number; count?: number; size?: number; showCount?: boolean }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={count ? `Avaliação ${value.toFixed(1)} de 5, ${count} avaliações` : "Sem avaliações"}>
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} width={size} height={size} className={i <= rounded ? "fill-warn text-warn" : i - 0.5 === rounded ? "fill-warn/50 text-warn" : "text-white/20"} />
        ))}
      </span>
      {showCount && <span className="text-xs text-steel">{count ? `${value.toFixed(1)} (${count})` : "Novo"}</span>}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "center", className }: { eyebrow?: string; title: ReactNode; description?: string; align?: "center" | "left"; className?: string }) {
  return (
    <div className={cn("mb-10 md:mb-14", align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-neon-2/30 bg-neon/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky">
          <span className="h-1.5 w-1.5 rounded-full bg-sky shadow-[0_0_8px_2px_rgb(92_176_255_/_0.8)]" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-relaxed text-steel">{description}</p>}
    </div>
  );
}

/** Cabeçalho de páginas internas (serviços, produtos, planos…). */
export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 pb-12 pt-32 md:pb-16 md:pt-40">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-neon/20 blur-[110px]" aria-hidden />
      <div className="container-x relative text-center">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} className="mb-0" />
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
