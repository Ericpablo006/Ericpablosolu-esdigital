import { CartView } from "@/components/shop/cart-view";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({ title: "Carrinho", path: "/carrinho", noindex: true });

export default function CartPage() {
  return (
    <div className="pb-8 pt-28 md:pt-32">
      <div className="container-x">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Seu carrinho</h1>
        <CartView />
      </div>
    </div>
  );
}
