import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Field, PageHeader, Panel } from "@/components/dashboard/ui";
import { buttonClass } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireManager } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PAYMENT_METHOD_LABEL } from "@/types/labels";
import { formatDateTime, formatPhoneBR, orderNumber, whatsappUrl } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Pedido" };

// Somente leitura. Sem CPF/CNPJ, sem links de download e sem ações de pagamento.
export default async function ManagerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireManager();
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: { items: true, payments: { orderBy: { createdAt: "desc" } }, coupon: true } });
  if (!o) notFound();

  return (
    <>
      <Link href="/gerente/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Pedidos</Link>
      <PageHeader title={`Pedido ${orderNumber(o.number)}`} description={`Realizado em ${formatDateTime(o.createdAt)}`} actions={<StatusBadge kind="order" status={o.status} />} />
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
            {o.payments.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum pagamento registrado.</p> : (
              <ul className="divide-y divide-white/8">
                {o.payments.map((p) => (<li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"><span className="text-silver">{PAYMENT_METHOD_LABEL[p.method]} · {formatBRL(p.amountCents)} · {formatDateTime(p.paidAt ?? p.createdAt)}</span><StatusBadge kind="payment" status={p.status} /></li>))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title="Comprador">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">{o.buyerName}</Field>
            <Field label="E-mail">{o.buyerEmail}</Field>
            <Field label="WhatsApp">{formatPhoneBR(o.buyerWhatsapp)}</Field>
          </dl>
          {o.buyerWhatsapp && (
            <a href={whatsappUrl(o.buyerWhatsapp, `Olá, ${o.buyerName.split(" ")[0]}! Sobre o seu pedido ${orderNumber(o.number)}:`)} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "sm", "mt-4")}>Falar com o cliente</a>
          )}
        </Panel>
      </div>
    </>
  );
}
