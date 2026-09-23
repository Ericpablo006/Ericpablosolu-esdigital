import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Receipt } from "@prisma/client";
import type { Settings } from "@/lib/settings";
import { BRAND } from "@/assets/brand";
import { readPublicFile } from "@/lib/storage";
import { formatBRL } from "@/utils/money";
import { formatDate, formatPhoneBR, instagramHandle, receiptNumber } from "@/utils/format";
import { formatCpfCnpj } from "@/utils/validators";
import { valorPorExtenso } from "@/utils/extenso";

const METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CARD: "Cartão",
  BOLETO: "Boleto",
  CASH: "Dinheiro",
  TRANSFER: "Transferência bancária",
  OTHER: "Outro",
};

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
const C = { ink: hex("#05070d"), navy: hex("#0a1633"), neon: hex("#1d6bff"), sky: hex("#5cb0ff"), silver: hex("#c5cede"), text: hex("#101828"), muted: hex("#5b6577"), line: hex("#dfe5ef"), soft: hex("#f3f6fb") };

// As fontes padrão do PDF usam WinAnsi: troca caracteres fora do alfabeto latino.
const MAP: Record<string, string> = { "–": "-", "—": "-", "‘": "'", "’": "'", "“": '"', "”": '"', "…": "...", "→": "->", "•": "-" };
const safe = (s: string) =>
  Array.from(s)
    .map((ch) => MAP[ch] ?? (ch.charCodeAt(0) > 255 ? "?" : ch))
    .join("");

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of safe(text).split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function drawLogo(pdf: PDFDocument, page: PDFPage, settings: Settings, x: number, yTop: number, size: number) {
  if (settings.logoUrl.startsWith("/uploads/")) {
    try {
      const buf = await readPublicFile(settings.logoUrl.slice("/uploads/".length));
      if (buf) {
        const img = settings.logoUrl.endsWith(".png") ? await pdf.embedPng(buf) : settings.logoUrl.endsWith(".jpg") ? await pdf.embedJpg(buf) : null;
        if (img) {
          const scale = Math.min(size / img.height, 150 / img.width);
          page.drawImage(img, { x, y: yTop - img.height * scale, width: img.width * scale, height: img.height * scale });
          return { width: img.width * scale, custom: true };
        }
      }
    } catch {
      /* usa a marca padrão */
    }
  }
  const scale = size / 48;
  page.drawSvgPath(BRAND.hex, { x, y: yTop, scale, borderColor: C.sky, borderWidth: 1.6, color: C.navy });
  for (const d of [BRAND.e, BRAND.p]) page.drawSvgPath(d, { x, y: yTop, scale, borderColor: rgb(1, 1, 1), borderWidth: 2.4, borderLineCap: 1 });
  return { width: size, custom: false };
}

export async function renderReceiptPdf(receipt: Receipt, settings: Settings): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo ${receiptNumber(receipt.number, receipt.issuedAt)}`);
  pdf.setAuthor(safe(settings.companyName));
  pdf.setProducer(safe(settings.companyName));
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const M = 48;

  // Cabeçalho
  page.drawRectangle({ x: 0, y: height - 130, width, height: 130, color: C.ink });
  page.drawRectangle({ x: 0, y: height - 133, width, height: 3, color: C.neon });
  const logo = await drawLogo(pdf, page, settings, M, height - 34, 62);
  const textX = M + logo.width + 14;
  if (!logo.custom) {
    page.drawText(safe(settings.companyName.toUpperCase()), { x: textX, y: height - 60, size: 13, font: bold, color: rgb(1, 1, 1) });
    page.drawText(safe(settings.slogan), { x: textX, y: height - 78, size: 9.5, font: reg, color: C.silver });
  }
  const num = receiptNumber(receipt.number, receipt.issuedAt);
  page.drawText("RECIBO", { x: width - M - bold.widthOfTextAtSize("RECIBO", 22), y: height - 62, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText(num, { x: width - M - reg.widthOfTextAtSize(num, 11), y: height - 82, size: 11, font: reg, color: C.sky });

  // Título
  let y = height - 175;
  page.drawText("RECIBO DE PRESTAÇÃO DE SERVIÇOS", { x: M, y, size: 15, font: bold, color: C.text });
  y -= 10;
  page.drawRectangle({ x: M, y, width: 52, height: 3, color: C.neon });

  // Valor em destaque
  y -= 62;
  page.drawRectangle({ x: M, y, width: width - 2 * M, height: 52, color: C.soft, borderColor: C.line, borderWidth: 1 });
  page.drawText("VALOR", { x: M + 16, y: y + 33, size: 8.5, font: bold, color: C.muted });
  page.drawText(safe(formatBRL(receipt.amountCents)), { x: M + 16, y: y + 12, size: 20, font: bold, color: C.text });
  const ext = wrap(`(${valorPorExtenso(receipt.amountCents)})`, reg, 9, 250);
  ext.slice(0, 2).forEach((l, i) => page.drawText(l, { x: width - M - 16 - 250, y: y + 32 - i * 12, size: 9, font: reg, color: C.muted }));

  // Campos
  const field = (label: string, value: string, atY: number) => {
    page.drawText(label.toUpperCase(), { x: M, y: atY, size: 8.5, font: bold, color: C.muted });
    const lines = wrap(value, reg, 11.5, width - 2 * M);
    lines.forEach((l, i) => page.drawText(l, { x: M, y: atY - 16 - i * 15, size: 11.5, font: reg, color: C.text }));
    const used = 16 + lines.length * 15;
    page.drawLine({ start: { x: M, y: atY - used - 6 }, end: { x: width - M, y: atY - used - 6 }, thickness: 0.6, color: C.line });
    return atY - used - 28;
  };
  y -= 40;
  const who = receipt.customerDocument ? `${receipt.customerName} — ${formatCpfCnpj(receipt.customerDocument)}` : receipt.customerName;
  y = field("Recebemos de", who, y);
  y = field("Referente a", receipt.description, y);
  y = field("Forma de pagamento", METHOD_LABEL[receipt.method] ?? receipt.method, y);
  y = field("Data", formatDate(receipt.issuedAt), y);

  // Assinatura
  y -= 30;
  page.drawLine({ start: { x: width - M - 220, y }, end: { x: width - M, y }, thickness: 0.8, color: C.text });
  const signer = safe(settings.companyName);
  page.drawText(signer, { x: width - M - 220 + (220 - bold.widthOfTextAtSize(signer, 10)) / 2, y: y - 14, size: 10, font: bold, color: C.text });
  if (settings.companyDocument) {
    const doc = safe(`CNPJ/CPF: ${formatCpfCnpj(settings.companyDocument)}`);
    page.drawText(doc, { x: width - M - 220 + (220 - reg.widthOfTextAtSize(doc, 9)) / 2, y: y - 27, size: 9, font: reg, color: C.muted });
  }

  // Aviso legal
  const notice =
    "Este documento é um recibo/comprovante comercial de prestação de serviço e NÃO substitui a Nota Fiscal eletrônica oficial.";
  const nLines = wrap(notice, reg, 8.5, width - 2 * M);
  nLines.forEach((l, i) => page.drawText(l, { x: M, y: 120 - i * 11, size: 8.5, font: reg, color: C.muted }));

  // Rodapé
  page.drawRectangle({ x: 0, y: 0, width, height: 62, color: C.ink });
  page.drawRectangle({ x: 0, y: 62, width, height: 2, color: C.neon });
  const contacts = [settings.email, settings.whatsapp ? formatPhoneBR(settings.whatsapp) : "", settings.instagram ? instagramHandle(settings.instagram) : ""].filter(Boolean).join("   •   ");
  const tag = safe(settings.tagline);
  page.drawText(tag, { x: M, y: 36, size: 10, font: bold, color: rgb(1, 1, 1) });
  if (contacts) page.drawText(safe(contacts), { x: M, y: 20, size: 8.5, font: reg, color: C.silver });

  return pdf.save();
}
