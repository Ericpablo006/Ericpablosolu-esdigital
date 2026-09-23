import { Code2, Palette, ShoppingBag, Smartphone, TrendingUp } from "lucide-react";

/** Composição visual tecnológica do hero: janela de "código + painel" com chips flutuantes. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]" aria-hidden>
      {/* aro orbital */}
      <svg viewBox="0 0 560 560" className="absolute left-1/2 top-1/2 h-[125%] w-[125%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-60">
        <defs>
          <linearGradient id="orb" x1="0" x2="1">
            <stop stopColor="#1d6bff" stopOpacity="0" />
            <stop offset=".5" stopColor="#5cb0ff" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="280" cy="280" r="250" fill="none" stroke="url(#orb)" strokeWidth="1.2" strokeDasharray="2 10" />
        <circle cx="280" cy="280" r="205" fill="none" stroke="rgba(92,176,255,.18)" strokeWidth="1" />
        <circle cx="530" cy="280" r="4" fill="#22d3ee" />
        <circle cx="75" cy="280" r="3" fill="#5cb0ff" />
      </svg>
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/40 blur-[90px]" />

      {/* janela principal */}
      <div className="relative animate-float-slow rounded-2xl border border-white/12 bg-[#070c19]/85 shadow-[0_30px_80px_-20px_rgb(29_107_255_/_0.55)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-steel">seuprojeto.com.br</span>
        </div>
        <div className="grid grid-cols-5 gap-4 p-4">
          <div className="col-span-3 space-y-1.5 font-mono text-[11px] leading-relaxed">
            <p><span className="text-[#c792ea]">const</span> <span className="text-sky">projeto</span> <span className="text-silver">=</span> {"{"}</p>
            <p className="pl-4"><span className="text-cyan">ideia</span>: <span className="text-[#c3e88d]">&quot;sua visão&quot;</span>,</p>
            <p className="pl-4"><span className="text-cyan">stack</span>: [<span className="text-[#c3e88d]">&quot;Next&quot;</span>, <span className="text-[#c3e88d]">&quot;API&quot;</span>],</p>
            <p className="pl-4"><span className="text-cyan">design</span>: <span className="text-[#c3e88d]">&quot;premium&quot;</span>,</p>
            <p className="pl-4"><span className="text-cyan">deploy</span>: <span className="text-[#f78c6c]">true</span></p>
            <p>{"}"}</p>
            <p className="pt-1"><span className="text-[#c792ea]">await</span> <span className="text-sky">entregar</span>(projeto)</p>
            <p className="text-ok">✓ resultado gerado</p>
          </div>
          <div className="col-span-2 space-y-3">
            <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-wider text-steel">Resultados</p>
              <p className="font-display text-lg font-bold text-white">Em crescimento</p>
              <div className="mt-2 flex h-10 items-end gap-1">
                {[28, 40, 34, 52, 46, 68, 60, 86, 100].map((v, i) => (
                  <span key={i} className="flex-1 rounded-sm bg-gradient-to-t from-neon to-cyan" style={{ height: `${v}%`, opacity: 0.45 + i * 0.06 }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-wider text-steel">Projeto</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-neon to-cyan shadow-[0_0_12px_rgb(34_211_238_/_0.8)]" />
              </div>
              <p className="mt-1.5 text-[11px] text-silver">72% concluído</p>
            </div>
          </div>
        </div>
      </div>

      {/* chips flutuantes */}
      <Chip className="-left-10 top-10 hidden animate-float sm:flex" icon={<Smartphone className="h-4 w-4" />} label="Apps" />
      <Chip className="-right-8 -top-3 hidden animate-float-slow sm:flex" icon={<ShoppingBag className="h-4 w-4" />} label="Lojas virtuais" />
      <Chip className="-left-8 bottom-14 hidden animate-float-slow sm:flex" icon={<Palette className="h-4 w-4" />} label="Design" />
      <Chip className="-bottom-4 right-3 flex animate-float sm:-right-6 sm:bottom-2" icon={<TrendingUp className="h-4 w-4" />} label="Marketing" />
      <Chip className="-top-5 left-4 flex animate-float sm:left-1/2 sm:-translate-x-1/2" icon={<Code2 className="h-4 w-4" />} label="Sistemas" />
    </div>
  );
}

function Chip({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) {
  return (
    <div className={`glass absolute items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_-10px_rgb(29_107_255_/_0.7)] ${className}`}>
      <span className="text-sky">{icon}</span>
      {label}
    </div>
  );
}
