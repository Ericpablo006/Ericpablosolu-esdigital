import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionButton } from "@/components/forms/action-button";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReplyForm } from "@/components/support/ticket-parts";
import { Thread } from "@/components/support/thread";
import { db } from "@/lib/db";
import { replyTicketAsAdmin, setTicketStatus } from "@/actions/support";
import { ticketNumber } from "@/utils/format";

export const metadata = { title: "Chamado" };

export default async function AdminTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await db.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } }, project: { select: { id: true, title: true } }, messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } } },
  });
  if (!t) notFound();

  return (
    <>
      <Link href="/admin/suporte" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Suporte</Link>
      <PageHeader
        title={`${ticketNumber(t.number)} · ${t.subject}`}
        description={`${t.user.name} (${t.user.email})${t.project ? ` · Projeto: ${t.project.title}` : ""}`}
        actions={
          <>
            <StatusBadge kind="ticket" status={t.status} />
            {t.status !== "IN_PROGRESS" && t.status !== "RESOLVED" && <ActionButton action={setTicketStatus} fields={{ ticketId: t.id, status: "IN_PROGRESS" }} size="md">Iniciar atendimento</ActionButton>}
            {t.status !== "RESOLVED" ? <ActionButton action={setTicketStatus} fields={{ ticketId: t.id, status: "RESOLVED" }} variant="primary" size="md">Marcar como resolvido</ActionButton> : <ActionButton action={setTicketStatus} fields={{ ticketId: t.id, status: "OPEN" }} size="md">Reabrir</ActionButton>}
          </>
        }
      />
      <div className="mx-auto max-w-3xl space-y-6">
        <Thread messages={t.messages} staffLabel="Equipe" />
        <Panel><ReplyForm ticketId={t.id} action={replyTicketAsAdmin} placeholder="Responda ao cliente…" /></Panel>
      </div>
    </>
  );
}
