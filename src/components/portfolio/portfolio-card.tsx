import { ExternalLink } from "lucide-react";
import type { PortfolioItem } from "@prisma/client";
import { Cover } from "@/components/ui/cover";
import { Badge } from "@/components/ui/misc";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      <div className="relative">
        <Cover src={item.image} alt={item.title} category={item.category} seed={item.title} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-[16/10] transition duration-500 group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
        <Badge tone="blue" className="absolute left-3 top-3 bg-ink/80 backdrop-blur">{item.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold">{item.title}</h3>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-sky">Cliente: {item.client}</p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-steel">{item.description}</p>
        {item.technologies.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {item.technologies.map((t) => (
              <li key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-silver">{t}</li>
            ))}
          </ul>
        )}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition hover:text-white">
            Ver projeto <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}
