import type { Metadata } from "next";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireManager } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: { default: "Painel do gerente", template: "%s | Painel do gerente" }, robots: { index: false, follow: false } };

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  // Segunda barreira (após o middleware): valida o papel direto no banco.
  const user = await requireManager();
  const [settings, pending] = await Promise.all([getSettings(), db.order.count({ where: { status: "PENDING" } })]);

  const nav: NavItem[] = [
    { href: "/gerente/pedidos", label: "Pedidos", icon: "cart", badge: pending },
    { href: "/gerente/perfil", label: "Minha conta", icon: "user" },
  ];

  return (
    <DashboardShell area="manager" nav={nav} companyName={settings.companyName} logoUrl={settings.logoUrl} user={{ name: user.name, email: user.email }}>
      {children}
    </DashboardShell>
  );
}
