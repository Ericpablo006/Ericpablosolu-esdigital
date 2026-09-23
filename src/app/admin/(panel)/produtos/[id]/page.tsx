import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { ProductForm } from "@/components/admin/catalog-forms";
import { db } from "@/lib/db";
import { centsToInput } from "@/utils/money";
import { toInputDate } from "@/utils/format";

export const metadata = { title: "Produto" };

export default async function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = id === "novo" ? null : await db.product.findUnique({ where: { id } });
  if (id !== "novo" && !p) notFound();

  return (
    <>
      <PageHeader title={p ? "Editar produto" : "Novo produto"} description={p ? p.name : "Cadastre um produto digital para a loja."} />
      <ProductForm
        d={{
          id: p?.id,
          name: p?.name ?? "",
          category: p?.category ?? "",
          shortDescription: p?.shortDescription ?? "",
          description: p?.description ?? "",
          features: p?.features.join("\n") ?? "",
          includes: p?.includes.join("\n") ?? "",
          requirements: p?.requirements.join("\n") ?? "",
          price: centsToInput(p?.priceCents),
          promoPrice: centsToInput(p?.promoPriceCents),
          promoEndsAt: toInputDate(p?.promoEndsAt),
          images: p?.images.join("\n") ?? "",
          fileKey: p?.fileKey ?? "",
          fileName: p?.fileName ?? "",
          externalUrl: p?.externalUrl ?? "",
          active: p?.active ?? true,
          featured: p?.featured ?? false,
        }}
      />
    </>
  );
}
