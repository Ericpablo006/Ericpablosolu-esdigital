import { SettingsForm } from "@/components/admin/ops-forms";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import { ChangePasswordForm } from "@/components/dashboard/profile-forms";
import { getPaymentProvider } from "@/services/payments";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Configurações" };

export default async function AdminSettings() {
  const s = await getSettings();
  const provider = getPaymentProvider();
  return (
    <>
      <PageHeader title="Configurações" description="Logo, contatos, textos e recebimento — sem mexer no código." />
      <p className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-steel">
        Provedor de pagamento ativo: <strong className="text-white">{provider.label}</strong> (definido pela variável de ambiente <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">PAYMENT_PROVIDER</code>).
      </p>
      <SettingsForm s={{ ...s }} />
      <Panel title="Minha senha" description="Troque a senha do administrador. As outras sessões abertas são encerradas." className="mt-6 max-w-xl">
        <ChangePasswordForm />
      </Panel>
    </>
  );
}
