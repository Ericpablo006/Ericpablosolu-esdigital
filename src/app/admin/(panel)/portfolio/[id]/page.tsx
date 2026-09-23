import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { PortfolioForm } from "@/components/admin/catalog-forms";
import { db } from "@/lib/db";

export const metadata = { title: "Projeto do portfólio" };

export default async function AdminPortfolioEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = id === "novo" ? null : await db.portfolioItem.findUnique({ where: { id } });
  if (id !== "novo" && !p) notFound();
  return (
    <>
      <PageHeader title={p ? "Editar projeto" : "Novo projeto"} description={p?.title} />
      <PortfolioForm d={{ id: p?.id, title: p?.title ?? "", client: p?.client ?? "", category: p?.category ?? "", description: p?.description ?? "", technologies: p?.technologies.join(", ") ?? "", image: p?.image ?? "", url: p?.url ?? "", sortOrder: p?.sortOrder ?? 0, active: p?.active ?? true }} />
    </>
  );
}
