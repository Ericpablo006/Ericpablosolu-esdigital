import { Field, PageHeader, Panel } from "@/components/dashboard/ui";
import { ChangePasswordForm } from "@/components/dashboard/profile-forms";
import { requireManager } from "@/lib/auth/session";

export const metadata = { title: "Minha conta" };

export default async function ManagerProfile() {
  const user = await requireManager();
  return (
    <>
      <PageHeader title="Minha conta" description="Acesso de gerente: consulta de pedidos, sem alterações." />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel title="Meus dados">
          <dl className="grid gap-4">
            <Field label="Nome">{user.name}</Field>
            <Field label="E-mail">{user.email}</Field>
            <Field label="Perfil">Gerente</Field>
          </dl>
        </Panel>
        <Panel title="Alterar senha"><ChangePasswordForm /></Panel>
      </div>
    </>
  );
}
