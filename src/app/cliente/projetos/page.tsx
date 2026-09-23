import { CalendarClock, FolderKanban, Wallet } from "lucide-react";
import { PageHeader, ProgressBar } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const metadata = { title: "Meus projetos" };

export default async function ClientProjects() {
  const user = await requireUser("/cliente/projetos");
  const projects = await db.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, include: { service: { select: { name: true } } } });

  return (
    <>
      <PageHeader title="Meus projetos" description="Status, prazo, valor e progresso de cada projeto." actions={<ButtonLink href="/orcamento" variant="outline">Novo orçamento</ButtonLink>} />
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-6 w-6" />} title="Nenhum projeto por enquanto" description="Depois de aprovar um orçamento, seu projeto aparece aqui com o andamento em tempo real." action={<ButtonLink href="/orcamento">Solicitar orçamento</ButtonLink>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((p) => (
            <article key={p.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">{p.title}</h2>
                  {p.service && <p className="text-xs text-steel">{p.service.name}</p>}
                </div>
                <StatusBadge kind="project" status={p.status} />
              </div>
              {p.description && <p className="mt-3 text-sm leading-relaxed text-steel">{p.description}</p>}
              <ProgressBar value={p.progress} className="mt-5" />
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/8 pt-4 text-xs">
                <div><dt className="flex items-center gap-1 text-steel"><CalendarClock className="h-3.5 w-3.5" aria-hidden /> Início</dt><dd className="mt-1 font-semibold text-white">{formatDate(p.createdAt)}</dd></div>
                <div><dt className="flex items-center gap-1 text-steel"><CalendarClock className="h-3.5 w-3.5" aria-hidden /> Prazo</dt><dd className="mt-1 font-semibold text-white">{formatDate(p.deadline)}</dd></div>
                <div><dt className="flex items-center gap-1 text-steel"><Wallet className="h-3.5 w-3.5" aria-hidden /> Valor</dt><dd className="mt-1 font-semibold text-white">{formatBRL(p.valueCents)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
