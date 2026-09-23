"use client";

import { useState, useTransition } from "react";
import { Barcode, CreditCard, Lock, QrCode, ShoppingBag, TicketPercent, TriangleAlert } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { useCartLines } from "./cart-view";
import { ActionForm, useFormErrors } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { placeOrder, previewCoupon } from "@/actions/checkout";
import { formatBRL } from "@/utils/money";
import { cn } from "@/lib/utils";

type Props = {
  defaults: { name: string; email: string; whatsapp: string; document: string };
  methods: string[];
  notReady: string | null;
  sandbox: boolean;
};

const METHODS = [
  { value: "PIX", label: "PIX", hint: "Aprovação rápida", icon: QrCode },
  { value: "CARD", label: "Cartão", hint: "Crédito", icon: CreditCard },
  { value: "BOLETO", label: "Boleto", hint: "Vence em 3 dias", icon: Barcode },
];

export function CheckoutForm(props: Props) {
  const { clear } = useCart();
  return (
    <ActionForm action={placeOrder} onSuccess={() => clear()}>
      <Inner {...props} />
    </ActionForm>
  );
}

function Inner({ defaults, methods, notReady, sandbox }: Props) {
  const { rows, subtotalCents, loading } = useCartLines();
  const errors = useFormErrors();
  const [method, setMethod] = useState(methods.includes("PIX") ? "PIX" : methods[0] ?? "");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const applyCoupon = () =>
    start(async () => {
      if (!code.trim()) return;
      const res = await previewCoupon(rows.map((r) => ({ productId: r.productId, quantity: r.quantity })), code);
      setCouponMsg({ ok: res.ok, text: res.message });
      setCoupon(res.ok ? { code: code.trim().toUpperCase(), discountCents: res.discountCents ?? 0 } : null);
    });

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]" aria-busy="true">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (rows.length === 0) {
    return <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Seu carrinho está vazio" description="Adicione produtos para finalizar a compra." action={<ButtonLink href="/produtos">Ver produtos</ButtonLink>} />;
  }

  const discount = coupon?.discountCents ?? 0;
  const total = Math.max(subtotalCents - discount, 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
      <input type="hidden" name="items" value={JSON.stringify(rows.map((r) => ({ productId: r.productId, quantity: r.quantity })))} />
      <input type="hidden" name="coupon" value={coupon?.code ?? ""} />
      <input type="hidden" name="method" value={method} />

      <div className="space-y-6">
        <section className="card p-6 md:p-8" aria-labelledby="dados">
          <h2 id="dados" className="mb-5 text-lg font-bold">Seus dados</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Nome completo" required autoComplete="name" defaultValue={defaults.name} wrapperClassName="sm:col-span-2" />
            <TextField name="document" label="CPF/CNPJ" required inputMode="numeric" autoComplete="off" defaultValue={defaults.document} placeholder="000.000.000-00" />
            <TextField name="whatsapp" label="WhatsApp" required inputMode="tel" autoComplete="tel" defaultValue={defaults.whatsapp} placeholder="(11) 99999-9999" />
            <TextField name="email" label="E-mail" type="email" required autoComplete="email" defaultValue={defaults.email} wrapperClassName="sm:col-span-2" hint="O acesso ao produto será liberado na sua conta após a confirmação do pagamento." />
          </div>
        </section>

        <section className="card p-6 md:p-8" aria-labelledby="pagamento">
          <h2 id="pagamento" className="mb-5 text-lg font-bold">Forma de pagamento</h2>
          {notReady && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {notReady}
            </p>
          )}
          <div role="radiogroup" aria-label="Forma de pagamento" className="grid gap-3 sm:grid-cols-3">
            {METHODS.map(({ value, label, hint, icon: Icon }) => {
              const enabled = methods.includes(value);
              return (
                <button key={value} type="button" role="radio" aria-checked={method === value} disabled={!enabled} onClick={() => setMethod(value)} className={cn("flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition", method === value && enabled ? "border-neon-2 bg-neon/15 shadow-[0_0_24px_-8px_rgb(29_107_255_/_0.9)]" : "border-white/10 bg-white/[0.03]", enabled ? "hover:border-sky/60" : "cursor-not-allowed opacity-45")}>
                  <Icon className={cn("h-6 w-6", method === value && enabled ? "text-sky" : "text-steel")} aria-hidden />
                  <span className="font-semibold text-white">{label}</span>
                  <span className="text-xs text-steel">{enabled ? hint : "Em breve"}</span>
                </button>
              );
            })}
          </div>
          {errors.method && <p className="field-error">{errors.method}</p>}
          {sandbox && <p className="mt-4 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-amber-100">Ambiente de testes: nenhuma cobrança real será feita.</p>}
        </section>
      </div>

      <aside className="card sticky top-24 p-6">
        <h2 className="text-lg font-bold">Resumo da compra</h2>
        <ul className="mt-5 divide-y divide-white/8">
          {rows.map((r) => (
            <li key={r.productId} className="flex items-center gap-3 py-3 first:pt-0">
              <div className="w-14 shrink-0 overflow-hidden rounded-lg"><Cover src={r.image} alt="" category={r.category} seed={r.slug} sizes="56px" className="aspect-square" /></div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-white">{r.name}</p>
                <p className="text-xs text-steel">Qtd. {r.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-white">{formatBRL(r.unitPriceCents * r.quantity)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <label htmlFor="coupon-input" className="label">Cupom de desconto</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <TicketPercent className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" aria-hidden />
              <input id="coupon-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }} placeholder="CÓDIGO" className="input pl-9 uppercase" autoComplete="off" />
            </div>
            <button type="button" onClick={applyCoupon} disabled={pending || !code.trim()} className="btn btn-outline btn-sm h-auto">{pending ? "…" : "Aplicar"}</button>
          </div>
          {couponMsg && <p className={cn("mt-1.5 text-xs", couponMsg.ok ? "text-ok" : "text-danger")} role="status">{couponMsg.text}</p>}
        </div>

        <dl className="mt-5 space-y-2.5 border-t border-white/8 pt-5 text-sm">
          <div className="flex justify-between"><dt className="text-steel">Subtotal</dt><dd className="text-white">{formatBRL(subtotalCents)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-ok"><dt>Desconto ({coupon?.code})</dt><dd>-{formatBRL(discount)}</dd></div>}
          <div className="flex items-baseline justify-between border-t border-white/8 pt-3"><dt className="font-semibold text-white">Total</dt><dd className="font-display text-2xl font-bold text-white">{formatBRL(total)}</dd></div>
        </dl>

        <SubmitButton size="lg" className="mt-6 w-full" pendingText="Processando…">
          <Lock className="h-4 w-4" aria-hidden /> Finalizar compra
        </SubmitButton>
        <p className="mt-3 text-center text-xs text-steel">Pagamento seguro. O acesso ao produto digital é liberado somente após a confirmação do pagamento.</p>
      </aside>
    </div>
  );
}
