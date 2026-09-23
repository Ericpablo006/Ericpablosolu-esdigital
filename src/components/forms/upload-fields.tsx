"use client";

import { useRef, useState } from "react";
import { FileArchive, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useFormErrors } from "./action-form";

async function upload(kind: "image" | "private", file: File): Promise<{ url?: string; key?: string; name?: string; error?: string }> {
  const fd = new FormData();
  fd.set("kind", kind);
  fd.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  return res.json().catch(() => ({ error: "Falha no envio." }));
}

/** Upload de imagem(ns). O valor vai em um input oculto (uma URL por linha quando `multiple`). */
export function ImageUpload({
  name,
  label,
  defaultValue = "",
  multiple = false,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  multiple?: boolean;
  hint?: string;
}) {
  const [items, setItems] = useState<string[]>(defaultValue.split("\n").map((s) => s.trim()).filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const error = useFormErrors()[name];

  const add = (u: string) => setItems((cur) => (multiple ? [...cur, u] : [u]));

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files).slice(0, multiple ? 8 : 1)) {
      const res = await upload("image", file);
      if (res.url) add(res.url);
      else toast("error", res.error ?? "Falha no envio da imagem.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={items.join("\n")} />
      <div className="flex flex-wrap gap-3">
        {items.map((src, i) => (
          <div key={src + i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remover imagem"
              onClick={() => setItems((cur) => cur.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-md bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(multiple || items.length === 0) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/25 text-xs text-steel transition hover:border-sky hover:text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Enviando…" : "Enviar"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple={multiple} className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <div className="mt-3 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ou cole uma URL https://…"
          className="input py-2 text-xs"
          aria-label="URL da imagem"
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => {
            if (/^https:\/\/\S+$/.test(url.trim())) {
              add(url.trim());
              setUrl("");
            } else toast("error", "Use uma URL começando com https://");
          }}
        >
          Adicionar
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/** Upload do arquivo privado de um produto digital (só liberado após pagamento aprovado). */
export function PrivateFileUpload({ defaultKey = "", defaultName = "" }: { defaultKey?: string; defaultName?: string }) {
  const [file, setFile] = useState({ key: defaultKey, name: defaultName });
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  async function onPick(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    const res = await upload("private", f);
    setBusy(false);
    if (res.key) setFile({ key: res.key, name: res.name ?? f.name });
    else toast("error", res.error ?? "Falha no envio do arquivo.");
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <span className="label">Arquivo do produto (entregue após pagamento)</span>
      <input type="hidden" name="fileKey" value={file.key} />
      <input type="hidden" name="fileName" value={file.name} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-ink/60 p-3">
        <FileArchive className="h-5 w-5 shrink-0 text-sky" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm">{file.key ? file.name || "Arquivo enviado" : "Nenhum arquivo enviado"}</span>
        {file.key && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFile({ key: "", name: "" })}>
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        )}
        <button type="button" className="btn btn-outline btn-sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {file.key ? "Trocar" : "Enviar arquivo"}
        </button>
      </div>
      <input ref={input} type="file" className="hidden" onChange={(e) => onPick(e.target.files)} />
      <p className="field-hint">ZIP, PDF, PSD, FIG, etc. (até 100 MB). Para arquivos maiores, use o link externo abaixo.</p>
    </div>
  );
}
