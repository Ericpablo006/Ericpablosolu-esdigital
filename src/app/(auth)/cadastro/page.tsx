import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser, safeNext } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";

export const generateMetadata = () => pageMetadata({ title: "Criar conta", path: "/cadastro", noindex: true });

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNext(firstParam((await searchParams).next), "");
  if (await getCurrentUser()) redirect(next || "/cliente");

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Acompanhe projetos, compre produtos e fale com o suporte."
      footer={
        <>
          Já tem conta?{" "}
          <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-sky hover:text-white">Entrar</Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
