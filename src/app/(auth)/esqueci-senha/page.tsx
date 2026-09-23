import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({ title: "Esqueci minha senha", path: "/esqueci-senha", noindex: true });

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
      footer={<Link href="/entrar" className="font-semibold text-sky hover:text-white">Voltar para o login</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
