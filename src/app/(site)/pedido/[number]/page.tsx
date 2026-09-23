import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, Clock, Download, ExternalLink, Hourglass, XCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/icons";
import { ActionButton } from "@/components/forms/action-button";
import { ButtonLink } from "@/components/ui/button";
import { AutoRefresh, CopyButton } from "@/components/ui/client-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { cancelMyOrder, simulatePayment } from "@/actions/checkout";
import { getPaymentProvider } from "@/services/payments";
import type { ChargeData } from "@/services/payments/types";
import { formatDateTime, orderNumber, whatsappUrl } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { PAYMENT_METHOD_LABEL } from "@/types/labels";

export const generateMetadata = () => pageMetadata({ title: "Pedido", path: "/pedido", noindex: true });

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const n = parseInt(number, 10);
  if (!Number.isFinite(n)) notFound();
  const user = await requireUser(`/pedido/${n}`);

  const order = await db.order.findUnique({
    where: { number: n },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 }, downloads: { include: { product: { select: { name: true, fileName: true, externalUrl: true, fileKey: true } } } }, coupon: { select: { code: true } } },
  });
  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) notFound();

  const payment = order.payments[0];
  const data = (payment?.providerData ?? {}) as ChargeData;
  const pending = order.status === "PENDING";
  const settings = await getSettings();
  const provider = getPaymentProvider();
  const label = orderNumber(order.number);
  const qr = pending && data.pixPayload ? await QRCode.toDataURL(data.pixPayload, { margin: 1, width: 280, color: { dark: "#05070d", light: "#ffffff" } }) : null;

  return (
    <div className="pb-8 pt-28 md:pt-32">
      <AutoRefresh active={pending} seconds={6} />
      <div className="container-x max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-steel">Pedido</p>
            <h1 className="text-3xl font-bold">{label}</h1>
            <p className="mt-1 text-xs text-steel">Realizado em {formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge kind="order" status={order.status} />
        </div>

        {order.status === "PAID" && (
          <section className="card mb-6 border-ok/40 p-7 text-center md:p-10" aria-live="polite">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok/15 text-ok shadow-[0_0_40px_rgb(52_211_153_/_0.4)]"><CheckCircle2 className="h-9 w-9" aria-hidden /></div>
            <h2 className="text-2xl font-bold">Pagamento realizado com sucesso.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-steel">Obrigado pela compra! Seus produtos digitais já estão liberados abaixo e também na Área do Cliente.</p>
            {order.downloads.length > 0 && (
              <ul className="mx-auto mt-6 max-w-lg space-y-3 text-left">
                {order.downloads.map((d) => {
                  const available = !!(d.product.fileKey || d.product.externalUrl);
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{d.product.name}</p>
                        <p className="text-xs text-steel">{available ? `${d.downloadCount}/${d.maxDownloads} downloads usados` : "Arquivo em preparação — avisaremos assim que estiver disponível."}</p>
                      </div>
                      {available && (
                        <a href={`/api/downloads/${d.id}`} className="btn btn-primary btn-sm shrink-0">
                          {d.product.externalUrl && !d.product.fileKey ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />} Acessar
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {pending && payment && (
          <section className="card mb-6 p-6 md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-warn/15 text-warn"><Hourglass className="h-5 w-5" aria-hidden /></span>
              <div>
                <h2 className="text-xl font-bold">Aguardando pagamento</h2>
                <p className="text-sm text-steel">{PAYMENT_METHOD_LABEL[payment.method]} · {formatBRL(payment.amountCents)}</p>
              </div>
            </div>

            {data.pixPayload && qr && (
              <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
                <div className="mx-auto rounded-2xl bg-white p-3 shadow-[0_0_40px_rgb(29_107_255_/_0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR Code PIX para pagamento" width={220} height={220} className="h-[220px] w-[220px]" />
                </div>
                <div className="min-w-0">
                  <p className="label">PIX copia e cola</p>
                  <p className="break-all rounded-xl border border-white/10 bg-ink/70 p-3 font-mono text-xs leading-relaxed text-silver">{data.pixPayload}</p>
                  <div className="mt-3"><CopyButton text={data.pixPayload} label="Copiar código PIX" /></div>
                  <ol className="mt-5 list-decimal space-y-1 pl-5 text-sm text-steel">
                    <li>Abra o app do seu banco e escolha pagar com PIX.</li>
                    <li>Escaneie o QR Code ou cole o código copiado.</li>
                    <li>Confirme o valor de <strong className="text-white">{formatBRL(payment.amountCents)}</strong>.</li>
                  </ol>
                </div>
              </div>
            )}
            {data.boletoLine && (
              <div>
                <p className="label">Linha digitável</p>
                <p className="break-all rounded-xl border border-white/10 bg-ink/70 p-3 font-mono text-sm text-silver">{data.boletoLine}</p>
                <div className="mt-3"><CopyButton text={data.boletoLine} label="Copiar linha digitável" /></div>
              </div>
            )}
            {data.checkoutUrl && <ButtonLink href={data.checkoutUrl}>Ir para o pagamento</ButtonLink>}
            {data.instructions && <p className="mt-5 flex items-start gap-2 text-sm text-steel"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden /> {data.instructions}</p>}

            <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:flex-wrap">
              <ButtonLink href={whatsappUrl(settings.whatsapp, `Olá! Acabei de pagar o pedido ${label} (${formatBRL(order.totalCents)}). Segue o comprovante.`)} variant="whatsapp" size="sm">
                <WhatsAppIcon className="h-4 w-4" /> Enviar comprovante
              </ButtonLink>
              {provider.canSimulate && payment.provider === "sandbox" && (
                <ActionButton action={simulatePayment} fields={{ paymentId: payment.id }} variant="primary">Simular pagamento aprovado (teste)</ActionButton>
              )}
              {order.userId === user.id && (
                <ActionButton action={cancelMyOrder} fields={{ orderId: order.id }} variant="ghost" confirm={{ title: "Cancelar pedido?", message: "O pedido será cancelado e o pagamento pendente deixará de valer.", confirmLabel: "Cancelar pedido" }}>
                  Cancelar pedido
                </ActionButton>
              )}
            </div>
            <p className="mt-4 text-xs text-steel">Esta página atualiza sozinha quando o pagamento for confirmado.</p>
          </section>
        )}

        {(order.status === "CANCELED" || order.status === "REFUNDED") && (
          <section className="card mb-6 flex items-center gap-4 p-6">
            <XCircle className="h-8 w-8 text-danger" aria-hidden />
            <div>
              <h2 className="text-lg font-bold">{order.status === "CANCELED" ? "Pedido cancelado" : "Pedido estornado"}</h2>
              <p className="text-sm text-steel">Precisa de ajuda? <Link href="/cliente/suporte" className="font-semibold text-sky hover:text-white">Abra um chamado</Link>.</p>
            </div>
          </section>
        )}

        <section className="card p-6 md:p-8">
          <h2 className="mb-4 text-lg font-bold">Itens do pedido</h2>
          <ul className="divide-y divide-white/8">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-silver">{i.name} <span className="text-steel">× {i.quantity}</span></span>
                <span className="font-semibold text-white">{formatBRL(i.unitPriceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-white/8 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-steel">Subtotal</dt><dd className="text-white">{formatBRL(order.subtotalCents)}</dd></div>
            {order.discountCents > 0 && <div className="flex justify-between text-ok"><dt>Desconto{order.coupon ? ` (${order.coupon.code})` : ""}</dt><dd>-{formatBRL(order.discountCents)}</dd></div>}
            <div className="flex justify-between text-base"><dt className="font-semibold text-white">Total</dt><dd className="font-display text-xl font-bold text-white">{formatBRL(order.totalCents)}</dd></div>
          </dl>
        </section>

        <div className="mt-8 text-center">
          <ButtonLink href={user.role === "ADMIN" ? "/admin/pedidos" : "/cliente/pedidos"} variant="outline">Ver todos os pedidos</ButtonLink>
        </div>
      </div>
    </div>
  );
}
