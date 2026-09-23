import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CustomerNotesForm, NewCustomerForm } from "@/components/admin/ops-forms";
import { Field, PageHeader, Panel } from "@/components/dashboard/ui";
import { ActionButton } from "@/components/forms/action-button";
import { Badge } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { setUserRole, toggleUserActive } from "@/actions/admin/operations";
import { formatDate, formatPhoneBR, orderNumber, quoteNumber, ticketNumber } from "@/utils/format";
import { formatBRL } from "@/utils/money";
import { formatCpfCnpj } from "@/utils/validators";
import { QUOTE_TYPE_LABEL } from "@/types/labels";

export const metadata = { title: "Cliente" };

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireAdmin();

  if (id === "novo") {
    return (
      <>
        <PageHeader title="Novo cliente" description="Cadastre um cliente manualmente." />
        <NewCustomerForm />
      </>
    );
  }

  const u = await db.user.findUnique({
    where: { id },
    include: {
      customer: true,
      orders: { orderBy: { createdAt: "desc" }, take: 10 },
      projects: { orderBy: { updatedAt: "desc" }, take: 10 },
      tickets: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
  if (!u) notFound();
  const quotes = await db.quote.findMany({ where: { OR: [{ userId: u.id }, { email: u.email }] }, orderBy: { createdAt: "desc" }, take: 10 });

  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-steel hover:text-white"><ArrowLeft className="h-4 w-4" /> Clientes</Link>
      <PageHeader
        title={u.name}
        description={u.email}
        actions={
          u.id !== me.id ? (
            <>
              <ActionButton action={toggleUserActive} fields={{ id: u.id }} size="md" confirm={u.active ? { title: `Desativar ${u.name}?`, message: "A pessoa será desconectada e não conseguirá entrar.", confirmLabel: "Desativar" } : undefined}>{u.active ? "Desativar conta" : "Reativar conta"}</ActionButton>
              <ActionButton action={setUserRole} fields={{ id: u.id, role: u.role === "ADMIN" ? "CUSTOMER" : "ADMIN" }} size="md" confirm={{ title: u.role === "ADMIN" ? "Remover acesso administrativo?" : "Tornar administrador?", message: u.role === "ADMIN" ? "A pessoa perderá acesso ao painel." : "A pessoa terá acesso TOTAL ao painel administrativo. Faça isso apenas com pessoas de confiança.", confirmLabel: "Confirmar" }}>{u.role === "ADMIN" ? "Remover admin" : "Tornar administrador"}</ActionButton>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Panel title="Dados">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp">{u.whatsapp ? formatPhoneBR(u.whatsapp) : ""}</Field>
              <Field label="Empresa">{u.customer?.company}</Field>
              <Field label="CPF/CNPJ">{u.customer?.cpfCnpj ? formatCpfCnpj(u.customer.cpfCnpj) : ""}</Field>
              <Field label="Cadastro">{formatDate(u.createdAt)}</Field>
              <Field label="Perfil">{u.role === "ADMIN" ? <Badge tone="blue">Administrador</Badge> : <Badge tone="gray">Cliente</Badge>}</Field>
              <Field label="Status">{u.active ? <Badge tone="green">Ativo</Badge> : <Badge tone="red">Desativado</Badge>}</Field>
            </dl>
          </Panel>
          <Panel title="Anotações internas"><CustomerNotesForm id={u.id} notes={u.customer?.notes ?? ""} /></Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pedidos" flush>
            {u.orders.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum pedido.</p> : (
              <ul className="divide-y divide-white/8">{u.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3"><Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-white hover:text-sky">{orderNumber(o.number)} <span className="font-normal text-steel">· {formatBRL(o.totalCents)} · {formatDate(o.createdAt)}</span></Link><StatusBadge kind="order" status={o.status} /></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Projetos" actions={<Link href={`/admin/projetos/novo?userId=${u.id}`} className="text-sm font-semibold text-sky hover:text-white">Novo projeto</Link>} flush>
            {u.projects.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum projeto.</p> : (
              <ul className="divide-y divide-white/8">{u.projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3"><Link href={`/admin/projetos/${p.id}`} className="font-semibold text-white hover:text-sky">{p.title} <span className="font-normal text-steel">· {p.progress}%</span></Link><StatusBadge kind="project" status={p.status} /></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Orçamentos" flush>
            {quotes.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum orçamento.</p> : (
              <ul className="divide-y divide-white/8">{quotes.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3"><Link href={`/admin/orcamentos/${q.id}`} className="font-semibold text-white hover:text-sky">{quoteNumber(q.number)} <span className="font-normal text-steel">· {QUOTE_TYPE_LABEL[q.type]}</span></Link><StatusBadge kind="quote" status={q.status} /></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Chamados" flush>
            {u.tickets.length === 0 ? <p className="p-5 text-sm text-steel">Nenhum chamado.</p> : (
              <ul className="divide-y divide-white/8">{u.tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3"><Link href={`/admin/suporte/${t.id}`} className="font-semibold text-white hover:text-sky">{ticketNumber(t.number)} <span className="font-normal text-steel">· {t.subject}</span></Link><StatusBadge kind="ticket" status={t.status} /></li>
              ))}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
