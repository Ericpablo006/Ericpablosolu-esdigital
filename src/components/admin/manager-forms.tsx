"use client";

import { useState } from "react";
import { ActionForm } from "@/components/forms/action-form";
import { PasswordField, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { createManager, resetManagerPassword } from "@/actions/admin/managers";

export function NewManagerForm() {
  return (
    <ActionForm action={createManager} className="grid gap-5 md:grid-cols-3" showSuccess resetOnSuccess>
      <TextField name="name" label="Nome" required autoComplete="off" />
      <TextField name="email" label="E-mail de acesso" type="email" required autoComplete="off" />
      <PasswordField name="password" label="Senha inicial" required autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números. Envie ao gerente por um canal seguro." />
      <div className="md:col-span-3"><SubmitButton pendingText="Cadastrando…">Adicionar gerente</SubmitButton></div>
    </ActionForm>
  );
}

/** Abre um formulário curto para definir uma nova senha (encerra as sessões abertas do gerente). */
export function ResetPasswordForm({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>Nova senha</button>;
  return (
    <ActionForm action={resetManagerPassword} className="flex min-w-[260px] items-end gap-2" showSuccess resetOnSuccess>
      <input type="hidden" name="id" value={id} />
      <PasswordField name="password" label={`Nova senha — ${name}`} required autoComplete="new-password" />
      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Fechar</button>
    </ActionForm>
  );
}
