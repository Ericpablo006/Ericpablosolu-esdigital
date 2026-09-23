import { formatBRL } from "@/utils/money";

/** Gráfico de barras em SVG (sem dependências). Valores em reais. */
export function BarChart({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / data.length;
  const pad = 26;
  const H = height;
  const hasData = data.some((d) => d.value > 0);
  return (
    <figure>
      <svg viewBox={`0 0 600 ${H}`} className="w-full" role="img" aria-label={`Faturamento por mês: ${data.map((d) => `${d.label} ${formatBRL(d.value * 100)}`).join(", ")}`}>
        <defs>
          <linearGradient id="bar-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5cb0ff" />
            <stop offset="1" stopColor="#1d6bff" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1="0" x2="600" y1={H - pad - (H - pad - 12) * t} y2={H - pad - (H - pad - 12) * t} stroke="rgba(255,255,255,0.06)" />
        ))}
        {data.map((d, i) => {
          const bw = (600 * w) / 100;
          const h = (d.value / max) * (H - pad - 12);
          const x = i * bw + bw * 0.2;
          return (
            <g key={d.label}>
              <title>{`${d.label}: ${formatBRL(d.value * 100)}`}</title>
              <rect x={x} y={H - pad - Math.max(h, d.value > 0 ? 3 : 1.5)} width={bw * 0.6} height={Math.max(h, d.value > 0 ? 3 : 1.5)} rx="6" fill={d.value > 0 ? "url(#bar-g)" : "rgba(255,255,255,0.08)"} />
              {d.value > 0 && <text x={x + (bw * 0.6) / 2} y={H - pad - h - 7} textAnchor="middle" fontSize="11" fill="#c5cede">{d.value >= 1000 ? `${(d.value / 1000).toFixed(1).replace(".", ",")}k` : Math.round(d.value)}</text>}
              <text x={x + (bw * 0.6) / 2} y={H - 7} textAnchor="middle" fontSize="12" fill="#8f9bb3">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {!hasData && <figcaption className="mt-1 text-center text-xs text-steel">Sem pagamentos aprovados no período.</figcaption>}
    </figure>
  );
}

const PALETTE = ["#3b8bff", "#22d3ee", "#34d399", "#fbbf24", "#a78bfa", "#f87171"];

/** Rosca com legenda — distribuição por status. */
export function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 46;
  const C = 2 * Math.PI * R;
  let offset = 0;
  if (total === 0) return <p className="py-8 text-center text-sm text-steel">Sem dados ainda.</p>;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const el = <circle key={d.label} cx="60" cy="60" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="14" strokeDasharray={`${len - 1.5} ${C - len + 1.5}`} strokeDashoffset={-offset}><title>{`${d.label}: ${d.value}`}</title></circle>;
          offset += len;
          return el;
        })}
        <text x="60" y="60" transform="rotate(90 60 60)" textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="700" fill="#fff">{total}</text>
      </svg>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-silver"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{d.label}</span>
            <span className="font-semibold text-white">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ranking horizontal (top produtos). */
export function RankList({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <p className="py-8 text-center text-sm text-steel">Nenhuma venda ainda.</p>;
  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="truncate text-silver">{d.label}</span><span className="shrink-0 font-semibold text-white">{d.value}{unit}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-neon to-cyan" style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
