import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { firstParam, pageParam } from "@/lib/utils";
import { QUOTE_STATUS, QUOTE_TYPE_LABEL, options } from "@/types/labels";
import { formatDateTime, formatPhoneBR, quoteNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Orçamentos" };
const PAGE = 15;

export default async function AdminQuotes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  const status = firstParam(sp.status);
  const type = firstParam(sp.type);
  const page = pageParam(sp.page);
  const where: Prisma.QuoteWhereInput = {
    ...(status && status in QUOTE_STATUS ? { status: status as never } : {}),
    ...(type && type in QUOTE_TYPE_LABEL ? { type: type as never } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { company: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [total, quotes] = await Promise.all([db.quote.count({ where }), db.quote.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE })]);

  return (
    <>
      <PageHeader title="Orçamentos" description="Solicitações enviadas pelo “Monte seu orçamento”." />
      <FilterBar placeholder="Buscar por nome, empresa ou e-mail…" className="mb-6" filters={[{ name: "status", label: "Todos os status", options: options(QUOTE_STATUS) }, { name: "type", label: "Todos os tipos", options: options(QUOTE_TYPE_LABEL) }]} />
      {quotes.length === 0 ? (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Nenhum orçamento encontrado" description="Quando alguém solicitar um orçamento pelo site, aparecerá aqui." />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Protocolo</th><th>Cliente</th><th>Tipo</th><th>Prazo</th><th>Data</th><th>Status</th><th /></tr></thead>
              <tbody>
                {quotes.map((x) => (
                  <tr key={x.id}>
                    <td><Link href={`/admin/orcamentos/${x.id}`} className="font-semibold text-white hover:text-sky">{quoteNumber(x.number)}</Link></td>
                    <td><p className="text-white">{x.name}{x.company ? ` · ${x.company}` : ""}</p><p className="text-xs text-steel">{formatPhoneBR(x.whatsapp)}</p></td>
                    <td>{QUOTE_TYPE_LABEL[x.type]}{x.estimatedCents ? <p className="text-xs text-steel">{formatBRL(x.estimatedCents)}</p> : null}</td>
                    <td className="max-w-[160px] truncate">{x.deadline}</td>
                    <td className="whitespace-nowrap">{formatDateTime(x.createdAt)}</td>
                    <td><StatusBadge kind="quote" status={x.status} /></td>
                    <td className="text-right"><ButtonLink href={`/admin/orcamentos/${x.id}`} variant="outline" size="sm">Abrir</ButtonLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/orcamentos" params={{ q, status, type }} />
    </>
  );
}
