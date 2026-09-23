"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { ActionState } from "@/lib/action";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type FormCtx = { errors: Record<string, string>; pending: boolean };
const FormContext = createContext<FormCtx>({ errors: {}, pending: false });

export const useFormErrors = () => useContext(FormContext).errors;
export const useFormPending = () => useContext(FormContext).pending;

/**
 * Formulário ligado a uma Server Action.
 * - Mostra erros por campo (lidos pelos campos em fields.tsx) e toasts de sucesso/erro.
 * - NÃO limpa os campos quando há erro (evita o reset automático do React 19).
 * - Suporta redirecionamento e limpeza após sucesso.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  showFormError = true,
  showSuccess = false,
  onSuccess,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showFormError?: boolean;
  /** Mantém a mensagem de sucesso visível no formulário (útil para dados exibidos uma única vez). */
  showSuccess?: boolean;
  onSuccess?: (state: NonNullable<ActionState>) => void;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const handled = useRef<ActionState>(null);

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      if (state.message) toast("success", state.message);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    } else if (state.message) {
      toast("error", state.message);
    }
  }, [state, toast, router, resetOnSuccess, onSuccess]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  };

  const errors = state && !state.ok ? (state.errors ?? {}) : {};
  const formError = state && !state.ok && showFormError && !Object.keys(errors).length ? state.message : null;

  return (
    <FormContext.Provider value={{ errors, pending }}>
      {/*
        `action={formAction}` garante envio por POST mesmo antes do JavaScript carregar (nunca via GET/URL).
        Depois da hidratação, o onSubmit assume: evita o reset automático do React 19 e mantém os campos em caso de erro.
      */}
      <form ref={ref} action={formAction} onSubmit={onSubmit} className={cn(className)} noValidate>
        {showSuccess && state?.ok && state.message && (
          <div role="status" className="mb-4 rounded-xl border border-ok/40 bg-ok/10 p-3 text-sm text-emerald-100">{state.message}</div>
        )}
        {formError && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {formError}
          </div>
        )}
        {children}
      </form>
    </FormContext.Provider>
  );
}
