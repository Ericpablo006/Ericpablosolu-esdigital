import { FileCode2, Layers, Layout, Package, Palette, type LucideIcon } from "lucide-react";
import { SmartImage } from "./smart-image";
import { cn } from "@/lib/utils";

function pickIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/template|site|layout|landing/.test(c)) return Layout;
  if (/arte|design|pack|logo/.test(c)) return Palette;
  if (/c[oó]digo|sistema|ferramenta|script/.test(c)) return FileCode2;
  if (/material|curso|ebook/.test(c)) return Layers;
  return Package;
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Capa do produto/projeto: usa a imagem enviada ou gera uma capa tecnológica a partir da categoria. */
export function Cover({ src, alt, category = "", seed = alt, sizes, className, priority }: { src?: string | null; alt: string; category?: string; seed?: string; sizes?: string; className?: string; priority?: boolean }) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-navy", className)}>
        <SmartImage src={src} alt={alt} sizes={sizes} priority={priority} />
      </div>
    );
  }
  const Icon = pickIcon(category);
  const h = hash(seed) % 4;
  const angle = [135, 160, 200, 115][h];
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(${angle}deg, #0a1633 0%, #10245a 55%, #1d6bff 140%)` }}
    >
      <div className="grid-bg absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan/25 blur-2xl" aria-hidden />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_0_40px_rgb(59_139_255_/_0.5)] backdrop-blur">
        <Icon className="h-8 w-8 text-white" aria-hidden />
      </div>
    </div>
  );
}
