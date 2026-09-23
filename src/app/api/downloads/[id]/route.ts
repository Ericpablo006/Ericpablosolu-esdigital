import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { openPrivateFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Entrega o produto digital SOMENTE se:
 *  - o usuário está logado e é o dono da compra (ou administrador),
 *  - o pedido está PAGO (pagamento confirmado),
 *  - o limite de downloads não foi excedido.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/entrar?next=${encodeURIComponent("/cliente/downloads")}`, req.url));

  const dl = await db.download.findUnique({ where: { id }, include: { order: true, product: true } });
  if (!dl || (dl.userId !== user.id && user.role !== "ADMIN")) return new NextResponse("Não encontrado.", { status: 404 });
  if (dl.order.status !== "PAID") return new NextResponse("Pagamento ainda não confirmado.", { status: 403 });
  if (dl.downloadCount >= dl.maxDownloads && user.role !== "ADMIN") {
    return new NextResponse("Limite de downloads atingido. Fale com o suporte.", { status: 429 });
  }

  const { product } = dl;
  if (product.fileKey) {
    const file = await openPrivateFile(product.fileKey);
    if (!file) return new NextResponse("Arquivo indisponível. Fale com o suporte.", { status: 404 });
    await db.download.update({ where: { id }, data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() } });
    const ext = product.fileKey.split(".").pop();
    const filename = (product.fileName || `${product.slug}.${ext}`).replace(/[^\w.\- ()]/g, "_");
    return new NextResponse(file.stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(file.size),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (product.externalUrl && /^https:\/\//.test(product.externalUrl)) {
    await db.download.update({ where: { id }, data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() } });
    return NextResponse.redirect(product.externalUrl, { headers: { "Cache-Control": "private, no-store" } });
  }
  return new NextResponse("Arquivo ainda não disponível.", { status: 404 });
}
