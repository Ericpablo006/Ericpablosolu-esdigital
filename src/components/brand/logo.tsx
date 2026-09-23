import Link from "next/link";
import { BRAND } from "@/assets/brand";
import { cn } from "@/lib/utils";

/** Monograma vetorial padrão. Substituível pela logo oficial em Admin → Configurações. */
export function LogoMark({ className, title = "Logo" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={BRAND.viewBox} className={cn("h-10 w-10", className)} role="img" aria-label={title} fill="none">
      <defs>
        <linearGradient id="ep-g" x1="6" y1="3" x2="42" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5cb0ff" />
          <stop offset="0.55" stopColor="#1d6bff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="ep-f" x1="24" y1="3" x2="24" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10245a" />
          <stop offset="1" stopColor="#05070d" />
        </linearGradient>
      </defs>
      <path d={BRAND.hex} fill="url(#ep-f)" stroke="url(#ep-g)" strokeWidth="1.8" strokeLinejoin="round" />
      <g stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={BRAND.e} />
        <path d={BRAND.p} />
      </g>
      <circle cx="38" cy="13.5" r="1.7" fill="#22d3ee" />
    </svg>
  );
}

export function Logo({
  companyName,
  logoUrl,
  href = "/",
  className,
  compact = false,
}: {
  companyName: string;
  logoUrl?: string;
  href?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const [main, rest] = companyName.split(/\s+(?=Soluç)/i);
  const inner = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={companyName} width={190} height={44} className="h-10 w-auto max-w-[200px] object-contain" />
  ) : (
    <>
      <LogoMark title={companyName} className="h-10 w-10 drop-shadow-[0_0_14px_rgb(29_107_255_/_0.65)]" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-bold uppercase tracking-[0.14em] text-white">{main}</span>
          {rest && <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.32em] text-silver">{rest}</span>}
        </span>
      )}
    </>
  );
  const cls = cn("inline-flex items-center gap-3", className);
  return href ? (
    <Link href={href} className={cls} aria-label={`${companyName} — página inicial`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
