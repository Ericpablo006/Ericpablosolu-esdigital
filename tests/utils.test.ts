import { describe, expect, it } from "vitest";
import { centsToInput, formatBRL, parseMoneyToCents } from "@/utils/money";
import { buildPixPayload, crc16 } from "@/utils/pix";
import { valorPorExtenso } from "@/utils/extenso";
import { isValidCNPJ, isValidCPF, formatCpfCnpj } from "@/utils/validators";
import { effectivePriceCents, isOnPromo } from "@/utils/pricing";
import { normalizeWhatsapp, orderNumber, whatsappUrl } from "@/utils/format";
import { resolveRange, startOfDaySP } from "@/utils/dates";
import { computeDiscount } from "@/services/coupons";
import { slugify } from "@/lib/utils";

describe("dinheiro", () => {
  it("converte texto em centavos", () => {
    expect(parseMoneyToCents("1.500,00")).toBe(150000);
    expect(parseMoneyToCents("R$ 97,5")).toBe(9750);
    expect(parseMoneyToCents("1500")).toBe(150000);
    expect(parseMoneyToCents("1500.50")).toBe(150050);
    expect(parseMoneyToCents("1.500")).toBe(150000);
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("")).toBeNull();
  });
  it("formata", () => {
    expect(formatBRL(150000).replace(/\s/g, " ")).toBe("R$ 1.500,00");
    expect(centsToInput(9750)).toBe("97,50");
  });
});

describe("PIX", () => {
  it("CRC16/CCITT-FALSE confere com o vetor padrão", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
  it("gera payload válido (termina com CRC correto)", () => {
    const p = buildPixPayload({ key: "teste@exemplo.com", receiverName: "Eric Pablo", city: "São Paulo", amountCents: 12345, txid: "EP00000001" });
    expect(p.startsWith("000201")).toBe(true);
    expect(p).toContain("br.gov.bcb.pix");
    expect(p).toContain("5406123.45");
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4));
  });
});

describe("valor por extenso", () => {
  it.each([
    [10000, "cem reais"],
    [150050, "mil e quinhentos reais e cinquenta centavos"],
    [100, "um real"],
    [1, "um centavo"],
    [0, "zero reais"],
    [123456, "mil duzentos e trinta e quatro reais e cinquenta e seis centavos"],
  ])("%i", (cents, expected) => {
    expect(valorPorExtenso(cents)).toBe(expected);
  });
});

describe("CPF/CNPJ", () => {
  it("valida CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("529.982.247-24")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false);
  });
  it("formata", () => {
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
  });
});

describe("preço e promoção", () => {
  const base = { priceCents: 10000, promoPriceCents: 7000, promoEndsAt: null as Date | null };
  it("aplica promoção vigente", () => {
    expect(effectivePriceCents(base)).toBe(7000);
    expect(isOnPromo(base)).toBe(true);
  });
  it("ignora promoção expirada ou maior que o preço", () => {
    expect(effectivePriceCents({ ...base, promoEndsAt: new Date(Date.now() - 1000) })).toBe(10000);
    expect(effectivePriceCents({ ...base, promoPriceCents: 12000 })).toBe(10000);
  });
});

describe("cupons", () => {
  it("calcula desconto percentual e fixo, limitado ao subtotal", () => {
    expect(computeDiscount({ type: "PERCENT", value: 10 }, 20000)).toBe(2000);
    expect(computeDiscount({ type: "FIXED", value: 5000 }, 3000)).toBe(3000);
  });
});

describe("formatação", () => {
  it("whatsapp", () => {
    expect(normalizeWhatsapp("(11) 99999-9999")).toBe("5511999999999");
    expect(whatsappUrl("11999999999", "Olá!")).toBe("https://wa.me/5511999999999?text=Ol%C3%A1!");
  });
  it("número do pedido", () => expect(orderNumber(42)).toBe("EP-000042"));
  it("slug", () => expect(slugify("Template de Site Institucional!")).toBe("template-de-site-institucional"));
});

describe("períodos (São Paulo)", () => {
  it("início do dia em UTC-3", () => {
    expect(startOfDaySP(new Date("2026-09-19T02:00:00Z")).toISOString()).toBe("2026-09-18T03:00:00.000Z");
    expect(startOfDaySP(new Date("2026-09-19T12:00:00Z")).toISOString()).toBe("2026-09-19T03:00:00.000Z");
  });
  it("período personalizado válido/ inválido", () => {
    const ok = resolveRange("custom", "2026-09-01", "2026-09-10");
    expect(ok.key).toBe("custom");
    expect(resolveRange("custom", "2026-09-10", "2026-09-01").key).toBe("month");
  });
});
