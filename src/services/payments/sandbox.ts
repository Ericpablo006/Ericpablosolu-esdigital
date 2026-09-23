import { buildPixPayload } from "@/utils/pix";
import type { PaymentProvider } from "./types";

/**
 * Provedor de TESTES: simula PIX, cartão e boleto e permite "aprovar" o pagamento com um clique.
 * Bloqueado em produção (veja getPaymentProvider) — nunca use para cobrar clientes reais.
 */
export const sandboxProvider: PaymentProvider = {
  id: "sandbox",
  label: "Sandbox (simulação)",
  methods: ["PIX", "CARD", "BOLETO"],
  canSimulate: true,
  readiness: () => null,
  async createCharge({ paymentId, amountCents, method, orderNumber: n, settings }) {
    const providerRef = `sbx_${paymentId}`;
    if (method === "PIX") {
      return {
        providerRef,
        data: {
          pixPayload: buildPixPayload({
            key: settings.pixKey || "sandbox@example.com",
            receiverName: settings.pixReceiverName || "SANDBOX",
            city: settings.companyCity || "SAO PAULO",
            amountCents,
            txid: `SBX${n}`,
          }),
          instructions: "Ambiente de testes: use o botão “Simular pagamento aprovado”.",
        },
      };
    }
    if (method === "BOLETO") {
      return {
        providerRef,
        data: {
          boletoLine: "00190.00009 01234.567890 12345.678901 1 00000000000000",
          instructions: "Boleto simulado (ambiente de testes).",
        },
      };
    }
    return { providerRef, data: { instructions: "Cartão simulado (ambiente de testes)." } };
  },
};
