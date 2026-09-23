import { Globe, Plus } from "lucide-react";
import { ServiceIcon } from "@/components/brand/icons";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { firstParam } from "@/lib/utils";
import { deleteService, toggleService } from "@/actions/admin/catalog";
import { formatBRL } from "@/utils/money";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Serviços" };

export default async function AdminServices({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = firstParam((await searchParams).q)?.trim();
  const where: Prisma.ServiceWhereInput = q ? { name: { contains: q, mode: "insensitive" } } : {};
  const services = await db.service.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageHeader title="Serviços" description="Serviços exibidos na página Serviços e na Home." actions={<ButtonLink href="/admin/servicos/novo"><Plus className="h-4 w-4" /> Novo serviço</ButtonLink>} />
      <FilterBar placeholder="Buscar serviço…" className="mb-6" />
      {services.length === 0 ? (
        <EmptyState icon={<Globe className="h-6 w-6" />} title="Nenhum serviço encontrado" action={<ButtonLink href="/admin/servicos/novo">Novo serviço</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Serviço</th><th>Preço inicial</th><th>Prazo</th><th>Home</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon/15 text-sky"><ServiceIcon name={s.icon} className="h-5 w-5" /></span>
                        <div className="min-w-0"><p className="max-w-[260px] truncate font-semibold text-white">{s.name}</p><p className="max-w-[260px] truncate text-xs text-steel">{s.shortDescription}</p></div>
                      </div>
                    </td>
                    <td className="text-white">{s.startingPriceCents ? formatBRL(s.startingPriceCents) : <span className="text-steel">Solicite orçamento</span>}</td>
                    <td>{s.deliveryTime || "—"}</td>
                    <td>{s.featured ? <Badge tone="blue">Destaque</Badge> : "—"}</td>
                    <td>{s.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="gray">Inativo</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/servicos/${s.id}`} variant="outline" size="sm">Editar</ButtonLink>
                        <ActionButton action={toggleService} fields={{ id: s.id }} variant="ghost">{s.active ? "Desativar" : "Ativar"}</ActionButton>
                        <ActionButton action={deleteService} fields={{ id: s.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: `Excluir “${s.name}”?`, message: "O serviço será removido do site. Projetos existentes são mantidos.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
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
