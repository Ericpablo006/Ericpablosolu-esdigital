// Valor por extenso em reais (pt-BR). Ex.: 150050 → "cento e cinquenta reais e cinquenta centavos"

const UNITS = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUNDREDS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function below1000(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(HUNDREDS[h]);
  if (rest) {
    if (rest < 20) parts.push(UNITS[rest]);
    else {
      const t = Math.floor(rest / 10);
      const u = rest % 10;
      parts.push(u ? `${TENS[t]} e ${UNITS[u]}` : TENS[t]);
    }
  }
  return parts.join(" e ");
}

function integerToWords(n: number): string {
  if (n === 0) return "zero";
  const scales: [number, string, string][] = [
    [1_000_000_000, "bilhão", "bilhões"],
    [1_000_000, "milhão", "milhões"],
    [1_000, "mil", "mil"],
  ];
  const chunks: string[] = [];
  let remaining = n;
  for (const [value, singular, plural] of scales) {
    const q = Math.floor(remaining / value);
    if (q > 0) {
      chunks.push(value === 1_000 && q === 1 ? "mil" : `${below1000(q)} ${q === 1 ? singular : plural}`);
      remaining %= value;
    }
  }
  if (remaining > 0) {
    const tail = below1000(remaining);
    // "mil e cem", "mil e duzentos"… conecta com "e" quando o resto é < 100 ou centena exata
    const useE = chunks.length > 0 && (remaining < 100 || remaining % 100 === 0);
    chunks.push(useE ? `e ${tail}` : tail);
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

export function valorPorExtenso(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const parts: string[] = [];
  if (reais > 0 || centavos === 0) {
    const w = integerToWords(reais);
    const de = reais >= 1_000_000 && reais % 1_000_000 === 0 ? " de" : "";
    parts.push(`${w}${de} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) parts.push(`${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return parts.join(" e ");
}
