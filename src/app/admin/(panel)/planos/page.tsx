import { BadgeDollarSign, Plus } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { deletePlan, togglePlan } from "@/actions/admin/catalog";
import { BILLING_LABEL } from "@/types/labels";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Planos" };

export default async function AdminPlans() {
  const plans = await db.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }] });
  return (
    <>
      <PageHeader title="Planos" description="Edite nome, preço, benefícios e tipo de cobrança dos planos." actions={<ButtonLink href="/admin/planos/novo"><Plus className="h-4 w-4" /> Novo plano</ButtonLink>} />
      {plans.length === 0 ? (
        <EmptyState icon={<BadgeDollarSign className="h-6 w-6" />} title="Nenhum plano cadastrado" action={<ButtonLink href="/admin/planos/novo">Novo plano</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Plano</th><th>Preço</th><th>Cobrança</th><th>Benefícios</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td><p className="font-semibold text-white">{p.name} {p.highlighted && <Badge tone="blue" className="ml-1">Destaque</Badge>}</p><p className="text-xs text-steel">{p.description}</p></td>
                    <td className="font-semibold text-white">{formatBRL(p.priceCents)}{p.billing === "MONTHLY" && <span className="text-xs font-normal text-steel">/mês</span>}</td>
                    <td>{BILLING_LABEL[p.billing]}</td>
                    <td>{p.features.length}</td>
                    <td>{p.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="gray">Inativo</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/planos/${p.id}`} variant="outline" size="sm">Editar</ButtonLink>
                        <ActionButton action={togglePlan} fields={{ id: p.id }} variant="ghost">{p.active ? "Desativar" : "Ativar"}</ActionButton>
                        <ActionButton action={deletePlan} fields={{ id: p.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: `Excluir “${p.name}”?`, message: "O plano será removido do site.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
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
