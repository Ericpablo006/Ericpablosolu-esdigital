import { createHmac } from "node:crypto";
import { isProd, paymentProviderId } from "@/lib/env";
import { safeEqual } from "@/lib/security";
import { manualProvider } from "./manual";
import { sandboxProvider } from "./sandbox";
import type { PaymentProvider, WebhookEvent } from "./types";

/**
 * Provedor "webhook": aceita eventos assinados (HMAC-SHA256 no header `x-signature`)
 * de qualquer sistema — útil para ligar um gateway/automação (n8n, Make, seu backend) sem alterar o código.
 * Corpo esperado: {"providerRef":"...","status":"APPROVED"|"REJECTED"|"REFUNDED"}.
 */
export const webhookProvider: PaymentProvider = {
  ...manualProvider,
  id: "webhook",
  label: "PIX manual + webhook assinado",
  async createCharge(input) {
    const charge = await manualProvider.createCharge(input);
    // providerRef = mesmo txid do PIX (EP + nº do pedido com 8 dígitos): é o que o sistema externo envia no webhook.
    return { ...charge, providerRef: `EP${String(input.orderNumber).padStart(8, "0")}` };
  },
  async parseWebhook(headers, rawBody): Promise<WebhookEvent | null> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const signature = headers.get("x-signature");
    if (!secret || !signature) return null;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!safeEqual(expected, signature.replace(/^sha256=/, ""))) return null;
    try {
      const body = JSON.parse(rawBody) as { providerRef?: string; status?: string };
      if (!body.providerRef || !["APPROVED", "REJECTED", "REFUNDED"].includes(body.status ?? "")) return null;
      return { providerRef: body.providerRef, status: body.status as WebhookEvent["status"] };
    } catch {
      return null;
    }
  },
};

const registry: Record<string, PaymentProvider> = {
  manual: manualProvider,
  sandbox: sandboxProvider,
  webhook: webhookProvider,
};

/** Provedor ativo (variável PAYMENT_PROVIDER). O sandbox é bloqueado em produção. */
export function getPaymentProvider(): PaymentProvider {
  const id = paymentProviderId();
  if (id === "sandbox" && isProd() && process.env.ALLOW_SANDBOX_IN_PRODUCTION !== "true") return manualProvider;
  return registry[id] ?? manualProvider;
}

export const getProviderById = (id: string): PaymentProvider | undefined => registry[id];
export type { PaymentProvider } from "./types";
