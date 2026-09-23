import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-8xl font-bold text-neon">404</p>
      <h1 className="mt-4 text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-3 max-w-md text-steel">O endereço que você acessou não existe ou foi movido.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className={buttonClass("primary")}>Ir para o início</Link>
        <Link href="/contato" className={buttonClass("outline")}>Falar com a gente</Link>
      </div>
    </div>
  );
}
