import { buildPixPayload } from "@/utils/pix";
import { orderNumber } from "@/utils/format";
import type { PaymentProvider } from "./types";

/**
 * PIX manual: gera o QR Code/“copia e cola” com a chave PIX da empresa (Configurações → PIX).
 * O cliente paga e o administrador confirma o recebimento no painel (Pedidos → Confirmar pagamento).
 */
export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "PIX (confirmação manual)",
  methods: ["PIX"],
  readiness: (s) =>
    s.pixKey && s.pixReceiverName
      ? null
      : "Pagamento indisponível no momento: a chave PIX ainda não foi configurada. Fale conosco pelo WhatsApp.",
  async createCharge({ amountCents, orderNumber: n, settings }) {
    const payload = buildPixPayload({
      key: settings.pixKey,
      receiverName: settings.pixReceiverName,
      city: settings.companyCity || "BRASIL",
      amountCents,
      txid: `EP${String(n).padStart(8, "0")}`,
    });
    return {
      data: {
        pixPayload: payload,
        instructions: `Pague o PIX de ${orderNumber(n)} e aguarde a confirmação. Enviar o comprovante pelo WhatsApp agiliza a liberação.`,
      },
    };
  },
};
