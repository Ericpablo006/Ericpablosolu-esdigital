import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/ui";
import { ProjectForm } from "@/components/admin/ops-forms";
import { db } from "@/lib/db";
import { firstParam } from "@/lib/utils";
import { QUOTE_TYPE_LABEL } from "@/types/labels";
import { toInputDate } from "@/utils/format";
import { centsToInput } from "@/utils/money";

export const metadata = { title: "Projeto" };

export default async function AdminProjectEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const project = id === "novo" ? null : await db.project.findUnique({ where: { id } });
  if (id !== "novo" && !project) notFound();

  const [users, services] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, customer: { select: { company: true } } } }),
    db.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, quoteType: true } }),
  ]);

  // Novo projeto a partir de um orçamento: pré-preenche título, cliente, serviço e descrição.
  const quote = id === "novo" && firstParam(sp.quoteId) ? await db.quote.findUnique({ where: { id: firstParam(sp.quoteId) as string } }) : null;
  const guessedService = quote ? services.find((s) => s.quoteType === quote.type)?.id : undefined;
  const prefUser = firstParam(sp.userId) ?? "";

  return (
    <>
      <PageHeader title={project ? "Editar projeto" : "Novo projeto"} description={project?.title ?? (quote ? `A partir do orçamento #${quote.number}` : "Vincule o projeto a um cliente para ele acompanhar.")} />
      <ProjectForm
        customers={users.map((u) => ({ id: u.id, label: `${u.name}${u.customer?.company ? ` — ${u.customer.company}` : ""} (${u.email})` }))}
        services={services.map((s) => ({ id: s.id, label: s.name }))}
        d={{
          id: project?.id,
          title: project?.title ?? (quote ? `${QUOTE_TYPE_LABEL[quote.type]}${quote.company ? ` ${quote.company}` : ` ${quote.name}`}` : ""),
          description: project?.description ?? (quote ? quote.description : ""),
          userId: project?.userId ?? prefUser,
          serviceId: project?.serviceId ?? guessedService ?? "",
          quoteId: project?.quoteId ?? quote?.id ?? "",
          status: project?.status ?? "AWAITING_PAYMENT",
          progress: project?.progress ?? 0,
          deadline: toInputDate(project?.deadline),
          value: centsToInput(project?.valueCents ?? quote?.estimatedCents ?? 0),
        }}
      />
    </>
  );
}
