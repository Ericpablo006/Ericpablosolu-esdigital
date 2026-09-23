import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Imagem responsiva com lazy loading.
 * - Arquivos enviados pelo painel (/uploads/…) passam pelo otimizador do Next (AVIF/WebP, tamanhos sob demanda).
 * - URLs externas (https) são exibidas diretamente, sem o otimizador (evita abrir um proxy de imagens para qualquer domínio).
 * O elemento pai precisa ser `relative` e ter proporção definida.
 */
export function SmartImage({ src, alt, sizes = "(max-width: 768px) 100vw, 400px", className, priority = false }: { src: string; alt: string; sizes?: string; className?: string; priority?: boolean }) {
  if (src.startsWith("/uploads/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={cn("absolute inset-0 h-full w-full object-cover", className)} />
  );
}
