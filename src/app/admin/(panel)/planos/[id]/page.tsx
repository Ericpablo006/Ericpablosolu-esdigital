import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { PlanForm } from "@/components/admin/catalog-forms";
import { db } from "@/lib/db";
import { centsToInput } from "@/utils/money";

export const metadata = { title: "Plano" };

export default async function AdminPlanEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = id === "novo" ? null : await db.plan.findUnique({ where: { id } });
  if (id !== "novo" && !p) notFound();
  return (
    <>
      <PageHeader title={p ? "Editar plano" : "Novo plano"} description={p?.name} />
      <PlanForm d={{ id: p?.id, name: p?.name ?? "", description: p?.description ?? "", price: centsToInput(p?.priceCents), billing: p?.billing ?? "ONE_TIME", features: p?.features.join("\n") ?? "", sortOrder: p?.sortOrder ?? 0, highlighted: p?.highlighted ?? false, active: p?.active ?? true }} />
    </>
  );
}
