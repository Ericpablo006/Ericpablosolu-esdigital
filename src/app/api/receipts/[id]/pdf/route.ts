import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { renderReceiptPdf } from "@/services/receipt-pdf";
import { receiptNumber } from "@/utils/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF do recibo: administrador ou o próprio cliente vinculado ao recibo. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Não autorizado.", { status: 401 });

  const receipt = await db.receipt.findUnique({ where: { id } });
  if (!receipt || (user.role !== "ADMIN" && receipt.userId !== user.id)) return new NextResponse("Não encontrado.", { status: 404 });

  const pdf = await renderReceiptPdf(receipt, await getSettings());
  const name = `${receiptNumber(receipt.number, receipt.issuedAt)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
