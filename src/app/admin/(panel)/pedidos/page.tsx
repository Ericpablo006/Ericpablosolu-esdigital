import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { firstParam, pageParam } from "@/lib/utils";
import { confirmOrderPayment } from "@/actions/admin/operations";
import { ORDER_STATUS, options } from "@/types/labels";
import { formatDateTime, orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Pedidos" };
const PAGE = 15;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = firstParam(sp.q)?.trim();
  const status = firstParam(sp.status);
  const page = pageParam(sp.page);
  const num = q ? parseInt(q.replace(/\D/g, ""), 10) : NaN;
  const where: Prisma.OrderWhereInput = {
    ...(status && status in ORDER_STATUS ? { status: status as never } : {}),
    ...(q ? { OR: [{ buyerName: { contains: q, mode: "insensitive" } }, { buyerEmail: { contains: q, mode: "insensitive" } }, ...(Number.isFinite(num) ? [{ number: num }] : [])] } : {}),
  };
  const [total, orders] = await Promise.all([db.order.count({ where }), db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { items: true } })]);

  return (
    <>
      <PageHeader title="Pedidos" description="Compras de produtos digitais. Confirme pagamentos recebidos por PIX manual." />
      <FilterBar placeholder="Buscar por nº do pedido, nome ou e-mail…" className="mb-6" filters={[{ name: "status", label: "Todos os status", options: options(ORDER_STATUS) }]} />
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Nenhum pedido encontrado" />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Pedido</th><th>Cliente</th><th className="hidden xl:table-cell">Itens</th><th>Total</th><th>Data</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-white hover:text-sky">{orderNumber(o.number)}</Link></td>
                    <td><p className="text-white">{o.buyerName}</p><p className="text-xs text-steel">{o.buyerEmail}</p></td>
                    <td className="hidden max-w-[220px] truncate xl:table-cell">{o.items.map((i) => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`).join(", ")}</td>
                    <td className="font-semibold text-white">{formatBRL(o.totalCents)}</td>
                    <td className="whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    <td><StatusBadge kind="order" status={o.status} /></td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ButtonLink href={`/admin/pedidos/${o.id}`} variant="outline" size="sm">Detalhes</ButtonLink>
                        {o.status === "PENDING" && (
                          <ActionButton action={confirmOrderPayment} fields={{ id: o.id }} variant="primary" confirm={{ title: "Confirmar pagamento?", message: `Confirme apenas se ${formatBRL(o.totalCents)} foi recebido. O cliente terá acesso imediato aos downloads.`, confirmLabel: "Confirmar pagamento" }}>Confirmar pagamento</ActionButton>
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
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/admin/pedidos" params={{ q, status }} />
    </>
  );
}
