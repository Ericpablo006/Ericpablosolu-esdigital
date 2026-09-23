import Link from "next/link";
import { BadgeDollarSign, FileText, FolderKanban, Package, ShoppingBag, TriangleAlert, Users } from "lucide-react";
import { BarChart, DonutChart, RankList } from "@/components/dashboard/charts";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getAdminDashboard } from "@/services/dashboard";
import { confirmOrderPayment } from "@/actions/admin/operations";
import { PROJECT_STATUS, QUOTE_STATUS, QUOTE_TYPE_LABEL } from "@/types/labels";
import { formatDate, orderNumber, quoteNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [d, settings, pendingOrders, latestQuotes] = await Promise.all([
    getAdminDashboard(),
    getSettings(),
    db.order.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.quote.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const missing = [!settings.whatsapp && "WhatsApp", !settings.email && "e-mail", !settings.pixKey && "chave PIX"].filter(Boolean);

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do negócio." />

      {missing.length > 0 && (
        <Link href="/admin/configuracoes" className="mb-6 flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-sm text-amber-100 transition hover:border-warn/60">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span><strong>Complete as configurações:</strong> faltam {missing.join(", ")}. Sem eles, o botão de WhatsApp, os contatos do site e os pagamentos por PIX não funcionam por completo.</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Faturamento (total)" value={formatBRL(d.revenueTotalCents)} hint={`${formatBRL(d.revenueMonthCents)} neste mês`} icon={<BadgeDollarSign className="h-5 w-5" />} tone="green" />
        <StatCard label="Pedidos" value={d.ordersTotal} hint={`${d.ordersPending} aguardando pagamento`} icon={<ShoppingBag className="h-5 w-5" />} />
        <StatCard label="Novos clientes (30 dias)" value={d.newCustomers} icon={<Users className="h-5 w-5" />} tone="cyan" />
        <StatCard label="Orçamentos" value={d.quotesTotal} hint={`${d.quotesNew} novos`} icon={<FileText className="h-5 w-5" />} tone="yellow" />
        <StatCard label="Projetos em andamento" value={d.projectsActive} icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard label="Produtos vendidos" value={d.productsSold} icon={<Package className="h-5 w-5" />} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Faturamento — últimos 6 meses" description="Pagamentos aprovados (produtos, serviços e avulsos)."><BarChart data={d.revenueByMonth} /></Panel>
        <Panel title="Produtos mais vendidos"><RankList data={d.topProducts} unit=" un." /></Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Orçamentos por status"><DonutChart data={d.quotesByStatus.map((q) => ({ label: QUOTE_STATUS[q.key]?.label ?? q.key, value: q.value }))} /></Panel>
        <Panel title="Projetos por status"><DonutChart data={d.projectsByStatus.map((p) => ({ label: PROJECT_STATUS[p.key]?.label ?? p.key, value: p.value }))} /></Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Pedidos aguardando pagamento" actions={<Link href="/admin/pedidos?status=PENDING" className="text-sm font-semibold text-sky hover:text-white">Ver todos</Link>} flush>
          {pendingOrders.length === 0 ? (
            <div className="p-5"><EmptyState title="Nenhum pedido pendente" /></div>
          ) : (
            <ul className="divide-y divide-white/8">
              {pendingOrders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-white hover:text-sky">{orderNumber(o.number)}</Link>
                    <p className="text-xs text-steel">{o.buyerName} · {formatBRL(o.totalCents)} · {formatDate(o.createdAt)}</p>
                  </div>
                  <ActionButton action={confirmOrderPayment} fields={{ id: o.id }} variant="outline" confirm={{ title: "Confirmar pagamento?", message: `Confirme apenas se o valor de ${formatBRL(o.totalCents)} foi recebido. O cliente terá acesso imediato aos downloads.`, confirmLabel: "Confirmar pagamento" }}>Confirmar pagamento</ActionButton>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Últimos orçamentos" actions={<Link href="/admin/orcamentos" className="text-sm font-semibold text-sky hover:text-white">Ver todos</Link>} flush>
          {latestQuotes.length === 0 ? (
            <div className="p-5"><EmptyState title="Nenhum orçamento ainda" /></div>
          ) : (
            <ul className="divide-y divide-white/8">
              {latestQuotes.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <Link href={`/admin/orcamentos/${q.id}`} className="font-semibold text-white hover:text-sky">{quoteNumber(q.number)} · {QUOTE_TYPE_LABEL[q.type]}</Link>
                    <p className="text-xs text-steel">{q.name}{q.company ? ` — ${q.company}` : ""} · {formatDate(q.createdAt)}</p>
                  </div>
                  <StatusBadge kind="quote" status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
