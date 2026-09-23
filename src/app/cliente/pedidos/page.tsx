import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { PageHeader, Panel, TableWrap } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/utils";
import { formatDate, orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Meus pedidos" };
const PAGE = 10;

export default async function ClientOrders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/cliente/pedidos");
  const page = pageParam((await searchParams).page);
  const where = { userId: user.id };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { items: true } }),
  ]);

  return (
    <>
      <PageHeader title="Meus pedidos" description="Histórico das suas compras de produtos digitais." />
      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Você ainda não fez pedidos" action={<ButtonLink href="/produtos">Explorar produtos</ButtonLink>} />
      ) : (
        <Panel flush>
          <TableWrap>
            <table className="table-x">
              <thead><tr><th>Pedido</th><th>Data</th><th>Itens</th><th>Total</th><th>Status</th><th /></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-semibold text-white">{orderNumber(o.number)}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td className="max-w-xs truncate">{o.items.map((i) => i.name).join(", ")}</td>
                    <td className="font-semibold text-white">{formatBRL(o.totalCents)}</td>
                    <td><StatusBadge kind="order" status={o.status} /></td>
                    <td className="text-right"><Link href={`/pedido/${o.number}`} className="text-sm font-semibold text-sky hover:text-white">{o.status === "PENDING" ? "Pagar" : "Detalhes"}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PAGE)} basePath="/cliente/pedidos" />
    </>
  );
}
