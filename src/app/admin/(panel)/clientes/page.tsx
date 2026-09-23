import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge, EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { firstParam, pageParam } from "@/lib/utils";
import { toggleUserActive } from "@/actions/admin/operations";
import { formatDate, formatPhoneBR } from "@/utils/format";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Clientes" };
const PAGE = 15;

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  const role = firstParam(sp.role);
  const page = pageParam(sp.page);
  const where: Prisma.UserWhereInput = {
    ...(role === "ADMIN" ? { role: "ADMIN" } : role === "MANAGER" ? { role: "MANAGER" } : role === "CUSTOMER" ? { role: "CUSTOMER" } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { whatsapp: { contains: q.replace(/\D/g, "") || q } }, { customer: { company: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { customer: true, _count: { select: { orders: true, projects: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Clientes" description="Contas cadastradas no site e clientes criados manualmente." actions={<ButtonLink href="/admin/clientes/novo"><Plus className="h-4 w-4" /> Novo cliente</ButtonLink>} />
      <FilterBar placeholder="Buscar por nome, e-mail, WhatsApp ou empresa…" className="mb-6" filters={[{ name: "role", label: "Todos os perfis", options: [{ value: "CUSTOMER", label: "Clientes" }, { value: "MANAGER", label: "Gerentes" }, { value: "ADMIN", label: "Administradores" }] }]} />
      {users.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum cliente encontrado" />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Cliente</th><th>Contato</th><th>Pedidos</th><th>Projetos</th><th>Desde</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/clientes/${u.id}`} className="font-semibold text-white hover:text-sky">{u.name}</Link>
                      {u.role === "ADMIN" && <Badge tone="blue" className="ml-2">Admin</Badge>}
                      {u.role === "MANAGER" && <Badge tone="yellow" className="ml-2">Gerente</Badge>}
                      {u.customer?.company && <p className="text-xs text-steel">{u.customer.company}</p>}
                    </td>
                    <td><p>{u.email}</p><p className="text-xs text-steel">{u.whatsapp ? formatPhoneBR(u.whatsapp) : "—"}</p></td>
                    <td>{u._count.orders}</td>
                    <td>{u._count.projects}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="red">Desativado</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/clientes/${u.id}`} variant="outline" size="sm">Ver</ButtonLink>
                        {u.id !== me.id && (
                          <ActionButton action={toggleUserActive} fields={{ id: u.id }} variant="ghost" confirm={u.active ? { title: `Desativar ${u.name}?`, message: "A pessoa será desconectada e não conseguirá entrar até ser reativada.", confirmLabel: "Desativar" } : undefined}>
                            {u.active ? "Desativar" : "Reativar"}
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/clientes" params={{ q, role }} />
    </>
  );
}
