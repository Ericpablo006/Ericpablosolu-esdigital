"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "./cart-provider";
import { useToast } from "@/components/ui/toast";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

export function AddToCartButton({ productId, name, variant = "outline", size = "md", className, label = "Adicionar ao carrinho" }: { productId: string; name: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; label?: string }) {
  const { add } = useCart();
  const { toast } = useToast();
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      onClick={() => {
        add(productId);
        toast("success", `“${name}” foi adicionado ao carrinho.`);
      }}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

/** "Comprar agora": coloca no carrinho e vai direto ao checkout. */
export function BuyNowButton({ productId, variant = "primary", size = "md", className, label = "Comprar agora" }: { productId: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; label?: string }) {
  const { add, items } = useCart();
  const router = useRouter();
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      onClick={() => {
        if (!items.some((i) => i.id === productId)) add(productId);
        router.push("/checkout");
      }}
    >
      <Zap className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
