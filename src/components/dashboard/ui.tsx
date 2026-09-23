import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-steel">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = "blue", trend }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: "blue" | "green" | "yellow" | "cyan"; trend?: "up" | "down" }) {
  const tones = { blue: "from-neon/30 text-sky", green: "from-ok/25 text-ok", yellow: "from-warn/25 text-warn", cyan: "from-cyan/25 text-cyan" } as const;
  return (
    <div className="panel relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl", tones[tone].split(" ")[0])} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-steel">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-bold text-white sm:text-[1.7rem]">{value}</p>
          {hint && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-steel">
              {trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-ok" aria-hidden />}
              {trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-danger" aria-hidden />}
              {hint}
            </p>
          )}
        </div>
        {icon && <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5", tones[tone].split(" ")[1])}>{icon}</span>}
      </div>
    </div>
  );
}

export function Panel({ title, description, actions, children, className, flush }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cn("panel", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-base font-bold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-steel">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

/** Tabela rolável horizontalmente em telas pequenas. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const v = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-neon to-cyan shadow-[0_0_10px_rgb(34_211_238_/_0.6)] transition-all" style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-white">{v}%</span>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-steel">{label}</dt>
      <dd className="mt-1 break-words text-sm text-white">{children || "—"}</dd>
    </div>
  );
}
