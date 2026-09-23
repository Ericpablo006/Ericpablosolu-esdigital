import { CheckoutForm } from "@/components/shop/checkout-form";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { getPaymentAvailability } from "@/actions/checkout";
import { formatCpfCnpj } from "@/utils/validators";
import { formatPhoneBR } from "@/utils/format";

export const generateMetadata = () => pageMetadata({ title: "Finalizar compra", path: "/checkout", noindex: true });

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [customer, availability] = await Promise.all([db.customer.findUnique({ where: { userId: user.id } }), getPaymentAvailability()]);

  return (
    <div className="pb-8 pt-28 md:pt-32">
      <div className="container-x">
        <h1 className="mb-8 text-3xl font-bold md:text-4xl">Finalizar compra</h1>
        <CheckoutForm
          defaults={{ name: user.name, email: user.email, whatsapp: user.whatsapp ? formatPhoneBR(user.whatsapp) : "", document: customer?.cpfCnpj ? formatCpfCnpj(customer.cpfCnpj) : "" }}
          methods={availability.methods}
          notReady={availability.notReady}
          sandbox={availability.sandbox}
        />
      </div>
    </div>
  );
}
