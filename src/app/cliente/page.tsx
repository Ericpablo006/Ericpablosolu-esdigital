import Link from "next/link";
import { Download, FolderKanban, Headset, ShoppingBag } from "lucide-react";
import { PageHeader, Panel, ProgressBar, StatCard } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate, orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Visão geral" };

export default async function ClientHome() {
  const user = await requireUser("/cliente");
  const [projects, activeProjects, orders, ordersCount, openTickets, downloads] = await Promise.all([
    db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 4 }),
    db.project.count({ where: { userId: user.id, status: { in: ["IN_DEVELOPMENT", "IN_REVIEW"] } } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.order.count({ where: { userId: user.id } }),
    db.supportTicket.count({ where: { userId: user.id, status: { not: "RESOLVED" } } }),
    db.download.count({ where: { userId: user.id, order: { status: "PAID" } } }),
  ]);

  return (
    <>
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}! 👋`}
        description="Acompanhe seus projetos, pedidos e suporte em um só lugar."
        actions={<ButtonLink href="/orcamento">Solicitar novo orçamento</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projetos em andamento" value={activeProjects} icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard label="Pedidos" value={ordersCount} icon={<ShoppingBag className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Downloads liberados" value={downloads} icon={<Download className="h-5 w-5" />} tone="green" />
        <StatCard label="Chamados abertos" value={openTickets} icon={<Headset className="h-5 w-5" />} tone="yellow" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Meus projetos" actions={<Link href="/cliente/projetos" className="text-sm font-semibold text-sky hover:text-white">Ver todos</Link>}>
          {projects.length === 0 ? (
            <EmptyState title="Nenhum projeto ainda" description="Quando um projeto for iniciado, você acompanha tudo por aqui." action={<ButtonLink href="/orcamento" size="sm">Solicitar orçamento</ButtonLink>} />
          ) : (
            <ul className="space-y-5">
              {projects.map((p) => (
                <li key={p.id}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{p.title}</p>
                    <StatusBadge kind="project" status={p.status} />
                  </div>
                  <ProgressBar value={p.progress} />
                  {p.deadline && <p className="mt-1.5 text-xs text-steel">Prazo: {formatDate(p.deadline)}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Últimos pedidos" actions={<Link href="/cliente/pedidos" className="text-sm font-semibold text-sky hover:text-white">Ver todos</Link>}>
          {orders.length === 0 ? (
            <EmptyState title="Nenhum pedido" description="Conheça nossos produtos digitais." action={<ButtonLink href="/produtos" size="sm" variant="outline">Ver produtos</ButtonLink>} />
          ) : (
            <ul className="divide-y divide-white/8">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/pedido/${o.number}`} className="font-semibold text-white hover:text-sky">{orderNumber(o.number)}</Link>
                    <p className="text-xs text-steel">{formatDate(o.createdAt)} · {formatBRL(o.totalCents)}</p>
                  </div>
                  <StatusBadge kind="order" status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
