const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (cents: number) => brl.format(cents / 100);

/** Converte texto digitado ("1.500,00", "1500", "1500.5") em centavos. Retorna null se inválido. */
export function parseMoneyToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  let s = input.trim().replace(/[R$\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{1,2}$/.test(s)) {
    // "1500.5" / "1500.50" → decimal; "1.500" → milhar
    s = s.replace(/\.(?=.*\.)/g, "");
  } else {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

/** Centavos → texto para campos de formulário ("1500,00"). */
export const centsToInput = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");
