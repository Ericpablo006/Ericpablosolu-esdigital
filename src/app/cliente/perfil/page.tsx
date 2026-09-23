import { PageHeader, Panel } from "@/components/dashboard/ui";
import { ChangePasswordForm, ProfileForm } from "@/components/dashboard/profile-forms";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatPhoneBR } from "@/utils/format";
import { formatCpfCnpj } from "@/utils/validators";

export const metadata = { title: "Meu perfil" };

export default async function ClientProfile() {
  const user = await requireUser("/cliente/perfil");
  const customer = await db.customer.findUnique({ where: { userId: user.id } });
  return (
    <>
      <PageHeader title="Meu perfil" description="Mantenha seus dados atualizados." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Dados pessoais">
          <ProfileForm defaults={{ name: user.name, email: user.email, whatsapp: user.whatsapp ? formatPhoneBR(user.whatsapp) : "", company: customer?.company ?? "", cpfCnpj: customer?.cpfCnpj ? formatCpfCnpj(customer.cpfCnpj) : "" }} />
        </Panel>
        <Panel title="Alterar senha" description="Ao trocar a senha, suas outras sessões são encerradas.">
          <ChangePasswordForm />
        </Panel>
      </div>
    </>
  );
}
