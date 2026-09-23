import { Briefcase, Plus } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { db } from "@/lib/db";
import { firstParam } from "@/lib/utils";
import { deletePortfolio, togglePortfolio } from "@/actions/admin/catalog";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Portfólio" };

export default async function AdminPortfolio({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = firstParam((await searchParams).q)?.trim();
  const where: Prisma.PortfolioItemWhereInput = q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { client: { contains: q, mode: "insensitive" } }] } : {};
  const items = await db.portfolioItem.findMany({ where, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <>
      <PageHeader title="Portfólio" description="Trabalhos realizados exibidos no site." actions={<ButtonLink href="/admin/portfolio/novo"><Plus className="h-4 w-4" /> Novo projeto</ButtonLink>} />
      <FilterBar placeholder="Buscar por projeto ou cliente…" className="mb-6" />
      {items.length === 0 ? (
        <EmptyState icon={<Briefcase className="h-6 w-6" />} title="Nenhum projeto no portfólio" action={<ButtonLink href="/admin/portfolio/novo">Adicionar projeto</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Projeto</th><th>Cliente</th><th>Categoria</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-14 shrink-0 overflow-hidden rounded-lg"><Cover src={p.image} alt="" category={p.category} seed={p.title} sizes="56px" className="aspect-[4/3]" /></div>
                        <span className="max-w-[260px] truncate font-semibold text-white">{p.title}</span>
                      </div>
                    </td>
                    <td>{p.client}</td>
                    <td><Badge tone="blue">{p.category}</Badge></td>
                    <td>{p.active ? <Badge tone="green">Publicado</Badge> : <Badge tone="gray">Oculto</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/portfolio/${p.id}`} variant="outline" size="sm">Editar</ButtonLink>
                        <ActionButton action={togglePortfolio} fields={{ id: p.id }} variant="ghost">{p.active ? "Ocultar" : "Publicar"}</ActionButton>
                        <ActionButton action={deletePortfolio} fields={{ id: p.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: `Excluir “${p.title}”?`, message: "O projeto será removido do portfólio.", confirmLabel: "Excluir" }}>Excluir</ActionButton>
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
