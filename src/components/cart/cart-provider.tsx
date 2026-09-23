"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartEntry = { id: string; qty: number };
type CartCtx = {
  items: CartEntry[];
  ready: boolean;
  count: number;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const KEY = "ep_cart_v1";
const Ctx = createContext<CartCtx | null>(null);

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
};

/** Carrinho no navegador (guarda apenas id + quantidade). Preços SEMPRE são recalculados no servidor. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(raw)) {
        setItems(raw.filter((e) => typeof e?.id === "string" && Number.isInteger(e?.qty) && e.qty > 0).map((e) => ({ id: e.id, qty: Math.min(e.qty, 10) })));
      }
    } catch {
      /* armazenamento indisponível */
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(JSON.parse(e.newValue || "[]"));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartEntry[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.qty, 0),
      add: (id, qty = 1) => {
        const found = items.find((i) => i.id === id);
        persist(found ? items.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + qty, 10) } : i)) : [...items, { id, qty: Math.min(qty, 10) }]);
      },
      setQty: (id, qty) => persist(qty <= 0 ? items.filter((i) => i.id !== id) : items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, 10) } : i))),
      remove: (id) => persist(items.filter((i) => i.id !== id)),
      clear: () => persist([]),
    }),
    [items, ready, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
