import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { ServiceForm } from "@/components/admin/catalog-forms";
import { db } from "@/lib/db";
import { centsToInput } from "@/utils/money";

export const metadata = { title: "Serviço" };

export default async function AdminServiceEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = id === "novo" ? null : await db.service.findUnique({ where: { id } });
  if (id !== "novo" && !s) notFound();
  return (
    <>
      <PageHeader title={s ? "Editar serviço" : "Novo serviço"} description={s?.name} />
      <ServiceForm
        d={{
          id: s?.id, name: s?.name ?? "", homeLabel: s?.homeLabel ?? "", shortDescription: s?.shortDescription ?? "", description: s?.description ?? "",
          benefits: s?.benefits.join("\n") ?? "", deliveryTime: s?.deliveryTime ?? "", startingPrice: centsToInput(s?.startingPriceCents), icon: s?.icon ?? "Globe",
          image: s?.image ?? "", quoteType: s?.quoteType ?? "OTHER", sortOrder: s?.sortOrder ?? 0, featured: s?.featured ?? false, active: s?.active ?? true,
        }}
      />
    </>
  );
}
