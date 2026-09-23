import { FileText } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { QUOTE_TYPE_LABEL } from "@/types/labels";
import { formatDate, quoteNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Orçamentos" };

export default async function ClientQuotes() {
  const user = await requireUser("/cliente/orcamentos");
  // Orçamentos feitos logado ou com o mesmo e-mail da conta.
  const quotes = await db.quote.findMany({ where: { OR: [{ userId: user.id }, { email: user.email }] }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Orçamentos" description="Acompanhe o andamento das suas solicitações." actions={<ButtonLink href="/orcamento">Solicitar orçamento</ButtonLink>} />
      {quotes.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Nenhum orçamento solicitado" action={<ButtonLink href="/orcamento">Montar orçamento</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Protocolo</th><th>Tipo</th><th>Objetivo</th><th>Data</th><th>Valor estimado</th><th>Status</th></tr></thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="font-semibold text-white">{quoteNumber(q.number)}</td>
                    <td>{QUOTE_TYPE_LABEL[q.type]}</td>
                    <td className="max-w-xs truncate">{q.objective}</td>
                    <td>{formatDate(q.createdAt)}</td>
                    <td className="text-white">{q.estimatedCents ? formatBRL(q.estimatedCents) : "—"}</td>
                    <td><StatusBadge kind="quote" status={q.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
