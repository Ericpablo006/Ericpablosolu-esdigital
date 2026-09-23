import { FileDown, Wallet } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PAYMENT_METHOD_LABEL } from "@/types/labels";
import { formatDate, receiptNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Pagamentos" };

export default async function ClientPayments() {
  const user = await requireUser("/cliente/pagamentos");
  const [payments, receipts] = await Promise.all([
    db.payment.findMany({ where: { OR: [{ userId: user.id }, { order: { userId: user.id } }, { project: { userId: user.id } }] }, orderBy: { createdAt: "desc" }, take: 100, include: { order: { select: { number: true } } } }),
    db.receipt.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title="Pagamentos" description="Histórico de pagamentos e recibos." />
      {payments.length === 0 ? (
        <EmptyState icon={<Wallet className="h-6 w-6" />} title="Nenhum pagamento registrado" />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Descrição</th><th>Data</th><th>Forma</th><th>Valor</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-white">{p.description || (p.order ? `Pedido #${p.order.number}` : "Pagamento")}</td>
                    <td>{formatDate(p.paidAt ?? p.createdAt)}</td>
                    <td>{PAYMENT_METHOD_LABEL[p.method]}</td>
                    <td className="font-semibold text-white">{formatBRL(p.amountCents)}</td>
                    <td><StatusBadge kind="payment" status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}

      {receipts.length > 0 && (
        <Panel title="Recibos" description="Comprovantes comerciais em PDF (não substituem nota fiscal)." className="mt-6" flush>
          <ul className="divide-y divide-white/8">
            {receipts.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold text-white">{receiptNumber(r.number, r.issuedAt)} · {formatBRL(r.amountCents)}</p>
                  <p className="text-xs text-steel">{r.description} · {formatDate(r.issuedAt)}</p>
                </div>
                <a href={`/api/receipts/${r.id}/pdf`} className="btn btn-outline btn-sm"><FileDown className="h-4 w-4" /> Baixar PDF</a>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
