import { NextResponse } from "next/server";
import { publicMime, readPublicFile } from "@/lib/storage";

export const runtime = "nodejs";

/** Serve as imagens enviadas pelo painel (armazenadas em UPLOAD_DIR/public). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.length !== 1) return new NextResponse("Não encontrado.", { status: 404 });
  const buf = await readPublicFile(path[0]);
  const mime = publicMime(path[0]);
  if (!buf || !mime) return new NextResponse("Não encontrado.", { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable", // nomes são únicos (UUID)
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
