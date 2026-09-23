"use client";

import Link from "next/link";
import { ActionForm } from "@/components/forms/action-form";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/forms/fields";
import { ImageUpload, PrivateFileUpload } from "@/components/forms/upload-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";
import { SERVICE_ICON_OPTIONS } from "@/components/brand/icons";
import { deleteCoupon, deletePlan, deletePortfolio, deleteProduct, deleteService, saveCoupon, savePlan, savePortfolio, saveProduct, saveService } from "@/actions/admin/catalog";
import { PORTFOLIO_CATEGORIES, PRODUCT_CATEGORY_SUGGESTIONS } from "@/types/constants";
import { BILLING_LABEL, QUOTE_TYPE_LABEL, options } from "@/types/labels";
import { ActionButton } from "@/components/forms/action-button";
import type { ReactNode } from "react";

function FormActions({ backHref, children, id, onDelete }: { backHref: string; children?: ReactNode; id?: string; onDelete?: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 bg-ink/90 px-1 py-4 backdrop-blur">
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="Salvando…">{id ? "Salvar alterações" : "Criar"}</SubmitButton>
        <Link href={backHref} className={buttonClass("outline")}>Cancelar</Link>
        {children}
      </div>
      {onDelete}
    </div>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="panel p-5 md:p-6">
    <legend className="mb-1 px-2 font-display text-base font-bold text-white">{title}</legend>
    <div className="mt-3 grid gap-5 md:grid-cols-2">{children}</div>
  </fieldset>
);

// ── Produto ─────────────────────────────────────────────────

export type ProductDefaults = {
  id?: string; name: string; category: string; shortDescription: string; description: string; features: string; includes: string; requirements: string;
  price: string; promoPrice: string; promoEndsAt: string; images: string; fileKey: string; fileName: string; externalUrl: string; active: boolean; featured: boolean;
};

export function ProductForm({ d }: { d: ProductDefaults }) {
  return (
    <ActionForm action={saveProduct} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Section title="Informações">
        <TextField name="name" label="Nome do produto" required defaultValue={d.name} maxLength={150} wrapperClassName="md:col-span-2" />
        <div>
          <TextField name="category" label="Categoria" required defaultValue={d.category} list="cats" maxLength={60} />
          <datalist id="cats">{PRODUCT_CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <TextField name="shortDescription" label="Resumo (aparece nos cards)" defaultValue={d.shortDescription} maxLength={200} />
        <TextArea name="description" label="Descrição completa" required rows={6} defaultValue={d.description} wrapperClassName="md:col-span-2" />
        <TextArea name="features" label="Funcionalidades (uma por linha)" rows={5} defaultValue={d.features} />
        <TextArea name="includes" label="Conteúdo incluso (um por linha)" rows={5} defaultValue={d.includes} />
        <TextArea name="requirements" label="Requisitos (um por linha)" rows={4} defaultValue={d.requirements} wrapperClassName="md:col-span-2" />
      </Section>
      <Section title="Preço e promoção">
        <TextField name="price" label="Preço (R$)" required defaultValue={d.price} inputMode="decimal" placeholder="97,00" />
        <TextField name="promoPrice" label="Preço promocional (R$)" defaultValue={d.promoPrice} inputMode="decimal" hint="Deixe vazio para não ter promoção." />
        <TextField name="promoEndsAt" label="Promoção válida até" type="date" defaultValue={d.promoEndsAt} hint="Opcional. Sem data, a promoção fica ativa até você removê-la." />
      </Section>
      <Section title="Imagens e entrega">
        <div className="md:col-span-2"><ImageUpload name="images" label="Imagens do produto (a primeira é a capa)" multiple defaultValue={d.images} /></div>
        <div className="md:col-span-2"><PrivateFileUpload defaultKey={d.fileKey} defaultName={d.fileName} /></div>
        <TextField name="externalUrl" label="ou link externo de entrega (https://…)" defaultValue={d.externalUrl} wrapperClassName="md:col-span-2" hint="Use para arquivos grandes (Drive, Dropbox…). Só é revelado ao cliente após o pagamento aprovado." />
      </Section>
      <Section title="Publicação">
        <CheckboxField name="active" label="Produto ativo (visível na loja)" defaultChecked={d.id ? d.active : true} />
        <CheckboxField name="featured" label="Produto em destaque" defaultChecked={d.featured} />
      </Section>
      <FormActions backHref="/admin/produtos" id={d.id} onDelete={d.id ? <ActionButton action={deleteProduct} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir produto?", message: "Esta ação não pode ser desfeita. Produtos já vendidos não podem ser excluídos (desative-os).", confirmLabel: "Excluir" }}>Excluir produto</ActionButton> : undefined} />
    </ActionForm>
  );
}

// ── Serviço ─────────────────────────────────────────────────

export type ServiceDefaults = { id?: string; name: string; homeLabel: string; shortDescription: string; description: string; benefits: string; deliveryTime: string; startingPrice: string; icon: string; image: string; quoteType: string; sortOrder: number; featured: boolean; active: boolean };

export function ServiceForm({ d }: { d: ServiceDefaults }) {
  return (
    <ActionForm action={saveService} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Section title="Informações">
        <TextField name="name" label="Nome do serviço" required defaultValue={d.name} maxLength={120} />
        <TextField name="homeLabel" label="Nome no card da Home (opcional)" defaultValue={d.homeLabel} maxLength={60} />
        <TextField name="shortDescription" label="Descrição curta" required defaultValue={d.shortDescription} maxLength={220} wrapperClassName="md:col-span-2" />
        <TextArea name="description" label="Descrição completa" required rows={5} defaultValue={d.description} wrapperClassName="md:col-span-2" />
        <TextArea name="benefits" label="Benefícios (um por linha)" rows={5} defaultValue={d.benefits} wrapperClassName="md:col-span-2" />
      </Section>
      <Section title="Preço e prazo">
        <TextField name="startingPrice" label="Preço inicial (R$)" defaultValue={d.startingPrice} inputMode="decimal" hint={'Deixe vazio para exibir "Solicite orçamento".'} />
        <TextField name="deliveryTime" label="Prazo estimado" defaultValue={d.deliveryTime} placeholder="10 a 20 dias úteis" />
      </Section>
      <Section title="Aparência e vínculo">
        <SelectField name="icon" label="Ícone" defaultValue={d.icon} options={SERVICE_ICON_OPTIONS} />
        <SelectField name="quoteType" label="Tipo no orçamento" defaultValue={d.quoteType} options={options(QUOTE_TYPE_LABEL)} hint="Pré-seleciona o tipo quando o cliente clica em Contratar." />
        <div className="md:col-span-2"><ImageUpload name="image" label="Imagem (opcional — substitui o ícone)" defaultValue={d.image} /></div>
        <TextField name="sortOrder" label="Ordem de exibição" type="number" min={0} defaultValue={d.sortOrder} />
        <div className="space-y-3 pt-6">
          <CheckboxField name="featured" label="Mostrar na Home" defaultChecked={d.featured} />
          <CheckboxField name="active" label="Serviço ativo" defaultChecked={d.id ? d.active : true} />
        </div>
      </Section>
      <FormActions backHref="/admin/servicos" id={d.id} onDelete={d.id ? <ActionButton action={deleteService} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir serviço?", message: "O serviço será removido do site. Projetos existentes são mantidos." }}>Excluir serviço</ActionButton> : undefined} />
    </ActionForm>
  );
}

// ── Portfólio ───────────────────────────────────────────────

export type PortfolioDefaults = { id?: string; title: string; client: string; category: string; description: string; technologies: string; image: string; url: string; sortOrder: number; active: boolean };

export function PortfolioForm({ d }: { d: PortfolioDefaults }) {
  return (
    <ActionForm action={savePortfolio} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Section title="Projeto">
        <TextField name="title" label="Nome do projeto" required defaultValue={d.title} maxLength={150} />
        <TextField name="client" label="Cliente" required defaultValue={d.client} maxLength={120} />
        <div>
          <TextField name="category" label="Categoria" required defaultValue={d.category} list="pcats" />
          <datalist id="pcats">{PORTFOLIO_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <TextField name="url" label="Link do projeto" defaultValue={d.url} placeholder="https://" />
        <TextArea name="description" label="Descrição" required rows={4} defaultValue={d.description} wrapperClassName="md:col-span-2" />
        <TextField name="technologies" label="Tecnologias (separadas por vírgula)" defaultValue={d.technologies} placeholder="Next.js, PostgreSQL, Tailwind" wrapperClassName="md:col-span-2" />
        <div className="md:col-span-2"><ImageUpload name="image" label="Imagem do projeto" defaultValue={d.image} /></div>
        <TextField name="sortOrder" label="Ordem de exibição" type="number" min={0} defaultValue={d.sortOrder} />
        <div className="pt-6"><CheckboxField name="active" label="Publicado no site" defaultChecked={d.id ? d.active : true} /></div>
      </Section>
      <FormActions backHref="/admin/portfolio" id={d.id} onDelete={d.id ? <ActionButton action={deletePortfolio} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir projeto?", message: "O projeto será removido do portfólio." }}>Excluir projeto</ActionButton> : undefined} />
    </ActionForm>
  );
}

// ── Plano ───────────────────────────────────────────────────

export type PlanDefaults = { id?: string; name: string; description: string; price: string; billing: string; features: string; sortOrder: number; highlighted: boolean; active: boolean };

export function PlanForm({ d }: { d: PlanDefaults }) {
  return (
    <ActionForm action={savePlan} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Section title="Plano">
        <TextField name="name" label="Nome" required defaultValue={d.name} maxLength={80} />
        <TextField name="description" label="Descrição curta" required defaultValue={d.description} maxLength={200} />
        <TextField name="price" label="Preço (R$)" required defaultValue={d.price} inputMode="decimal" />
        <SelectField name="billing" label="Cobrança" defaultValue={d.billing} options={options(BILLING_LABEL)} />
        <TextArea name="features" label="Benefícios (um por linha)" rows={7} defaultValue={d.features} wrapperClassName="md:col-span-2" />
        <TextField name="sortOrder" label="Ordem de exibição" type="number" min={0} defaultValue={d.sortOrder} />
        <div className="space-y-3 pt-6">
          <CheckboxField name="highlighted" label="Destacar como “Mais escolhido”" defaultChecked={d.highlighted} />
          <CheckboxField name="active" label="Plano ativo" defaultChecked={d.id ? d.active : true} />
        </div>
      </Section>
      <FormActions backHref="/admin/planos" id={d.id} onDelete={d.id ? <ActionButton action={deletePlan} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir plano?", message: "O plano será removido do site." }}>Excluir plano</ActionButton> : undefined} />
    </ActionForm>
  );
}

// ── Cupom ───────────────────────────────────────────────────

export type CouponDefaults = { id?: string; code: string; type: string; value: string; minOrder: string; maxUses: string; expiresAt: string; active: boolean };

export function CouponForm({ d }: { d: CouponDefaults }) {
  return (
    <ActionForm action={saveCoupon} className="space-y-6">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <Section title="Cupom">
        <TextField name="code" label="Código" required defaultValue={d.code} className="uppercase" maxLength={30} placeholder="BEMVINDO10" />
        <SelectField name="type" label="Tipo de desconto" defaultValue={d.type} options={[{ value: "PERCENT", label: "Porcentagem (%)" }, { value: "FIXED", label: "Valor fixo (R$)" }]} />
        <TextField name="value" label="Valor do desconto" required defaultValue={d.value} hint="Porcentagem: 1 a 100 · Fixo: em reais (ex.: 20,00)" />
        <TextField name="minOrder" label="Pedido mínimo (R$)" defaultValue={d.minOrder} inputMode="decimal" />
        <TextField name="maxUses" label="Limite de usos" type="number" min={1} defaultValue={d.maxUses} hint="Vazio = ilimitado." />
        <TextField name="expiresAt" label="Válido até" type="date" defaultValue={d.expiresAt} />
        <div className="md:col-span-2"><CheckboxField name="active" label="Cupom ativo" defaultChecked={d.id ? d.active : true} /></div>
      </Section>
      <FormActions backHref="/admin/cupons" id={d.id} onDelete={d.id ? <ActionButton action={deleteCoupon} fields={{ id: d.id }} variant="danger" size="md" confirm={{ title: "Excluir cupom?", message: "Pedidos já feitos com este cupom não são afetados." }}>Excluir cupom</ActionButton> : undefined} />
    </ActionForm>
  );
}
