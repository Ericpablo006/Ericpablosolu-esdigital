import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { PageHeader, Panel, ProgressBar, TableWrap } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { firstParam, pageParam } from "@/lib/utils";
import { PROJECT_STATUS, options } from "@/types/labels";
import { formatDate } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Projetos" };
const PAGE = 15;

export default async function AdminProjects({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  const status = firstParam(sp.status);
  const page = pageParam(sp.page);
  const where: Prisma.ProjectWhereInput = {
    ...(status && status in PROJECT_STATUS ? { status: status as never } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { user: { name: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [total, projects] = await Promise.all([db.project.count({ where }), db.project.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { user: { select: { name: true } } } })]);

  return (
    <>
      <PageHeader title="Projetos" description="Acompanhe os projetos dos clientes. Eles veem status, prazo, valor e progresso na Área do Cliente." actions={<ButtonLink href="/admin/projetos/novo"><Plus className="h-4 w-4" /> Novo projeto</ButtonLink>} />
      <FilterBar placeholder="Buscar por projeto ou cliente…" className="mb-6" filters={[{ name: "status", label: "Todos os status", options: options(PROJECT_STATUS) }]} />
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Nenhum projeto encontrado" action={<ButtonLink href="/admin/projetos/novo">Criar projeto</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Projeto</th><th>Cliente</th><th>Status</th><th className="min-w-[180px]">Progresso</th><th>Prazo</th><th>Valor</th><th /></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/admin/projetos/${p.id}`} className="font-semibold text-white hover:text-sky">{p.title}</Link></td>
                    <td><Link href={`/admin/clientes/${p.userId}`} className="hover:text-white">{p.user.name}</Link></td>
                    <td><StatusBadge kind="project" status={p.status} /></td>
                    <td><ProgressBar value={p.progress} /></td>
                    <td>{formatDate(p.deadline)}</td>
                    <td className="font-semibold text-white">{formatBRL(p.valueCents)}</td>
                    <td className="text-right"><ButtonLink href={`/admin/projetos/${p.id}`} variant="outline" size="sm">Editar</ButtonLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/projetos" params={{ q, status }} />
    </>
  );
}
