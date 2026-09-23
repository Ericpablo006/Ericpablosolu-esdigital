"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button";
import { useFormPending } from "@/components/forms/action-form";

/** Botão de envio com estado de carregamento (usa o estado do <ActionForm> pai). */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  pendingText,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  pendingText?: string;
}) {
  const pending = useFormPending();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, size, className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
