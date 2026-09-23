"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { useToast } from "@/components/ui/toast";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

type Confirm = { title: string; message: string; confirmLabel?: string };

/**
 * Botão que executa uma Server Action sem formulário (excluir, ativar/desativar, confirmar pagamento…).
 * Com `confirm`, abre uma janela de confirmação antes de executar.
 */
export function ActionButton({
  action,
  fields = {},
  children,
  variant = "outline",
  size = "sm",
  className,
  confirm,
  title,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields?: Record<string, string>;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  confirm?: Confirm;
  title?: string;
}) {
  const [pending, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const run = () =>
    start(async () => {
      const fd = new FormData();
      for (const [k, v] of Object.entries(fields)) fd.set(k, v);
      const res = await action(null, fd);
      if (res?.message) toast(res.ok ? "success" : "error", res.message);
      if (res?.redirectTo) router.push(res.redirectTo);
      else router.refresh();
    });

  return (
    <>
      <button
        type="button"
        title={title}
        disabled={pending}
        aria-busy={pending}
        className={buttonClass(variant, size, className)}
        onClick={() => (confirm ? dialog.current?.showModal() : run())}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        {children}
      </button>
      {confirm && (
        <dialog
          ref={dialog}
          onClick={(e) => e.target === dialog.current && dialog.current?.close()}
          className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-white/10 bg-panel p-0 text-silver shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        >
          <div className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
              <TriangleAlert className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="text-lg font-bold text-white">{confirm.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel">{confirm.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => dialog.current?.close()}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  dialog.current?.close();
                  run();
                }}
              >
                {confirm.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
