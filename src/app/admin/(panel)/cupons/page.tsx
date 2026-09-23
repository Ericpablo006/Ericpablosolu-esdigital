import { Plus, TicketPercent } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { deleteCoupon, toggleCoupon } from "@/actions/admin/catalog";
import { formatDate } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Cupons" };

export default async function AdminCoupons() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <>
      <PageHeader title="Cupons" description="Códigos de desconto aplicados no checkout." actions={<ButtonLink href="/admin/cupons/novo"><Plus className="h-4 w-4" /> Novo cupom</ButtonLink>} />
      {coupons.length === 0 ? (
        <EmptyState icon={<TicketPercent className="h-6 w-6" />} title="Nenhum cupom criado" action={<ButtonLink href="/admin/cupons/novo">Criar cupom</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Código</th><th>Desconto</th><th>Mínimo</th><th>Usos</th><th>Validade</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expiresAt && c.expiresAt < now;
                  const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                  return (
                    <tr key={c.id}>
                      <td className="font-mono font-semibold text-white">{c.code}</td>
                      <td className="text-white">{c.type === "PERCENT" ? `${c.value}%` : formatBRL(c.value)}</td>
                      <td>{c.minOrderCents ? formatBRL(c.minOrderCents) : "—"}</td>
                      <td>{c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</td>
                      <td>{c.expiresAt ? formatDate(c.expiresAt) : "Sem validade"}</td>
                      <td>{!c.active ? <Badge tone="gray">Inativo</Badge> : expired ? <Badge tone="red">Expirado</Badge> : exhausted ? <Badge tone="yellow">Esgotado</Badge> : <Badge tone="green">Ativo</Badge>}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <ButtonLink href={`/admin/cupons/${c.id}`} variant="outline" size="sm">Editar</ButtonLink>
                          <ActionButton action={toggleCoupon} fields={{ id: c.id }} variant="ghost">{c.active ? "Desativar" : "Ativar"}</ActionButton>
                          <ActionButton action={deleteCoupon} fields={{ id: c.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: `Excluir o cupom ${c.code}?`, message: "Pedidos já feitos com este cupom não são afetados.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
