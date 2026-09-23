import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Particles } from "@/components/effects/particles";
import { getSettings } from "@/lib/settings";

/** Moldura das telas de login/cadastro: fundo tecnológico + logo + cartão de vidro. */
export async function AuthShell({ title, subtitle, children, footer, badge }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; badge?: string }) {
  const s = await getSettings();
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
      <Particles />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-neon/25 blur-[110px]" aria-hidden />
      <Link href="/" className="relative mb-8 flex items-center gap-1.5 self-center text-xs text-steel transition hover:text-white sm:absolute sm:left-8 sm:top-8 sm:mb-0">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Voltar ao site
      </Link>
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo companyName={s.companyName} logoUrl={s.logoUrl} />
        </div>
        <div className="card p-7 shadow-[0_30px_90px_-30px_rgb(29_107_255_/_0.5)] sm:p-9">
          {badge && <span className="mb-4 inline-flex rounded-full border border-neon-2/30 bg-neon/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-sky">{badge}</span>}
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-steel">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-steel">{footer}</div>}
        <p className="mt-8 text-center text-xs text-steel/70">{s.tagline}</p>
      </div>
    </div>
  );
}
