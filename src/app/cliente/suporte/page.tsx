import Link from "next/link";
import { Headset, Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { NewTicketForm } from "@/components/support/ticket-parts";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDateTime, ticketNumber } from "@/utils/format";

export const metadata = { title: "Suporte" };

export default async function ClientSupport() {
  const user = await requireUser("/cliente/suporte");
  const [tickets, projects] = await Promise.all([
    db.supportTicket.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { project: { select: { title: true } }, _count: { select: { messages: true } } } }),
    db.project.findMany({ where: { userId: user.id }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Suporte" description="Abra chamados, acompanhe respostas e veja o histórico." />
      <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Meus chamados" flush>
          {tickets.length === 0 ? (
            <div className="p-5"><EmptyState icon={<Headset className="h-6 w-6" />} title="Nenhum chamado aberto" description="Precisa de ajuda? Abra um chamado ao lado." /></div>
          ) : (
            <ul className="divide-y divide-white/8">
              {tickets.map((t) => (
                <li key={t.id}>
                  <Link href={`/cliente/suporte/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-white/[0.03]">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white"><span className="mr-2 text-steel">{ticketNumber(t.number)}</span>{t.subject}</p>
                      <p className="mt-0.5 text-xs text-steel">{t.project ? `${t.project.title} · ` : ""}{t._count.messages} mensagens · atualizado {formatDateTime(t.updatedAt)}</p>
                    </div>
                    <StatusBadge kind="ticket" status={t.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Abrir novo chamado" actions={<Plus className="h-4 w-4 text-steel" aria-hidden />}>
          <NewTicketForm projects={projects} />
        </Panel>
      </div>
    </>
  );
}
