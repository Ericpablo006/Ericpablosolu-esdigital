"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };
type Ctx = { toast: (type: ToastType, message: string) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((cur) => cur.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter;
      setItems((cur) => [...cur.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === "error" ? 7000 : 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {items.map((t) => {
          const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? AlertCircle : Info;
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border p-3.5 text-sm shadow-2xl backdrop-blur-xl",
                t.type === "success" && "border-ok/40 bg-[#062a1f]/90 text-emerald-100",
                t.type === "error" && "border-danger/40 bg-[#2b0d0d]/90 text-red-100",
                t.type === "info" && "border-neon-2/40 bg-navy/90 text-blue-100",
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} aria-label="Fechar aviso" className="opacity-60 transition hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
