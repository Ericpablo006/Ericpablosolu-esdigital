import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { firstParam, pageParam } from "@/lib/utils";
import { deleteProduct, toggleProduct } from "@/actions/admin/catalog";
import { formatBRL } from "@/utils/money";
import { isOnPromo } from "@/utils/pricing";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Produtos" };
const PAGE = 15;

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  const status = firstParam(sp.status);
  const page = pageParam(sp.page);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { category: { contains: q, mode: "insensitive" } }] } : {}),
    ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
  };
  const [total, products] = await Promise.all([db.product.count({ where }), db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE })]);

  return (
    <>
      <PageHeader title="Produtos" description="Loja de produtos digitais. Tudo aqui vem do banco de dados." actions={<ButtonLink href="/admin/produtos/novo"><Plus className="h-4 w-4" /> Novo produto</ButtonLink>} />
      <FilterBar placeholder="Buscar por nome ou categoria…" className="mb-6" filters={[{ name: "status", label: "Todos os status", options: [{ value: "active", label: "Ativos" }, { value: "inactive", label: "Inativos" }] }]} />
      {products.length === 0 ? (
        <EmptyState icon={<PackageSearch className="h-6 w-6" />} title="Nenhum produto encontrado" description="Cadastre o primeiro produto digital da loja." action={<ButtonLink href="/admin/produtos/novo">Novo produto</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Entrega</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 shrink-0 overflow-hidden rounded-lg"><Cover src={p.images[0]} alt="" category={p.category} seed={p.slug} sizes="48px" className="aspect-square" /></div>
                        <div className="min-w-0">
                          <Link href={`/admin/produtos/${p.id}`} className="block max-w-[260px] truncate font-semibold text-white hover:text-sky">{p.name}</Link>
                          <span className="text-xs text-steel">/{p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <span className="font-semibold text-white">{formatBRL(isOnPromo(p) ? (p.promoPriceCents as number) : p.priceCents)}</span>
                      {isOnPromo(p) && <span className="ml-2 text-xs text-steel line-through">{formatBRL(p.priceCents)}</span>}
                    </td>
                    <td>{p.fileKey ? <Badge tone="green">Arquivo</Badge> : p.externalUrl ? <Badge tone="cyan">Link</Badge> : <Badge tone="yellow">Sem arquivo</Badge>}</td>
                    <td>{p.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="gray">Inativo</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/produtos/${p.id}`} variant="outline" size="sm">Editar</ButtonLink>
                        <ActionButton action={toggleProduct} fields={{ id: p.id }} variant="ghost">{p.active ? "Desativar" : "Ativar"}</ActionButton>
                        <ActionButton action={deleteProduct} fields={{ id: p.id }} variant="ghost" className="text-danger hover:text-danger" confirm={{ title: `Excluir “${p.name}”?`, message: "Esta ação não pode ser desfeita. Produtos já vendidos não podem ser excluídos (desative-os).", confirmLabel: "Excluir" }}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/produtos" params={{ q, status }} />
    </>
  );
}
