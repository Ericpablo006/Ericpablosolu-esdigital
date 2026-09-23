import Link from "next/link";
import { BadgeDollarSign, Clock, FolderKanban, Package, Wallet } from "lucide-react";
import { RegisterPaymentForm } from "@/components/admin/ops-forms";
import { PageHeader, Panel, StatCard, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { cn, firstParam, pageParam } from "@/lib/utils";
import { confirmPaymentById, refundPaymentById } from "@/actions/admin/operations";
import { getFinanceSummary } from "@/services/finance";
import { resolveRange } from "@/utils/dates";
import { toInputDate } from "@/utils/format";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS, options } from "@/types/labels";
import { formatDateTime, formatDate } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Pagamentos" };
const PAGE = 12;

const RANGES = [["today", "Hoje"], ["week", "Semana"], ["month", "Mês"], ["year", "Ano"]] as const;

export default async function AdminFinance({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const range = resolveRange(firstParam(sp.range), firstParam(sp.from), firstParam(sp.to));
  const status = firstParam(sp.status);
  const page = pageParam(sp.page);

  const dateWhere = { gte: range.start, lt: range.end };
  const where: Prisma.PaymentWhereInput = {
    OR: [{ paidAt: dateWhere }, { paidAt: null, createdAt: dateWhere }],
    ...(status && status in PAYMENT_STATUS ? { status: status as never } : {}),
  };
  const [summary, total, payments, users, projects] = await Promise.all([
    getFinanceSummary(range.start, range.end),
    db.payment.count({ where }),
    db.payment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { order: { select: { id: true, number: true } }, project: { select: { title: true } }, user: { select: { name: true } } } }),
    db.user.findMany({ where: { active: true, role: "CUSTOMER" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    db.project.findMany({ orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, title: true, user: { select: { name: true } } } }),
  ]);

  const chip = "rounded-full border px-4 py-1.5 text-sm font-medium transition";
  const rangeParams = range.key === "custom" ? { range: "custom", from: firstParam(sp.from), to: firstParam(sp.to) } : { range: range.key };

  return (
    <>
      <PageHeader title="Pagamentos" description="Financeiro: receitas, pagamentos recebidos e pendentes." actions={<Link href="/admin/pagamentos/recibos" className="btn btn-outline">Recibos de serviço</Link>} />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Período" className="flex flex-wrap gap-2">
          {RANGES.map(([k, label]) => (
            <Link key={k} href={`/admin/pagamentos?range=${k}`} className={cn(chip, range.key === k ? "border-neon bg-neon/20 text-white" : "border-white/12 text-silver hover:border-sky hover:text-white")}>{label}</Link>
          ))}
        </nav>
        <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Período personalizado">
          <input type="hidden" name="range" value="custom" />
          <div><label htmlFor="from" className="label">De</label><input id="from" type="date" name="from" required defaultValue={range.key === "custom" ? toInputDate(range.start) : ""} className="input py-2" /></div>
          <div><label htmlFor="to" className="label">Até</label><input id="to" type="date" name="to" required defaultValue={range.key === "custom" ? toInputDate(new Date(range.end.getTime() - 86400_000)) : ""} className="input py-2" /></div>
          <button type="submit" className={cn("btn btn-outline btn-sm h-[42px]", range.key === "custom" && "border-neon")}>Filtrar</button>
        </form>
      </div>
      <p className="mb-4 text-sm text-steel">Período: <strong className="text-white">{range.label}</strong> ({formatDate(range.start)} – {formatDate(new Date(range.end.getTime() - 1))})</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Receitas" value={formatBRL(summary.receivedCents)} hint={`${summary.paymentsCount} pagamentos aprovados`} icon={<BadgeDollarSign className="h-5 w-5" />} tone="green" />
        <StatCard label="Pagamentos pendentes" value={formatBRL(summary.pendingCents)} icon={<Clock className="h-5 w-5" />} tone="yellow" />
        <StatCard label="Produtos vendidos" value={summary.productsSold} hint={`${formatBRL(summary.productRevenueCents)} em receita`} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Serviços vendidos" value={summary.servicesSold} hint={`${formatBRL(summary.serviceRevenueCents)} em receita`} icon={<FolderKanban className="h-5 w-5" />} tone="cyan" />
      </div>
      {summary.otherRevenueCents > 0 && <p className="mt-3 text-xs text-steel">Inclui {formatBRL(summary.otherRevenueCents)} em pagamentos avulsos (sem pedido ou projeto).</p>}

      <Panel title="Pagamentos do período" className="mt-6" flush actions={
        <form method="get" className="flex items-center gap-2">
          {Object.entries(rangeParams).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
          <select name="status" defaultValue={status ?? ""} aria-label="Filtrar por status" className="input py-2 text-sm"><option value="">Todos os status</option>{options(PAYMENT_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <button type="submit" className="btn btn-outline btn-sm">Aplicar</button>
        </form>
      }>
        {payments.length === 0 ? (
          <div className="p-5"><EmptyState icon={<Wallet className="h-6 w-6" />} title="Nenhum pagamento no período" /></div>
        ) : (
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Descrição</th><th>Cliente</th><th>Forma</th><th>Valor</th><th>Data</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-[240px]">
                      <p className="truncate text-white">{p.description ?? "Pagamento"}</p>
                      <p className="text-xs text-steel">{p.order ? <Link href={`/admin/pedidos/${p.order.id}`} className="hover:text-white">Pedido #{p.order.number}</Link> : p.project ? `Projeto: ${p.project.title}` : "Avulso"} · {p.provider}</p>
                    </td>
                    <td>{p.user?.name ?? "—"}</td>
                    <td>{PAYMENT_METHOD_LABEL[p.method]}</td>
                    <td className="font-semibold text-white">{formatBRL(p.amountCents)}</td>
                    <td className="whitespace-nowrap">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                    <td><StatusBadge kind="payment" status={p.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {p.status === "PENDING" && <ActionButton action={confirmPaymentById} fields={{ id: p.id }} variant="primary" confirm={{ title: "Confirmar pagamento?", message: `Confirme apenas se ${formatBRL(p.amountCents)} foi recebido.`, confirmLabel: "Confirmar" }}>Confirmar</ActionButton>}
                        {p.status === "APPROVED" && <ActionButton action={refundPaymentById} fields={{ id: p.id }} variant="ghost" confirm={{ title: "Estornar pagamento?", message: "O pagamento será marcado como estornado (e o pedido, se houver, terá o acesso revogado).", confirmLabel: "Estornar" }}>Estornar</ActionButton>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/pagamentos" params={{ ...rangeParams, status }} />

      <Panel title="Registrar pagamento avulso" description="Para serviços e projetos recebidos fora da loja (PIX direto, transferência, dinheiro…)." className="mt-6">
        <RegisterPaymentForm customers={users.map((u) => ({ id: u.id, label: `${u.name} (${u.email})` }))} projects={projects.map((p) => ({ id: p.id, label: `${p.title} — ${p.user.name}` }))} />
      </Panel>
    </>
  );
}
