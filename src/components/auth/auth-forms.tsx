"use client";

import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { PasswordField, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { adminLogin, forgotPassword, login, register, resetPassword } from "@/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={login} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField name="email" label="E-mail" type="email" required autoComplete="email" autoFocus />
      <div>
        <PasswordField name="password" label="Senha" required autoComplete="current-password" />
        <Link href="/esqueci-senha" className="mt-2 inline-block text-xs font-medium text-sky hover:text-white">Esqueci minha senha</Link>
      </div>
      <SubmitButton className="w-full" pendingText="Entrando…">Entrar</SubmitButton>
    </ActionForm>
  );
}

export function AdminLoginForm() {
  return (
    <ActionForm action={adminLogin} className="space-y-5">
      <TextField name="email" label="E-mail do administrador" type="email" required autoComplete="username" autoFocus />
      <PasswordField name="password" label="Senha" required autoComplete="current-password" />
      <SubmitButton className="w-full" pendingText="Verificando…">Acessar painel</SubmitButton>
    </ActionForm>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  return (
    <ActionForm action={register} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField name="name" label="Nome completo" required autoComplete="name" maxLength={120} />
      <TextField name="email" label="E-mail" type="email" required autoComplete="email" />
      <TextField name="whatsapp" label="WhatsApp" required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
      <PasswordField name="password" label="Senha" required autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números." />
      <PasswordField name="confirmPassword" label="Confirmar senha" required autoComplete="new-password" />
      <SubmitButton className="w-full" pendingText="Criando conta…">Criar conta</SubmitButton>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={forgotPassword} className="space-y-5" resetOnSuccess>
      <TextField name="email" label="E-mail da conta" type="email" required autoComplete="email" autoFocus />
      <SubmitButton className="w-full" pendingText="Enviando…">Enviar link de redefinição</SubmitButton>
    </ActionForm>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  return (
    <ActionForm action={resetPassword} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField name="password" label="Nova senha" required autoComplete="new-password" hint="Mínimo de 8 caracteres, com letras e números." />
      <PasswordField name="confirmPassword" label="Confirmar nova senha" required autoComplete="new-password" />
      <SubmitButton className="w-full" pendingText="Salvando…">Redefinir senha</SubmitButton>
    </ActionForm>
  );
}
