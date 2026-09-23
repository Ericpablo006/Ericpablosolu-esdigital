import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { QuoteAdminForm } from "@/components/admin/ops-forms";
import { WhatsAppIcon } from "@/components/brand/icons";
import { Field, PageHeader, Panel } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { QUOTE_TYPE_LABEL } from "@/types/labels";
import { formatDateTime, formatPhoneBR, quoteNumber, whatsappUrl } from "@/utils/format";
import { centsToInput } from "@/utils/money";

export const metadata = { title: "Orçamento" };

const Yes = ({ v }: { v: boolean }) => (v ? <span className="inline-flex items-center gap-1 text-ok"><Check className="h-4 w-4" /> Sim</span> : <span className="inline-flex items-center gap-1 text-steel"><X className="h-4 w-4" /> Não</span>);

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await db.quote.findUnique({ where: { id }, include: { projects: { select: { id: true, title: true } } } });
  if (!q) notFound();
  const account = await db.user.findFirst({ where: { OR: [...(q.userId ? [{ id: q.userId }] : []), { email: q.email }] }, select: { id: true } });
  const createProject = `/admin/projetos/novo?quoteId=${q.id}${account ? `&userId=${account.id}` : ""}`;

  return (
    <>
      <Link href="/admin/orcamentos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Orçamentos</Link>
      <PageHeader
        title={`Orçamento ${quoteNumber(q.number)}`}
        description={`${QUOTE_TYPE_LABEL[q.type]} · recebido em ${formatDateTime(q.createdAt)}`}
        actions={
          <>
            <StatusBadge kind="quote" status={q.status} />
            <ButtonLink href={whatsappUrl(q.whatsapp, `Olá, ${q.name.split(" ")[0]}! Recebemos seu orçamento ${quoteNumber(q.number)} (${QUOTE_TYPE_LABEL[q.type]}) na Eric Pablo Soluções Digitais.`)} variant="whatsapp" size="md"><WhatsAppIcon className="h-4 w-4" /> Responder no WhatsApp</ButtonLink>
            <ButtonLink href={createProject} size="md">Criar projeto</ButtonLink>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="Cliente">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome">{q.name}</Field>
              <Field label="Empresa">{q.company}</Field>
              <Field label="WhatsApp">{formatPhoneBR(q.whatsapp)}</Field>
              <Field label="E-mail">{q.email}</Field>
              <Field label="Conta no site">{account ? <Link href={`/admin/clientes/${account.id}`} className="text-sky hover:text-white">Ver cadastro</Link> : "Sem conta (cadastre em Clientes para criar o projeto)"}</Field>
            </dl>
          </Panel>
          <Panel title="Detalhes do projeto">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Objetivo">{q.objective}</Field>
              <Field label="Prazo desejado">{q.deadline}</Field>
              <Field label="Possui domínio"><Yes v={q.hasDomain} /></Field>
              <Field label="Possui hospedagem"><Yes v={q.hasHosting} /></Field>
              <Field label="Possui identidade visual"><Yes v={q.hasBrand} /></Field>
              <Field label="Manutenção mensal"><Yes v={q.wantsMaintenance} /></Field>
              <Field label="Integração WhatsApp"><Yes v={q.wantsWhatsapp} /></Field>
              <Field label="Sistema de pagamentos"><Yes v={q.wantsPayments} /></Field>
              <Field label="Área administrativa"><Yes v={q.wantsAdminArea} /></Field>
            </dl>
            <div className="mt-5 border-t border-white/8 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-steel">Sobre o projeto</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-silver">{q.description}</p>
            </div>
          </Panel>
          {q.projects.length > 0 && (
            <Panel title="Projetos gerados">
              <ul className="space-y-2">{q.projects.map((p) => (<li key={p.id}><Link href={`/admin/projetos/${p.id}`} className="text-sky hover:text-white">{p.title}</Link></li>))}</ul>
            </Panel>
          )}
        </div>
        <Panel title="Gerenciar">
          <QuoteAdminForm id={q.id} status={q.status} estimated={centsToInput(q.estimatedCents)} adminNotes={q.adminNotes ?? ""} />
        </Panel>
      </div>
    </>
  );
}
