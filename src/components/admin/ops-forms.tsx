"use client";

import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { ActionButton } from "@/components/forms/action-button";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/forms/fields";
import { ImageUpload } from "@/components/forms/upload-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";
import { createCustomer, createReceipt, deleteProject, deleteQuote, registerPayment, saveCustomerNotes, saveProject, saveSettings, updateQuote } from "@/actions/admin/operations";
import { PAYMENT_METHOD_LABEL, PROJECT_STATUS, QUOTE_STATUS, options } from "@/types/labels";
import type { ReactNode } from "react";

const Section = ({ title, description, children }: { title: string; description?: string; children: ReactNode }) => (
  <fieldset className="panel p-5 md:p-6">
    <legend className="px-2 font-display text-base font-bold text-white">{title}</legend>
    {description && <p className="mt-1 text-xs text-steel">{description}</p>}
    <div className="mt-4 grid gap-5 md:grid-cols-2">{children}</div>
  </fieldset>
);

// ── Cliente ─────────────────────────────────────────────────

export function NewCustomerForm() {
  return (
    <ActionForm action={createCustomer} className="space-y-6" showSuccess resetOnSuccess>
      <Section title="Novo cliente" description="Cria a conta com uma senha temporária, exibida uma única vez após salvar.">
        <TextField name="name" label="Nome" required />
        <TextField name="email" label="E-mail" type="email" required />
        <TextField name="whatsapp" label="WhatsApp" required inputMode="tel" placeholder="(11) 99999-9999" />
        <TextField name="company" label="Empresa" />
        <TextField name="cpfCnpj" label="CPF/CNPJ" inputMode="numeric" />
      </Section>
      <div className="flex gap-3">
        <SubmitButton pendingText="Criando…">Criar cliente</SubmitButton>
        <Link href="/admin/clientes" className={buttonClass("outline")}>Voltar</Link>
      </div>
    </ActionForm>
  );
}

export function CustomerNotesForm({ id, notes }: { id: string; notes: string }) {
  return (
    <ActionForm action={saveCustomerNotes} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <TextArea name="notes" label="Anotações internas (o cliente não vê)" rows={4} defaultValue={notes} maxLength={3000} />
      <SubmitButton size="sm" pendingText="Salvando…">Salvar anotações</SubmitButton>
    </ActionForm>
  );
}

// ── Orçamento ───────────────────────────────────────────────

export function QuoteAdminForm({ id, status, estimated, adminNotes }: { id: string; status: string; estimated: string; adminNotes: string }) {
  return (
    <ActionForm action={updateQuote} className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <SelectField name="status" label="Status" defaultValue={status} options={options(QUOTE_STATUS)} />
      <TextField name="estimated" label="Valor estimado (R$)" defaultValue={estimated} inputMode="decimal" hint="Visível ao cliente em Orçamentos." />
      <TextArea name="adminNotes" label="Notas internas" rows={5} defaultValue={adminNotes} maxLength={3000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
        <ActionButton action={deleteQuote} fields={{ id }} variant="danger" size="md" confirm={{ title: "Excluir orçamento?", message: "Esta ação não pode ser desfeita." }}>Excluir</ActionButton>
      </div>
    </ActionForm>
  );
}

// ── Projeto ─────────────────────────────────────────────────

export type ProjectDefaults = { id?: string; title: string; description: string; userId: string; serviceId: string; quoteId: string; status: string; progress: number; deadline: string; value: string };

export function ProjectForm({ d, customers, services }: { d: ProjectDefaults; customers: { id: string; label: string }[]; services: { id: string; label: string }[] }) {
  return (
    <ActionForm action={saveProject} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <input type="hidden" name="quoteId" value={d.quoteId} />
      <Section title="Projeto">
        <TextField name="title" label="Nome do projeto" required defaultValue={d.title} maxLength={150} placeholder="Site institucional JMLV" wrapperClassName="md:col-span-2" />
        <SelectField name="userId" label="Cliente" required defaultValue={d.userId} placeholder="Selecione o cliente…" options={customers.map((c) => ({ value: c.id, label: c.label }))} hint="O cliente precisa ter conta. Cadastre-o em Clientes se necessário." />
        <SelectField name="serviceId" label="Serviço (opcional)" defaultValue={d.serviceId} placeholder="—" options={services.map((s) => ({ value: s.id, label: s.label }))} />
        <SelectField name="status" label="Status" defaultValue={d.status} options={options(PROJECT_STATUS)} />
        <TextField name="progress" label="Progresso (%)" type="number" min={0} max={100} defaultValue={d.progress} />
        <TextField name="deadline" label="Prazo" type="date" defaultValue={d.deadline} />
        <TextField name="value" label="Valor (R$)" required defaultValue={d.value} inputMode="decimal" placeholder="1.500,00" />
        <TextArea name="description" label="Descrição (visível ao cliente)" rows={4} defaultValue={d.description} wrapperClassName="md:col-span-2" />
      </Section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <SubmitButton pendingText="Salvando…">{d.id ? "Salvar alterações" : "Criar projeto"}</SubmitButton>
          <Link href="/admin/projetos" className={buttonClass("outline")}>Cancelar</Link>
        </div>
        {d.id && <ActionButton action={deleteProject} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir projeto?", message: "O cliente deixará de ver este projeto. Ação irreversível." }}>Excluir projeto</ActionButton>}
      </div>
    </ActionForm>
  );
}

// ── Financeiro ──────────────────────────────────────────────

export function RegisterPaymentForm({ customers, projects }: { customers: { id: string; label: string }[]; projects: { id: string; label: string }[] }) {
  return (
    <ActionForm action={registerPayment} className="grid gap-4 md:grid-cols-2" resetOnSuccess>
      <TextField name="description" label="Descrição" required maxLength={200} wrapperClassName="md:col-span-2" placeholder="Entrada do site institucional" />
      <TextField name="amount" label="Valor (R$)" required inputMode="decimal" placeholder="500,00" />
      <SelectField name="method" label="Forma de pagamento" defaultValue="PIX" options={options(PAYMENT_METHOD_LABEL)} />
      <SelectField name="projectId" label="Projeto (opcional)" placeholder="—" options={projects.map((p) => ({ value: p.id, label: p.label }))} hint="Se o projeto estiver “Aguardando pagamento”, passa para “Em desenvolvimento”." />
      <SelectField name="userId" label="Cliente (opcional)" placeholder="—" options={customers.map((c) => ({ value: c.id, label: c.label }))} />
      <div className="md:col-span-2"><CheckboxField name="approved" label="Pagamento já recebido (aprovar agora)" defaultChecked /></div>
      <div className="md:col-span-2"><SubmitButton pendingText="Registrando…">Registrar pagamento</SubmitButton></div>
    </ActionForm>
  );
}

export function ReceiptForm({ customers, today }: { customers: { id: string; label: string; name: string; document: string }[]; today: string }) {
  return (
    <ActionForm action={createReceipt} className="grid gap-4 md:grid-cols-2" resetOnSuccess>
      <div className="md:col-span-2">
        <label htmlFor="rc-customer" className="label">Cliente cadastrado (opcional — preenche o nome)</label>
        <select id="rc-customer" name="userId" className="input" defaultValue="" onChange={(e) => {
          const c = customers.find((x) => x.id === e.target.value);
          const form = e.target.form;
          if (c && form) {
            (form.elements.namedItem("customerName") as HTMLInputElement).value = c.name;
            (form.elements.namedItem("customerDocument") as HTMLInputElement).value = c.document;
          }
        }}>
          <option value="">Cliente avulso (digitar abaixo)</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <TextField name="customerName" label="Nome do cliente" required maxLength={150} placeholder="JMLV" />
      <TextField name="customerDocument" label="CPF/CNPJ (opcional)" inputMode="numeric" />
      <TextArea name="description" label="Descrição do serviço" required rows={3} maxLength={500} placeholder="Serviço digital" wrapperClassName="md:col-span-2" />
      <TextField name="amount" label="Valor (R$)" required inputMode="decimal" placeholder="100,00" />
      <SelectField name="method" label="Forma de pagamento" defaultValue="PIX" options={options(PAYMENT_METHOD_LABEL)} />
      <TextField name="issuedAt" label="Data" type="date" required defaultValue={today} />
      <div className="flex items-end"><SubmitButton pendingText="Gerando…">Gerar recibo (PDF)</SubmitButton></div>
    </ActionForm>
  );
}

// ── Configurações ───────────────────────────────────────────

export function SettingsForm({ s }: { s: Record<string, string> }) {
  return (
    <ActionForm action={saveSettings} className="space-y-6">
      <Section title="Identidade" description="Aparece no cabeçalho, login, painel, rodapé e recibos.">
        <TextField name="companyName" label="Nome da empresa" required defaultValue={s.companyName} />
        <TextField name="slogan" label="Slogan" defaultValue={s.slogan} />
        <TextField name="tagline" label="Frase institucional" defaultValue={s.tagline} wrapperClassName="md:col-span-2" />
        <div className="md:col-span-2"><ImageUpload name="logoUrl" label="Logo (PNG, JPG ou WEBP — fundo transparente recomendado)" defaultValue={s.logoUrl} hint="Sem logo enviada, o sistema usa o monograma padrão “EP”." /></div>
      </Section>
      <Section title="Contato" description="Usados nos botões de WhatsApp, rodapé, página de contato e recibos.">
        <TextField name="whatsapp" label="WhatsApp (com DDD)" defaultValue={s.whatsapp} inputMode="tel" placeholder="(11) 99999-9999" />
        <TextField name="email" label="E-mail" type="email" defaultValue={s.email} />
        <TextField name="instagram" label="Instagram (@usuario ou link)" defaultValue={s.instagram} />
        <TextField name="companyCity" label="Cidade" defaultValue={s.companyCity} />
        <TextField name="companyDocument" label="CNPJ/CPF da empresa (para recibos)" defaultValue={s.companyDocument} inputMode="numeric" />
      </Section>
      <Section title="Recebimento por PIX" description="Gera o QR Code e o “copia e cola” automaticamente no checkout.">
        <TextField name="pixKey" label="Chave PIX" defaultValue={s.pixKey} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
        <TextField name="pixReceiverName" label="Nome do recebedor (como no banco)" defaultValue={s.pixReceiverName} maxLength={25} hint="Máx. 25 caracteres." />
      </Section>
      <Section title="Textos principais">
        <TextField name="heroTitle" label="Título da Home" required defaultValue={s.heroTitle} wrapperClassName="md:col-span-2" hint="As duas últimas palavras ganham destaque em azul neon." />
        <TextArea name="heroSubtitle" label="Subtítulo da Home" rows={2} defaultValue={s.heroSubtitle} wrapperClassName="md:col-span-2" />
        <TextField name="solutionsTitle" label="Título da seção de soluções" defaultValue={s.solutionsTitle} wrapperClassName="md:col-span-2" />
        <TextField name="aboutTitle" label="Título da página Sobre" defaultValue={s.aboutTitle} wrapperClassName="md:col-span-2" />
        <TextArea name="aboutText" label="Texto Sobre" rows={3} defaultValue={s.aboutText} wrapperClassName="md:col-span-2" />
        <TextArea name="mission" label="Missão" rows={3} defaultValue={s.mission} />
        <TextArea name="vision" label="Visão" rows={3} defaultValue={s.vision} />
        <TextArea name="values" label="Valores (um por linha)" rows={5} defaultValue={s.values} wrapperClassName="md:col-span-2" />
        <TextArea name="seoDescription" label="Descrição para buscadores (SEO)" rows={2} defaultValue={s.seoDescription} maxLength={300} wrapperClassName="md:col-span-2" />
      </Section>
      <div className="sticky bottom-0 -mx-1 border-t border-white/8 bg-ink/90 px-1 py-4 backdrop-blur"><SubmitButton pendingText="Salvando…">Salvar configurações</SubmitButton></div>
    </ActionForm>
  );
}
