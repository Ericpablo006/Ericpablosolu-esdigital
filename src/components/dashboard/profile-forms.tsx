"use client";

import { ActionForm } from "@/components/forms/action-form";
import { PasswordField, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { changePassword, updateProfile } from "@/actions/profile";

export function ProfileForm({ defaults }: { defaults: { name: string; email: string; whatsapp: string; company: string; cpfCnpj: string } }) {
  return (
    <ActionForm action={updateProfile} className="grid gap-5">
      <TextField name="name" label="Nome" required defaultValue={defaults.name} autoComplete="name" />
      <TextField name="email" label="E-mail" value={defaults.email} readOnly disabled hint="Para alterar o e-mail, fale com o suporte." />
      <TextField name="whatsapp" label="WhatsApp" required defaultValue={defaults.whatsapp} inputMode="tel" autoComplete="tel" />
      <TextField name="company" label="Empresa" defaultValue={defaults.company} autoComplete="organization" />
      <TextField name="cpfCnpj" label="CPF/CNPJ" defaultValue={defaults.cpfCnpj} inputMode="numeric" />
      <div><SubmitButton pendingText="Salvando…">Salvar alterações</SubmitButton></div>
    </ActionForm>
  );
}

export function ChangePasswordForm() {
  return (
    <ActionForm action={changePassword} className="grid gap-5" resetOnSuccess>
      <PasswordField name="current" label="Senha atual" required autoComplete="current-password" />
      <PasswordField name="password" label="Nova senha" required autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números." />
      <PasswordField name="confirmPassword" label="Confirmar nova senha" required autoComplete="new-password" />
      <div><SubmitButton pendingText="Alterando…">Alterar senha</SubmitButton></div>
    </ActionForm>
  );
}
