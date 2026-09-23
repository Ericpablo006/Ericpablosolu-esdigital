import { db } from "@/lib/db";

export type FinanceSummary = {
  receivedCents: number; // pagamentos aprovados no período
  pendingCents: number; // pagamentos pendentes criados no período
  productRevenueCents: number;
  serviceRevenueCents: number;
  otherRevenueCents: number;
  productsSold: number;
  servicesSold: number;
  paymentsCount: number;
};

export async function getFinanceSummary(start: Date, end: Date): Promise<FinanceSummary> {
  const [approved, pending, productItems, servicesSold] = await Promise.all([
    db.payment.findMany({ where: { status: "APPROVED", paidAt: { gte: start, lt: end } }, select: { amountCents: true, orderId: true, projectId: true } }),
    db.payment.aggregate({ where: { status: "PENDING", createdAt: { gte: start, lt: end } }, _sum: { amountCents: true } }),
    db.orderItem.aggregate({ where: { order: { status: "PAID", paidAt: { gte: start, lt: end } } }, _sum: { quantity: true } }),
    db.project.count({ where: { status: { not: "QUOTE" }, createdAt: { gte: start, lt: end } } }),
  ]);
  const sum = (f: (p: (typeof approved)[number]) => boolean) => approved.filter(f).reduce((s, p) => s + p.amountCents, 0);
  return {
    receivedCents: approved.reduce((s, p) => s + p.amountCents, 0),
    pendingCents: pending._sum.amountCents ?? 0,
    productRevenueCents: sum((p) => !!p.orderId),
    serviceRevenueCents: sum((p) => !p.orderId && !!p.projectId),
    otherRevenueCents: sum((p) => !p.orderId && !p.projectId),
    productsSold: productItems._sum.quantity ?? 0,
    servicesSold,
    paymentsCount: approved.length,
  };
}
