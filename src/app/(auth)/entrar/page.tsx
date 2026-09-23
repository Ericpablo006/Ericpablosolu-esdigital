import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser, homePath, safeNext } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";

export const generateMetadata = () => pageMetadata({ title: "Entrar", path: "/entrar", noindex: true });

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const next = safeNext(firstParam((await searchParams).next), "");
  const user = await getCurrentUser();
  if (user) redirect(homePath(user.role, next));

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse pedidos, projetos, downloads e suporte."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href={`/cadastro${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-sky hover:text-white">Criar conta</Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
