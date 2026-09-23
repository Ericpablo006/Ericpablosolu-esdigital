import { UserCog } from "lucide-react";
import { NewManagerForm, ResetPasswordForm } from "@/components/admin/manager-forms";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteManager, toggleManagerActive } from "@/actions/admin/managers";
import { formatDate } from "@/utils/format";

export const metadata = { title: "Gerentes" };

export default async function AdminManagers() {
  await requireAdmin();
  const managers = await db.user.findMany({ where: { role: "MANAGER" }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Gerentes" description="Contas com acesso somente para consultar os pedidos dos clientes. O gerente entra pelo mesmo login do cliente (/entrar) e é levado ao painel dele." />
      <Panel title="Novo gerente" description="O gerente não confirma pagamentos, não altera nada e não vê finanças, CPF/CNPJ, downloads nem configurações." className="mb-6">
        <NewManagerForm />
      </Panel>
      {managers.length === 0 ? (
        <EmptyState icon={<UserCog className="h-6 w-6" />} title="Nenhum gerente cadastrado" />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Gerente</th><th>Desde</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.id}>
                    <td><p className="font-semibold text-white">{m.name}</p><p className="text-xs text-steel">{m.email}</p></td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td>{m.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="red">Desativado</Badge>}</td>
                    <td>
                      <div className="flex flex-wrap items-end justify-end gap-2">
                        <ResetPasswordForm id={m.id} name={m.name} />
                        <ActionButton action={toggleManagerActive} fields={{ id: m.id }} variant="ghost" confirm={m.active ? { title: `Desativar ${m.name}?`, message: "O gerente será desconectado e não conseguirá entrar até ser reativado.", confirmLabel: "Desativar" } : undefined}>
                          {m.active ? "Desativar" : "Reativar"}
                        </ActionButton>
                        <ActionButton action={deleteManager} fields={{ id: m.id }} variant="danger" confirm={{ title: `Excluir ${m.name}?`, message: "A conta de gerente será removida. Isso não afeta nenhum pedido.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
