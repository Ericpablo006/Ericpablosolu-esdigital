import Link from "next/link";
import { ArrowLeft, FileDown, Receipt } from "lucide-react";
import { ReceiptForm } from "@/components/admin/ops-forms";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/utils";
import { deleteReceipt } from "@/actions/admin/operations";
import { PAYMENT_METHOD_LABEL } from "@/types/labels";
import { formatDate, receiptNumber, toInputDate } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { formatCpfCnpj } from "@/utils/validators";

export const metadata = { title: "Recibos" };
const PAGE = 10;

export default async function AdminReceipts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = pageParam((await searchParams).page);
  const [total, receipts, users] = await Promise.all([
    db.receipt.count(),
    db.receipt.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, customer: { select: { cpfCnpj: true } } } }),
  ]);

  return (
    <>
      <Link href="/admin/pagamentos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Pagamentos</Link>
      <PageHeader title="Recibos de serviço" description="Gere recibos/comprovantes comerciais em PDF com a identidade da empresa. Não substituem Nota Fiscal eletrônica oficial." />

      <Panel title="Gerar novo recibo" className="mb-6">
        <ReceiptForm today={toInputDate(new Date())} customers={users.map((u) => ({ id: u.id, label: `${u.name} (${u.email})`, name: u.name, document: u.customer?.cpfCnpj ? formatCpfCnpj(u.customer.cpfCnpj) : "" }))} />
      </Panel>

      {receipts.length === 0 ? (
        <EmptyState icon={<Receipt className="h-6 w-6" />} title="Nenhum recibo gerado" />
      ) : (
        <Panel title="Recibos emitidos" flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Número</th><th>Cliente</th><th>Descrição</th><th>Forma</th><th>Valor</th><th>Data</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold text-white">{receiptNumber(r.number, r.issuedAt)}</td>
                    <td>{r.customerName}</td>
                    <td className="max-w-[240px] truncate">{r.description}</td>
                    <td>{PAYMENT_METHOD_LABEL[r.method]}</td>
                    <td className="font-semibold text-white">{formatBRL(r.amountCents)}</td>
                    <td>{formatDate(r.issuedAt)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <a href={`/api/receipts/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><FileDown className="h-3.5 w-3.5" /> PDF</a>
                        <ActionButton action={deleteReceipt} fields={{ id: r.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: "Excluir recibo?", message: "O recibo será removido definitivamente.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/pagamentos/recibos" />
    </>
  );
}
