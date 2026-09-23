import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AdminLoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/lib/auth/session";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({ title: "Acesso administrativo", path: "/admin/login", noindex: true });

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return (
    <AuthShell badge="Área restrita" title="Painel administrativo" subtitle="Acesso exclusivo para administradores.">
      <AdminLoginForm />
    </AuthShell>
  );
}
