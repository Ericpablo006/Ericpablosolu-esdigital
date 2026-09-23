import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";

export const generateMetadata = () => pageMetadata({ title: "Redefinir senha", path: "/redefinir-senha", noindex: true });

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = firstParam((await searchParams).token) ?? "";
  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha forte para proteger sua conta." footer={<Link href="/entrar" className="font-semibold text-sky hover:text-white">Voltar para o login</Link>}>
      {token.length >= 20 ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="text-sm text-steel">
          Link inválido. <Link href="/esqueci-senha" className="font-semibold text-sky hover:text-white">Solicite uma nova redefinição.</Link>
        </p>
      )}
    </AuthShell>
  );
}
