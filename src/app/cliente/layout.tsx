import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { recentNotifications, unreadCount } from "@/services/notifications";

export const metadata: Metadata = { title: { default: "Área do Cliente", template: "%s | Área do Cliente" }, robots: { index: false, follow: false } };

const NAV: NavItem[] = [
  { href: "/cliente", label: "Visão geral", icon: "dashboard", exact: true },
  { href: "/cliente/pedidos", label: "Meus pedidos", icon: "cart" },
  { href: "/cliente/projetos", label: "Meus projetos", icon: "projects" },
  { href: "/cliente/orcamentos", label: "Orçamentos", icon: "quote" },
  { href: "/cliente/pagamentos", label: "Pagamentos", icon: "payments" },
  { href: "/cliente/downloads", label: "Downloads", icon: "download" },
  { href: "/cliente/suporte", label: "Suporte", icon: "support" },
  { href: "/cliente/perfil", label: "Meu perfil", icon: "user" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/cliente");
  if (user.role === "MANAGER") redirect("/gerente");
  const [settings, notifications, unread] = await Promise.all([getSettings(), recentNotifications(user.id), unreadCount(user.id)]);
  return (
    <DashboardShell
      area="client"
      nav={NAV}
      companyName={settings.companyName}
      logoUrl={settings.logoUrl}
      user={{ name: user.name, email: user.email }}
      notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
      unread={unread}
    >
      {children}
    </DashboardShell>
  );
}
