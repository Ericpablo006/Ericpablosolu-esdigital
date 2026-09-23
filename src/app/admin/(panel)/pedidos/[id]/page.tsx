import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Field, PageHeader, Panel } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { adminCancelOrder, adminRefundOrder, confirmOrderPayment } from "@/actions/admin/operations";
import { PAYMENT_METHOD_LABEL } from "@/types/labels";
import { formatDateTime, formatPhoneBR, orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { formatCpfCnpj } from "@/utils/validators";

export const metadata = { title: "Pedido" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { items: true, payments: { orderBy: { createdAt: "desc" } }, coupon: true, downloads: { include: { product: { select: { name: true } } } } } });
  if (!o) notFound();

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      <PageHeader
        title={`Pedido ${orderNumber(o.number)}`}
        description={`Realizado em ${formatDateTime(o.createdAt)}`}
        actions={
          <>
            <StatusBadge kind="order" status={o.status} />
            {o.status === "PENDING" && (
              <>
                <ActionButton action={confirmOrderPayment} fields={{ id: o.id }} variant="primary" size="md" confirm={{ title: "Confirmar pagamento?", message: `Confirme apenas se ${formatBRL(o.totalCents)} foi recebido. O cliente terá acesso imediato aos downloads.`, confirmLabel: "Confirmar pagamento" }}>Confirmar pagamento</ActionButton>
                <ActionButton action={adminCancelOrder} fields={{ id: o.id }} size="md" confirm={{ title: "Cancelar pedido?", message: "O pedido será cancelado.", confirmLabel: "Cancelar pedido" }}>Cancelar</ActionButton>
              </>
            )}
            {o.status === "PAID" && (
              <ActionButton action={adminRefundOrder} fields={{ id: o.id }} variant="danger" size="md" confirm={{ title: "Estornar pagamento?", message: "O pedido será marcado como estornado e o acesso aos downloads será revogado. O reembolso em si deve ser feito por você junto ao cliente/banco.", confirmLabel: "Estornar" }}>Estornar</ActionButton>
            )}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Panel title="Itens" flush>
            <ul className="divide-y divide-white/8">
              {o.items.map((i) => (<li key={i.id} className="flex justify-between gap-4 px-5 py-3 text-sm"><span className="text-silver">{i.name} <span className="text-steel">× {i.quantity} · {formatBRL(i.unitPriceCents)}</span></span><span className="font-semibold text-white">{formatBRL(i.unitPriceCents * i.quantity)}</span></li>))}
            </ul>
            <dl className="space-y-2 border-t border-white/8 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-steel">Subtotal</dt><dd className="text-white">{formatBRL(o.subtotalCents)}</dd></div>
              {o.discountCents > 0 && <div className="flex justify-between text-ok"><dt>Desconto {o.coupon && `(${o.coupon.code})`}</dt><dd>-{formatBRL(o.discountCents)}</dd></div>}
              <div className="flex justify-between text-base"><dt className="font-semibold text-white">Total</dt><dd className="font-display text-xl font-bold text-white">{formatBRL(o.totalCents)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Pagamentos" flush>
            <ul className="divide-y divide-white/8">
              {o.payments.map((p) => (<li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"><span className="text-silver">{PAYMENT_METHOD_LABEL[p.method]} · {formatBRL(p.amountCents)} · <span className="text-steel">{p.provider}</span> · {formatDateTime(p.paidAt ?? p.createdAt)}</span><StatusBadge kind="payment" status={p.status} /></li>))}
            </ul>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Comprador">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">{o.buyerName}</Field>
              <Field label="CPF/CNPJ">{formatCpfCnpj(o.buyerDocument)}</Field>
              <Field label="E-mail">{o.buyerEmail}</Field>
              <Field label="WhatsApp">{formatPhoneBR(o.buyerWhatsapp)}</Field>
            </dl>
            <Link href={`/admin/clientes/${o.userId}`} className="mt-4 inline-block text-sm font-semibold text-sky hover:text-white">Ver cadastro do cliente</Link>
          </Panel>
          <Panel title="Downloads liberados" flush>
            {o.downloads.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum download liberado (pagamento não confirmado).</p> : (
              <ul className="divide-y divide-white/8">{o.downloads.map((d) => (<li key={d.id} className="flex justify-between gap-3 px-5 py-3 text-sm"><span className="text-silver">{d.product.name}</span><span className="text-steel">{d.downloadCount}/{d.maxDownloads}</span></li>))}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
