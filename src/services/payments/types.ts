import type { PaymentMethod } from "@prisma/client";
import type { Settings } from "@/lib/settings";

export type ChargeInput = {
  paymentId: string;
  orderNumber: number;
  amountCents: number;
  method: PaymentMethod;
  buyer: { name: string; email: string; document: string; whatsapp: string };
  settings: Settings;
};

/** Dados de cobrança guardados em Payment.providerData e exibidos na tela do pedido. */
export type ChargeData = {
  pixPayload?: string; // "copia e cola"
  boletoLine?: string; // linha digitável
  checkoutUrl?: string; // link hospedado pelo gateway (cartão/boleto)
  instructions?: string;
};

export type ChargeResult = {
  providerRef?: string;
  data: ChargeData;
  /** true quando o provedor já confirma na hora (ex.: cartão aprovado). */
  approved?: boolean;
};

/** Evento normalizado vindo de um webhook. */
export type WebhookEvent = { providerRef: string; status: "APPROVED" | "REJECTED" | "REFUNDED" };

/**
 * Contrato que qualquer gateway (Mercado Pago, Asaas, Stripe, Pagar.me…) precisa cumprir.
 * Para integrar um novo gateway: crie um arquivo implementando esta interface e registre-o em `index.ts`.
 * Chaves privadas do gateway ficam SOMENTE em variáveis de ambiente do servidor.
 */
export interface PaymentProvider {
  id: string;
  label: string;
  /** Métodos que este provedor consegue cobrar. */
  methods: PaymentMethod[];
  /** Retorna uma mensagem de erro se o provedor não estiver pronto (ex.: chave PIX não configurada). */
  readiness(settings: Settings): string | null;
  createCharge(input: ChargeInput): Promise<ChargeResult>;
  /** Interpreta e VALIDA a assinatura de um webhook. Retorna null se inválido/ignorável. */
  parseWebhook?(headers: Headers, rawBody: string): Promise<WebhookEvent | null>;
  /** Permite simular aprovação (apenas sandbox). */
  canSimulate?: boolean;
}
