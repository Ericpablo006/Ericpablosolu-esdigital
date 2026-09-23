// Armazenamento de arquivos: usa Vercel Blob quando disponível (Vercel, disco sem persistência
// entre execuções) e o disco local nos demais casos (VPS/Docker/dev).
//
// Tudo é guardado com access:"private" na Blob (a loja pode vir configurada como private-only, e
// isso não muda nada pra gente: as imagens "públicas" e os arquivos privados dos produtos já são
// sempre servidos pelas NOSSAS rotas — /uploads/[...] e /api/downloads/[id] — nunca pelo link da
// Blob direto), então o nível de acesso real continua sendo decidido pelo nosso próprio código.
import { randomUUID } from "node:crypto";
import { promises as fs, createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { uploadDir } from "@/lib/env";

const root = () => path.resolve(uploadDir());
const publicDir = () => path.join(root(), "public");
const privateDir = () => path.join(root(), "private");

// BLOB_READ_WRITE_TOKEN (token fixo) ou BLOB_STORE_ID (autenticação por OIDC, forma mais nova da Vercel).
const useBlob = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
// Import tardio: assim o pacote só é necessário em runtime quando a Blob está realmente em uso.
const blob = () => import("@vercel/blob");

const MB = 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * MB;
export const MAX_PRIVATE_BYTES = 100 * MB;

const IMAGE_TYPES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { ext: "gif", mime: "image/gif", test: (b) => ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("ascii")) },
];

// Arquivos privados (produtos digitais): lista de extensões permitidas — nada executável.
const PRIVATE_EXT = new Set(["zip", "rar", "7z", "pdf", "psd", "ai", "eps", "fig", "sketch", "xd", "txt", "md", "json", "csv", "mp4", "mp3", "epub", "xlsx", "docx", "pptx", "png", "jpg", "jpeg", "webp", "svg", "tar", "gz"]);

export class UploadError extends Error {}

export async function saveImage(file: File): Promise<{ url: string }> {
  if (file.size === 0) throw new UploadError("Arquivo vazio.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Imagem muito grande (máximo 5 MB).");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = IMAGE_TYPES.find((t) => t.test(buf));
  if (!type) throw new UploadError("Formato inválido. Envie PNG, JPG, WEBP ou GIF.");
  const name = `${randomUUID()}.${type.ext}`;
  if (useBlob()) {
    const { put } = await blob();
    await put(`public/${name}`, buf, { access: "private", addRandomSuffix: false, contentType: type.mime });
  } else {
    await fs.mkdir(publicDir(), { recursive: true });
    await fs.writeFile(path.join(publicDir(), name), buf);
  }
  // URL própria (não a da Blob): mantém o restante do app (otimizador de imagem, PDF de recibo,
  // validação) igual, não importa onde o arquivo esteja guardado de verdade.
  return { url: `/uploads/${name}` };
}

export async function savePrivateFile(file: File): Promise<{ key: string; name: string }> {
  if (file.size === 0) throw new UploadError("Arquivo vazio.");
  if (file.size > MAX_PRIVATE_BYTES) throw new UploadError("Arquivo muito grande (máximo 100 MB). Use um link externo.");
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!PRIVATE_EXT.has(ext)) throw new UploadError(`Extensão .${ext || "?"} não permitida.`);
  const key = `${randomUUID()}.${ext}`;
  if (useBlob()) {
    const { put } = await blob();
    await put(`private/${key}`, Buffer.from(await file.arrayBuffer()), { access: "private", addRandomSuffix: false, contentType: "application/octet-stream" });
  } else {
    await fs.mkdir(privateDir(), { recursive: true });
    await fs.writeFile(path.join(privateDir(), key), Buffer.from(await file.arrayBuffer()));
  }
  return { key, name: file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120) };
}

const PUBLIC_NAME = /^[a-f0-9-]{36}\.(png|jpg|webp|gif)$/;
const PRIVATE_KEY = /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/;

export function publicMime(name: string): string | null {
  return IMAGE_TYPES.find((t) => name.endsWith("." + t.ext))?.mime ?? null;
}

export async function readPublicFile(name: string): Promise<Buffer | null> {
  if (!PUBLIC_NAME.test(name)) return null; // bloqueia path traversal
  if (useBlob()) {
    const { get } = await blob();
    const res = await get(`public/${name}`, { access: "private" }).catch(() => null);
    if (!res || !res.stream) return null;
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  try {
    return await fs.readFile(path.join(publicDir(), name));
  } catch {
    return null;
  }
}

export async function openPrivateFile(key: string): Promise<{ stream: ReadableStream; size: number } | null> {
  if (!PRIVATE_KEY.test(key)) return null;
  if (useBlob()) {
    const { get } = await blob();
    const res = await get(`private/${key}`, { access: "private" }).catch(() => null);
    if (!res || !res.stream) return null;
    return { stream: res.stream, size: res.blob.size ?? 0 };
  }
  const full = path.join(privateDir(), key);
  try {
    const stat = await fs.stat(full);
    return { stream: Readable.toWeb(createReadStream(full)) as ReadableStream, size: stat.size };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(ref: string | null | undefined) {
  if (!ref) return;
  try {
    if (useBlob()) {
      const { del } = await blob();
      if (ref.startsWith("/uploads/")) {
        const name = ref.slice("/uploads/".length);
        if (PUBLIC_NAME.test(name)) await del(`public/${name}`).catch(() => {});
      } else if (PRIVATE_KEY.test(ref)) {
        await del(`private/${ref}`).catch(() => {});
      }
      return;
    }
    if (ref.startsWith("/uploads/")) {
      const name = ref.slice("/uploads/".length);
      if (PUBLIC_NAME.test(name)) await fs.unlink(path.join(publicDir(), name));
    } else if (PRIVATE_KEY.test(ref)) {
      await fs.unlink(path.join(privateDir(), ref));
    }
  } catch {
    /* arquivo já removido */
  }
}
