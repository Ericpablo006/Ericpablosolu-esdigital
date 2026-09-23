import { db } from "@/lib/db";
import { addMonthsSP, startOfMonthSP } from "@/utils/dates";
import { formatMonth } from "@/utils/format";

export async function getAdminDashboard() {
  const now = new Date();
  const monthStart = startOfMonthSP(now);
  const sixMonthsAgo = addMonthsSP(monthStart, -5);
  const last30 = new Date(now.getTime() - 30 * 86400_000);

  const [revenueAll, revenueMonth, ordersTotal, ordersPending, newCustomers, quotesNew, quotesTotal, projectsActive, productsSold, payments6m, quotesByStatus, projectsByStatus, topItems, openTickets] =
    await Promise.all([
      db.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amountCents: true } }),
      db.payment.aggregate({ where: { status: "APPROVED", paidAt: { gte: monthStart } }, _sum: { amountCents: true } }),
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: last30 } } }),
      db.quote.count({ where: { status: "NEW" } }),
      db.quote.count(),
      db.project.count({ where: { status: { in: ["IN_DEVELOPMENT", "IN_REVIEW"] } } }),
      db.orderItem.aggregate({ where: { order: { status: "PAID" } }, _sum: { quantity: true } }),
      db.payment.findMany({ where: { status: "APPROVED", paidAt: { gte: sixMonthsAgo } }, select: { amountCents: true, paidAt: true } }),
      db.quote.groupBy({ by: ["status"], _count: { _all: true } }),
      db.project.groupBy({ by: ["status"], _count: { _all: true } }),
      db.orderItem.groupBy({ by: ["name"], where: { order: { status: "PAID" } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const start = addMonthsSP(sixMonthsAgo, i);
    return { label: formatMonth(new Date(start.getTime() + 12 * 3600_000)), start, valueCents: 0 };
  });
  for (const p of payments6m) {
    if (!p.paidAt) continue;
    for (let i = months.length - 1; i >= 0; i--) {
      if (p.paidAt >= months[i].start) {
        months[i].valueCents += p.amountCents;
        break;
      }
    }
  }

  return {
    revenueTotalCents: revenueAll._sum.amountCents ?? 0,
    revenueMonthCents: revenueMonth._sum.amountCents ?? 0,
    ordersTotal,
    ordersPending,
    newCustomers,
    quotesNew,
    quotesTotal,
    projectsActive,
    productsSold: productsSold._sum.quantity ?? 0,
    openTickets,
    revenueByMonth: months.map((m) => ({ label: m.label, value: m.valueCents / 100 })),
    quotesByStatus: quotesByStatus.map((q) => ({ key: q.status as string, value: q._count._all })),
    projectsByStatus: projectsByStatus.map((p) => ({ key: p.status as string, value: p._count._all })),
    topProducts: topItems.map((t) => ({ label: t.name, value: t._sum.quantity ?? 0 })),
  };
}
