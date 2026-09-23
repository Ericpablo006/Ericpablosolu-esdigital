// Rótulos e cores dos enums (mantido sem importar @prisma/client para poder ser usado em componentes de cliente).
export type Tone = "blue" | "green" | "yellow" | "red" | "gray" | "cyan";
type Entry = { label: string; tone: Tone };

export const QUOTE_TYPE_LABEL: Record<string, string> = {
  SITE: "Site",
  ECOMMERCE: "Loja virtual",
  LANDING: "Landing page",
  SYSTEM: "Sistema",
  APP: "Aplicativo",
  DESIGN: "Design",
  MARKETING: "Marketing",
  OTHER: "Outro",
};

export const QUOTE_STATUS: Record<string, Entry> = {
  NEW: { label: "Novo", tone: "blue" },
  ANALYZING: { label: "Em análise", tone: "yellow" },
  SENT: { label: "Proposta enviada", tone: "cyan" },
  APPROVED: { label: "Aprovado", tone: "green" },
  REJECTED: { label: "Recusado", tone: "red" },
};

export const PROJECT_STATUS: Record<string, Entry> = {
  QUOTE: { label: "Orçamento", tone: "gray" },
  AWAITING_PAYMENT: { label: "Aguardando pagamento", tone: "yellow" },
  IN_DEVELOPMENT: { label: "Em desenvolvimento", tone: "blue" },
  IN_REVIEW: { label: "Em revisão", tone: "cyan" },
  DONE: { label: "Finalizado", tone: "green" },
};

export const ORDER_STATUS: Record<string, Entry> = {
  PENDING: { label: "Aguardando pagamento", tone: "yellow" },
  PAID: { label: "Pago", tone: "green" },
  CANCELED: { label: "Cancelado", tone: "red" },
  REFUNDED: { label: "Estornado", tone: "gray" },
};

export const PAYMENT_STATUS: Record<string, Entry> = {
  PENDING: { label: "Pendente", tone: "yellow" },
  APPROVED: { label: "Aprovado", tone: "green" },
  REJECTED: { label: "Recusado", tone: "red" },
  REFUNDED: { label: "Estornado", tone: "gray" },
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CARD: "Cartão",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export const TICKET_STATUS: Record<string, Entry> = {
  OPEN: { label: "Aberto", tone: "blue" },
  IN_PROGRESS: { label: "Em atendimento", tone: "yellow" },
  RESOLVED: { label: "Resolvido", tone: "green" },
};

export const BILLING_LABEL: Record<string, string> = { ONE_TIME: "Pagamento único", MONTHLY: "Mensalidade" };

export const options = (map: Record<string, string | Entry>) =>
  Object.entries(map).map(([value, v]) => ({ value, label: typeof v === "string" ? v : v.label }));
