import type { Metadata } from "next";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { recentNotifications, unreadCount } from "@/services/notifications";

export const metadata: Metadata = { title: { default: "Painel", template: "%s | Painel administrativo" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda barreira (após o middleware): valida papel ADMIN diretamente no banco.
  const admin = await requireAdmin();
  const [settings, notifications, unread, newQuotes, openTickets, pendingOrders] = await Promise.all([
    getSettings(),
    recentNotifications(admin.id),
    unreadCount(admin.id),
    db.quote.count({ where: { status: "NEW" } }),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.order.count({ where: { status: "PENDING" } }),
  ]);

  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/admin/clientes", label: "Clientes", icon: "users" },
    { href: "/admin/gerentes", label: "Gerentes", icon: "manager" },
    { href: "/admin/produtos", label: "Produtos", icon: "package" },
    { href: "/admin/servicos", label: "Serviços", icon: "globe" },
    { href: "/admin/pedidos", label: "Pedidos", icon: "cart", badge: pendingOrders },
    { href: "/admin/orcamentos", label: "Orçamentos", icon: "quote", badge: newQuotes },
    { href: "/admin/projetos", label: "Projetos", icon: "projects" },
    { href: "/admin/pagamentos", label: "Pagamentos", icon: "payments" },
    { href: "/admin/portfolio", label: "Portfólio", icon: "portfolio" },
    { href: "/admin/planos", label: "Planos", icon: "plans" },
    { href: "/admin/cupons", label: "Cupons", icon: "coupons" },
    { href: "/admin/suporte", label: "Suporte", icon: "support", badge: openTickets },
    { href: "/admin/configuracoes", label: "Configurações", icon: "settings" },
  ];

  return (
    <DashboardShell
      area="admin"
      nav={nav}
      companyName={settings.companyName}
      logoUrl={settings.logoUrl}
      user={{ name: admin.name, email: admin.email }}
      notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
      unread={unread}
    >
      {children}
    </DashboardShell>
  );
}
