"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type Filter = { name: string; label: string; options: { value: string; label: string }[] };

/** Busca (com debounce) + filtros em <select>, sincronizados com a URL. */
export function FilterBar({ placeholder = "Buscar…", filters = [], className }: { placeholder?: string; filters?: Filter[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  const push = (name: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(name, value);
    else sp.delete(name);
    sp.delete("page");
    start(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`, { scroll: false }));
  };

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className ?? ""}`} role="search">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => push("q", e.target.value.trim()), 350);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input pl-10 pr-9"
        />
        {q && (
          <button type="button" aria-label="Limpar busca" onClick={() => { setQ(""); push("q", ""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-steel hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {filters.map((f) => (
        <select key={f.name} aria-label={f.label} value={params.get(f.name) ?? ""} onChange={(e) => push(f.name, e.target.value)} className="input sm:w-56">
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      <span className="sr-only" aria-live="polite">{pending ? "Atualizando resultados…" : ""}</span>
    </div>
  );
}
