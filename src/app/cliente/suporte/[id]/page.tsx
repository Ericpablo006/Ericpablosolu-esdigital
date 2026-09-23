import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActionButton } from "@/components/forms/action-button";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReplyForm } from "@/components/support/ticket-parts";
import { Thread } from "@/components/support/thread";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { replyTicketAsCustomer, setTicketStatus } from "@/actions/support";
import { ticketNumber } from "@/utils/format";

export const metadata = { title: "Chamado" };

export default async function ClientTicket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("/cliente/suporte");
  const ticket = await db.supportTicket.findFirst({
    where: { id, userId: user.id },
    include: { project: { select: { title: true } }, messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } } },
  });
  if (!ticket) notFound();

  return (
    <>
      <Link href="/cliente/suporte" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar aos chamados</Link>
      <PageHeader
        title={`${ticketNumber(ticket.number)} · ${ticket.subject}`}
        description={ticket.project ? `Projeto: ${ticket.project.title}` : undefined}
        actions={
          <>
            <StatusBadge kind="ticket" status={ticket.status} />
            {ticket.status !== "RESOLVED" ? (
              <ActionButton action={setTicketStatus} fields={{ ticketId: ticket.id, status: "RESOLVED" }}>Marcar como resolvido</ActionButton>
            ) : (
              <ActionButton action={setTicketStatus} fields={{ ticketId: ticket.id, status: "OPEN" }}>Reabrir chamado</ActionButton>
            )}
          </>
        }
      />
      <div className="mx-auto max-w-3xl space-y-6">
        <Thread messages={ticket.messages} />
        <Panel><ReplyForm ticketId={ticket.id} action={replyTicketAsCustomer} /></Panel>
      </div>
    </>
  );
}
