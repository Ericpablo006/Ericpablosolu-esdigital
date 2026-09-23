"use client";

import { useState } from "react";
import { Cover } from "@/components/ui/cover";
import { cn } from "@/lib/utils";

export function Gallery({ images, name, category, seed }: { images: string[]; name: string; category: string; seed: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="card overflow-hidden">
        <Cover src={images[active]} alt={name} category={category} seed={seed} sizes="(max-width: 1024px) 100vw, 50vw" priority className="aspect-[4/3]" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2.5">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === active}
                className={cn("block w-full overflow-hidden rounded-xl border-2 transition", i === active ? "border-neon-2 shadow-[0_0_18px_-4px_rgb(59_139_255_/_0.8)]" : "border-white/10 opacity-70 hover:opacity-100")}
              >
                <Cover src={src} alt="" sizes="120px" className="aspect-square" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
