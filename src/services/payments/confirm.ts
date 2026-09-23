import { db } from "@/lib/db";
import { orderNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { notifyAdmins, notifyUser } from "@/services/notifications";

/**
 * Confirma um pagamento (idempotente). Só depois disso o pedido vira PAID
 * e os downloads dos produtos digitais são liberados.
 */
export async function confirmPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { items: true } }, project: true },
  });
  if (!payment) return { ok: false, error: "Pagamento não encontrado." };
  if (payment.status === "APPROVED") return { ok: true };
  if (payment.status === "REFUNDED") return { ok: false, error: "Pagamento já estornado." };

  const now = new Date();
  await db.$transaction(async (tx) => {
    // Atualização condicional evita processar duas vezes em chamadas simultâneas.
    const upd = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: ["PENDING", "REJECTED"] } },
      data: { status: "APPROVED", paidAt: now },
    });
    if (upd.count === 0) return;

    if (payment.order) {
      const order = payment.order;
      await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now } });
      const items = order.items.filter((i) => i.productId);
      for (const item of items) {
        await tx.download.upsert({
          where: { orderId_productId: { orderId: order.id, productId: item.productId as string } },
          create: { userId: order.userId, productId: item.productId as string, orderId: order.id },
          update: { maxDownloads: 10 },
        });
      }
      if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    }

    if (payment.project && payment.project.status === "AWAITING_PAYMENT") {
      await tx.project.update({ where: { id: payment.project.id }, data: { status: "IN_DEVELOPMENT" } });
    }
  });

  // Notificações (fora da transação; falhas aqui não invalidam o pagamento)
  try {
    if (payment.order) {
      const label = orderNumber(payment.order.number);
      await notifyUser(payment.order.userId, "Pagamento confirmado", `Pedido ${label} pago. Seus downloads foram liberados.`, `/pedido/${payment.order.number}`);
      await notifyAdmins("Pagamento aprovado", `${label} — ${formatBRL(payment.amountCents)}`, "/admin/pedidos");
    } else if (payment.userId) {
      await notifyUser(payment.userId, "Pagamento registrado", `Recebemos ${formatBRL(payment.amountCents)}. Obrigado!`, "/cliente/pagamentos");
    }
  } catch (err) {
    console.error("[confirmPayment] notificação falhou", err);
  }
  return { ok: true };
}

export async function refundPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) return { ok: false, error: "Pagamento não encontrado." };
  if (payment.status !== "APPROVED") return { ok: false, error: "Só é possível estornar pagamentos aprovados." };
  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
    if (payment.order) {
      await tx.order.update({ where: { id: payment.order.id }, data: { status: "REFUNDED" } });
      // Revoga o acesso aos downloads
      await tx.download.deleteMany({ where: { orderId: payment.order.id } });
    }
  });
  return { ok: true };
}
