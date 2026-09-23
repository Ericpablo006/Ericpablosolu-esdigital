const TZ = "America/Sao_Paulo";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const monthFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, month: "short", year: "2-digit" });

export const formatDate = (d: Date | string | null | undefined) => (d ? dateFmt.format(new Date(d)) : "—");
export const formatDateTime = (d: Date | string | null | undefined) => (d ? dateTimeFmt.format(new Date(d)) : "—");
export const formatMonth = (d: Date) => monthFmt.format(d).replace(".", "");

/** yyyy-mm-dd (para <input type="date">) no fuso de São Paulo. */
export function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
  return parts; // en-CA já retorna yyyy-mm-dd
}

/** Interpreta yyyy-mm-dd como meio-dia em São Paulo (evita virar o dia por fuso). */
export const fromInputDate = (s: string) => new Date(`${s}T12:00:00-03:00`);

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Normaliza para o formato internacional do Brasil (55 + DDD + número). */
export function normalizeWhatsapp(input: string): string {
  const d = onlyDigits(input);
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

export function formatPhoneBR(input: string): string {
  let d = onlyDigits(input);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return input;
}

export function whatsappUrl(number: string | null | undefined, text: string): string {
  const n = number ? normalizeWhatsapp(number) : "";
  const q = `text=${encodeURIComponent(text)}`;
  return n ? `https://wa.me/${n}?${q}` : `https://wa.me/?${q}`;
}

export function instagramUrl(handleOrUrl: string | null | undefined): string | null {
  const v = (handleOrUrl || "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function instagramHandle(handleOrUrl: string | null | undefined): string {
  const v = (handleOrUrl || "").trim();
  if (!v) return "";
  const m = v.match(/instagram\.com\/([^/?#]+)/i);
  return `@${(m ? m[1] : v).replace(/^@/, "")}`;
}

export const orderNumber = (n: number) => `EP-${String(n).padStart(6, "0")}`;
export const quoteNumber = (n: number) => `ORC-${String(n).padStart(5, "0")}`;
export const ticketNumber = (n: number) => `#${String(n).padStart(5, "0")}`;
export const receiptNumber = (n: number, d: Date) => `REC-${d.getFullYear()}-${String(n).padStart(5, "0")}`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
