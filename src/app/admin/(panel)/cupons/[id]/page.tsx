import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { CouponForm } from "@/components/admin/catalog-forms";
import { db } from "@/lib/db";
import { toInputDate } from "@/utils/format";
import { centsToInput } from "@/utils/money";

export const metadata = { title: "Cupom" };

export default async function AdminCouponEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = id === "novo" ? null : await db.coupon.findUnique({ where: { id } });
  if (id !== "novo" && !c) notFound();
  return (
    <>
      <PageHeader title={c ? "Editar cupom" : "Novo cupom"} description={c?.code} />
      <CouponForm d={{ id: c?.id, code: c?.code ?? "", type: c?.type ?? "PERCENT", value: c ? (c.type === "PERCENT" ? String(c.value) : centsToInput(c.value)) : "", minOrder: c?.minOrderCents ? centsToInput(c.minOrderCents) : "", maxUses: c?.maxUses?.toString() ?? "", expiresAt: toInputDate(c?.expiresAt), active: c?.active ?? true }} />
    </>
  );
}
