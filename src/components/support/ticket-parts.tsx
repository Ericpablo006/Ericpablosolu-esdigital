"use client";

import { ActionForm } from "@/components/forms/action-form";
import { SelectField, TextArea, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { createTicket } from "@/actions/support";
import type { ActionState } from "@/lib/action";

export function ReplyForm({ ticketId, action, placeholder = "Escreva sua mensagem…" }: { ticketId: string; action: (p: ActionState, f: FormData) => Promise<ActionState>; placeholder?: string }) {
  return (
    <ActionForm action={action} resetOnSuccess className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <TextArea name="body" label="Responder" required rows={4} maxLength={5000} placeholder={placeholder} />
      <SubmitButton pendingText="Enviando…">Enviar mensagem</SubmitButton>
    </ActionForm>
  );
}

export function NewTicketForm({ projects }: { projects: { id: string; title: string }[] }) {
  return (
    <ActionForm action={createTicket} className="grid gap-5">
      <TextField name="subject" label="Assunto" required maxLength={150} />
      <SelectField name="projectId" label="Projeto relacionado (opcional)" placeholder="Nenhum" options={projects.map((p) => ({ value: p.id, label: p.title }))} />
      <TextArea name="message" label="Descreva sua solicitação" required rows={5} maxLength={5000} />
      <div><SubmitButton pendingText="Abrindo chamado…">Abrir chamado</SubmitButton></div>
    </ActionForm>
  );
}
