"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger"><TriangleAlert className="h-8 w-8" /></div>
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="mt-3 max-w-md text-steel">Tivemos um problema ao carregar esta página. Tente novamente — se persistir, fale com a gente.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-steel/70">Código: {error.digest}</p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="btn btn-primary"><RotateCw className="h-4 w-4" /> Tentar novamente</button>
        <Link href="/" className="btn btn-outline">Ir para o início</Link>
      </div>
    </div>
  );
}
