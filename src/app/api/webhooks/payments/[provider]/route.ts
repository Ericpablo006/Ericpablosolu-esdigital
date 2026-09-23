import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProviderById } from "@/services/payments";
import { confirmPayment, refundPayment } from "@/services/payments/confirm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Recebe notificações de pagamento de um gateway. Cada provedor valida a própria assinatura
 * (`parseWebhook`); requisições sem assinatura válida são rejeitadas. Veja src/services/payments/README.md.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: id } = await params;
  const provider = getProviderById(id);
  if (!provider?.parseWebhook) return new NextResponse("Não encontrado.", { status: 404 });

  const raw = await req.text();
  if (raw.length > 100_000) return new NextResponse("Payload grande demais.", { status: 413 });

  const event = await provider.parseWebhook(req.headers, raw);
  if (!event) return new NextResponse("Assinatura inválida.", { status: 401 });

  const payment = await db.payment.findUnique({ where: { provider_providerRef: { provider: provider.id, providerRef: event.providerRef } } });
  if (!payment) return new NextResponse("Pagamento não encontrado.", { status: 404 });

  if (event.status === "APPROVED") await confirmPayment(payment.id);
  else if (event.status === "REFUNDED") await refundPayment(payment.id);
  else if (payment.status === "PENDING") await db.payment.update({ where: { id: payment.id }, data: { status: "REJECTED" } });

  return NextResponse.json({ ok: true });
}
