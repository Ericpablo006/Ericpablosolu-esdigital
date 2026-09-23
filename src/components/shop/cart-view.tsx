"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Cover } from "@/components/ui/cover";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { getCartLines, type CartLineView } from "@/actions/checkout";
import { formatBRL } from "@/utils/money";

/** Carrega os dados atuais dos produtos do carrinho (nome, imagem, preço) a partir do servidor. */
export function useCartLines() {
  const { items, ready, remove } = useCart();
  const [lines, setLines] = useState<CartLineView[] | null>(null);
  const key = items.map((i) => i.id).sort().join(",");

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    if (!key) {
      setLines([]);
      return;
    }
    getCartLines(key.split(",")).then(({ lines, missing }) => {
      if (cancelled) return;
      setLines(lines);
      missing.forEach(remove); // produtos removidos/desativados saem do carrinho
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  const rows = useMemo(
    () => (lines ?? []).map((l) => ({ ...l, quantity: items.find((i) => i.id === l.productId)?.qty ?? 1 })).filter((l) => items.some((i) => i.id === l.productId)),
    [lines, items],
  );
  const subtotalCents = rows.reduce((s, r) => s + r.unitPriceCents * r.quantity, 0);
  return { rows, subtotalCents, loading: !ready || lines === null };
}

export function CartView() {
  const { setQty, remove } = useCart();
  const { rows, subtotalCents, loading } = useCartLines();

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]" aria-busy="true" aria-label="Carregando carrinho">
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Seu carrinho está vazio" description="Explore nossos produtos digitais e adicione o que você precisa." action={<ButtonLink href="/produtos">Ver produtos</ButtonLink>} />;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.productId} className="card flex gap-4 p-4 sm:p-5">
            <Link href={`/produtos/${r.slug}`} className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-32" aria-hidden tabIndex={-1}>
              <Cover src={r.image} alt="" category={r.category} seed={r.slug} sizes="128px" className="aspect-[4/3]" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/produtos/${r.slug}`} className="line-clamp-2 font-bold text-white transition hover:text-sky">{r.name}</Link>
                  <p className="mt-0.5 text-xs text-steel">{r.category}</p>
                </div>
                <button type="button" onClick={() => remove(r.productId)} aria-label={`Remover ${r.name}`} className="rounded-lg p-2 text-steel transition hover:bg-danger/10 hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                <div className="inline-flex items-center rounded-xl border border-white/12" role="group" aria-label={`Quantidade de ${r.name}`}>
                  <button type="button" onClick={() => setQty(r.productId, r.quantity - 1)} aria-label="Diminuir quantidade" className="flex h-9 w-9 items-center justify-center text-silver transition hover:text-white"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center text-sm font-semibold text-white" aria-live="polite">{r.quantity}</span>
                  <button type="button" onClick={() => setQty(r.productId, r.quantity + 1)} disabled={r.quantity >= 10} aria-label="Aumentar quantidade" className="flex h-9 w-9 items-center justify-center text-silver transition hover:text-white disabled:opacity-40"><Plus className="h-4 w-4" /></button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-steel">{formatBRL(r.unitPriceCents)} cada</p>
                  <p className="font-display text-lg font-bold text-white">{formatBRL(r.unitPriceCents * r.quantity)}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card sticky top-24 p-6">
        <h2 className="text-lg font-bold">Resumo</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-steel">Subtotal</dt><dd className="text-white">{formatBRL(subtotalCents)}</dd></div>
          <div className="flex justify-between border-t border-white/8 pt-3 text-base"><dt className="font-semibold text-white">Total</dt><dd className="font-display text-2xl font-bold text-white">{formatBRL(subtotalCents)}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-steel">Cupons de desconto podem ser aplicados no checkout.</p>
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">Finalizar compra</ButtonLink>
        <ButtonLink href="/produtos" variant="ghost" size="sm" className="mt-2 w-full">Continuar comprando</ButtonLink>
      </aside>
    </div>
  );
}
