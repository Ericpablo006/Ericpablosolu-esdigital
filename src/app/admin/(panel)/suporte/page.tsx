import Link from "next/link";
import { Headset, Inbox } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { WhatsAppIcon } from "@/components/brand/icons";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { cn, firstParam, pageParam } from "@/lib/utils";
import { deleteContactMessage, toggleContactHandled } from "@/actions/admin/operations";
import { TICKET_STATUS, options } from "@/types/labels";
import { formatDateTime, formatPhoneBR, ticketNumber, whatsappUrl } from "@/utils/format";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Suporte" };
const PAGE = 15;

export default async function AdminSupport({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = firstParam(sp.tab) === "mensagens" ? "mensagens" : "chamados";
  const q = firstParam(sp.q)?.trim();
  const status = firstParam(sp.status);
  const page = pageParam(sp.page);

  const [openTickets, pendingMessages] = await Promise.all([db.supportTicket.count({ where: { status: { not: "RESOLVED" } } }), db.contactMessage.count({ where: { handled: false } })]);
  const tabCls = (active: boolean) => cn("rounded-xl px-4 py-2 text-sm font-semibold transition", active ? "bg-neon/20 text-white" : "text-silver hover:text-white");

  let content: React.ReactNode;
  let pageCount = 1;

  if (tab === "chamados") {
    const where: Prisma.SupportTicketWhereInput = {
      ...(status && status in TICKET_STATUS ? { status: status as never } : {}),
      ...(q ? { OR: [{ subject: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : {}),
    };
    const [total, tickets] = await Promise.all([db.supportTicket.count({ where }), db.supportTicket.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { user: { select: { name: true } }, project: { select: { title: true } }, _count: { select: { messages: true } } } })]);
    pageCount = Math.ceil(total / PAGE);
    content = tickets.length === 0 ? (
      <EmptyState icon={<Headset className="h-6 w-6" />} title="Nenhum chamado encontrado" />
    ) : (
      <Panel flush>
        <TableWrap>
          <table className="table-x">
            <thead><tr><th>Chamado</th><th>Cliente</th><th>Projeto</th><th>Mensagens</th><th>Atualizado</th><th>Status</th><th /></tr></thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="max-w-[260px]"><Link href={`/admin/suporte/${t.id}`} className="block truncate font-semibold text-white hover:text-sky"><span className="mr-2 text-steel">{ticketNumber(t.number)}</span>{t.subject}</Link></td>
                  <td>{t.user.name}</td>
                  <td>{t.project?.title ?? "—"}</td>
                  <td>{t._count.messages}</td>
                  <td className="whitespace-nowrap">{formatDateTime(t.updatedAt)}</td>
                  <td><StatusBadge kind="ticket" status={t.status} /></td>
                  <td className="text-right"><ButtonLink href={`/admin/suporte/${t.id}`} variant="outline" size="sm">Abrir</ButtonLink></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    );
  } else {
    const where: Prisma.ContactMessageWhereInput = q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {};
    const [total, messages] = await Promise.all([db.contactMessage.count({ where }), db.contactMessage.findMany({ where, orderBy: [{ handled: "asc" }, { createdAt: "desc" }], skip: (page - 1) * PAGE, take: PAGE })]);
    pageCount = Math.ceil(total / PAGE);
    content = messages.length === 0 ? (
      <EmptyState icon={<Inbox className="h-6 w-6" />} title="Nenhuma mensagem de contato" />
    ) : (
      <div className="space-y-4">
        {messages.map((m) => (
          <article key={m.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-white">{m.subject} {m.handled ? <Badge tone="green" className="ml-2">Atendida</Badge> : <Badge tone="yellow" className="ml-2">Pendente</Badge>}</h2>
                <p className="mt-1 text-xs text-steel">{m.name} · <a href={`mailto:${m.email}`} className="hover:text-white">{m.email}</a> · {formatPhoneBR(m.whatsapp)} · {formatDateTime(m.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={whatsappUrl(m.whatsapp, `Olá, ${m.name.split(" ")[0]}! Recebemos sua mensagem "${m.subject}" na Eric Pablo Soluções Digitais.`)} variant="whatsapp" size="sm"><WhatsAppIcon className="h-3.5 w-3.5" /> Responder</ButtonLink>
                <ActionButton action={toggleContactHandled} fields={{ id: m.id }} variant="outline">{m.handled ? "Marcar pendente" : "Marcar atendida"}</ActionButton>
                <ActionButton action={deleteContactMessage} fields={{ id: m.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: "Excluir mensagem?", message: "Esta ação não pode ser desfeita.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-silver">{m.message}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Suporte" description="Chamados dos clientes e mensagens do formulário de contato." />
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1.5 sm:w-fit" role="tablist">
        <Link href="/admin/suporte" role="tab" aria-selected={tab === "chamados"} className={tabCls(tab === "chamados")}>Chamados{openTickets ? ` (${openTickets})` : ""}</Link>
        <Link href="/admin/suporte?tab=mensagens" role="tab" aria-selected={tab === "mensagens"} className={tabCls(tab === "mensagens")}>Mensagens de contato{pendingMessages ? ` (${pendingMessages})` : ""}</Link>
      </div>
      <FilterBar placeholder={tab === "chamados" ? "Buscar por assunto ou cliente…" : "Buscar por nome, e-mail ou assunto…"} className="mb-6" filters={tab === "chamados" ? [{ name: "status", label: "Todos os status", options: options(TICKET_STATUS) }] : []} />
      {content}
      <Pagination page={page} pageCount={pageCount} basePath="/admin/suporte" params={{ tab: tab === "mensagens" ? "mensagens" : undefined, q, status }} />
    </>
  );
}
