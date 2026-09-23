import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";
import { saveImage, savePrivateFile, UploadError } from "@/lib/storage";

export const runtime = "nodejs";

/** Upload de imagens públicas e de arquivos privados de produtos — somente administradores. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const limit = await rateLimit(`upload:${user.id}`, 60, 600);
  if (!limit.ok) return NextResponse.json({ error: "Muitos envios. Aguarde um instante." }, { status: 429 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    if (!(file instanceof File)) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

    if (kind === "private") return NextResponse.json(await savePrivateFile(file));
    return NextResponse.json(await saveImage(file));
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "Falha ao salvar o arquivo." }, { status: 500 });
  }
}
