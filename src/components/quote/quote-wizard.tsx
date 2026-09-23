"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ActionForm, useFormErrors } from "@/components/forms/action-form";
import { SelectField, TextArea, TextField } from "@/components/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { createQuote } from "@/actions/quote";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Code2, Globe, LayoutTemplate, Megaphone, Palette, ShoppingBag, Smartphone, Sparkles, type LucideIcon } from "lucide-react";

const TYPES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "SITE", label: "Site", icon: Globe },
  { value: "ECOMMERCE", label: "Loja virtual", icon: ShoppingBag },
  { value: "LANDING", label: "Landing page", icon: LayoutTemplate },
  { value: "SYSTEM", label: "Sistema", icon: Code2 },
  { value: "APP", label: "Aplicativo", icon: Smartphone },
  { value: "DESIGN", label: "Design", icon: Palette },
  { value: "MARKETING", label: "Marketing", icon: Megaphone },
  { value: "OTHER", label: "Outro", icon: Sparkles },
];

const OBJECTIVES = [
  "Apresentar minha empresa na internet",
  "Vender produtos ou serviços online",
  "Captar contatos e clientes",
  "Automatizar processos da empresa",
  "Criar ou fortalecer minha marca",
  "Outro (explico abaixo)",
];
const DEADLINES = ["Urgente (até 15 dias)", "Até 1 mês", "De 2 a 3 meses", "Sem pressa / flexível"];

const QUESTIONS: { name: string; label: string }[] = [
  { name: "hasDomain", label: "Possui domínio?" },
  { name: "hasHosting", label: "Possui hospedagem?" },
  { name: "hasBrand", label: "Já possui identidade visual?" },
  { name: "wantsMaintenance", label: "Deseja manutenção mensal?" },
  { name: "wantsWhatsapp", label: "Deseja integração com WhatsApp?" },
  { name: "wantsPayments", label: "Deseja sistema de pagamentos?" },
  { name: "wantsAdminArea", label: "Deseja área administrativa?" },
];

const STEPS = ["O que você precisa", "Sobre o projeto", "Seus dados"];
const STEP_OF: Record<string, number> = { type: 0, objective: 1, deadline: 1, description: 1, name: 2, whatsapp: 2, email: 2, company: 2 };

type Props = { initialType?: string; initialNote?: string; user?: { name: string; email: string; whatsapp: string } | null };

export function QuoteWizard(props: Props) {
  return (
    <ActionForm action={createQuote} showFormError>
      <Wizard {...props} />
    </ActionForm>
  );
}

function Wizard({ initialType, initialNote, user }: Props) {
  const [step, setStep] = useState(0);
  const [type, setType] = useState(initialType ?? "");
  const errors = useFormErrors();
  const { toast } = useToast();

  // Se o servidor apontar um erro em outra etapa, volta para ela.
  useEffect(() => {
    const first = Object.keys(errors).map((k) => STEP_OF[k]).filter((n) => n !== undefined).sort()[0];
    if (first !== undefined) setStep(first);
  }, [errors]);

  const next = () => {
    if (step === 0 && !type) return toast("error", "Escolha o que você precisa para continuar.");
    const form = document.getElementById("quote-step-1");
    if (step === 1) {
      const req = form?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[required]") ?? [];
      for (const el of Array.from(req)) {
        if (!el.value.trim()) {
          el.focus();
          return toast("error", "Preencha os campos obrigatórios para continuar.");
        }
      }
    }
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progresso */}
      <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label="Etapas do orçamento">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition", i < step ? "border-cyan bg-cyan/20 text-cyan" : i === step ? "border-neon-2 bg-neon text-white shadow-[0_0_16px_rgb(29_107_255_/_0.8)]" : "border-white/15 text-steel")} aria-current={i === step ? "step" : undefined}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-white" : "text-steel")}>{label}</span>
            {i < STEPS.length - 1 && <span className={cn("h-px flex-1 transition", i < step ? "bg-cyan/60" : "bg-white/10")} />}
          </li>
        ))}
      </ol>

      <div className="card p-6 md:p-9">
        {/* Etapa 1 */}
        <div className={cn(step !== 0 && "hidden")}>
          <h2 className="text-2xl font-bold">O que você precisa?</h2>
          <p className="mt-1 text-sm text-steel">Selecione a opção que melhor descreve o seu projeto.</p>
          <input type="hidden" name="type" value={type} />
          <div role="radiogroup" aria-label="Tipo de projeto" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" role="radio" aria-checked={type === value} onClick={() => setType(value)} className={cn("flex flex-col items-center gap-3 rounded-2xl border p-5 text-sm font-semibold transition", type === value ? "border-neon-2 bg-neon/20 text-white shadow-[0_0_28px_-6px_rgb(29_107_255_/_0.9)]" : "border-white/10 bg-white/[0.03] text-silver hover:border-sky/60 hover:text-white")}>
                <Icon className={cn("h-7 w-7", type === value ? "text-sky" : "text-steel")} aria-hidden />
                {label}
              </button>
            ))}
          </div>
          {errors.type && <p className="field-error mt-3">{errors.type}</p>}
        </div>

        {/* Etapa 2 */}
        <div id="quote-step-1" className={cn("space-y-5", step !== 1 && "hidden")}>
          <div>
            <h2 className="text-2xl font-bold">Conte sobre o projeto</h2>
            <p className="mt-1 text-sm text-steel">Quanto mais detalhes, mais precisa será a proposta.</p>
          </div>
          <SelectField name="objective" label="Qual é o objetivo do projeto?" required placeholder="Selecione…" options={OBJECTIVES.map((o) => ({ value: o, label: o }))} />
          <SelectField name="deadline" label="Qual é o prazo desejado?" required placeholder="Selecione…" options={DEADLINES.map((o) => ({ value: o, label: o }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            {QUESTIONS.map((q) => (
              <fieldset key={q.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <legend className="sr-only">{q.label}</legend>
                <span className="text-sm text-silver" aria-hidden>{q.label}</span>
                <span className="flex shrink-0 gap-1.5">
                  {[["yes", "Sim"], ["no", "Não"]].map(([v, l]) => (
                    <label key={v} className="cursor-pointer">
                      <input type="radio" name={q.name} value={v} defaultChecked={v === "no"} className="peer sr-only" aria-label={`${q.label} ${l}`} />
                      <span className="block rounded-lg border border-white/12 px-3 py-1.5 text-xs font-semibold text-steel transition peer-checked:border-neon-2 peer-checked:bg-neon/25 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sky">{l}</span>
                    </label>
                  ))}
                </span>
              </fieldset>
            ))}
          </div>
          <TextArea name="description" label="Conte um pouco sobre seu projeto" required rows={5} maxLength={4000} defaultValue={initialNote} placeholder="Ex.: o que sua empresa faz, referências que você gosta, funcionalidades desejadas…" />
        </div>

        {/* Etapa 3 */}
        <div className={cn("space-y-5", step !== 2 && "hidden")}>
          <div>
            <h2 className="text-2xl font-bold">Quase lá! Seus dados</h2>
            <p className="mt-1 text-sm text-steel">Usaremos para enviar a proposta. Não compartilhamos suas informações.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Nome" required autoComplete="name" defaultValue={user?.name} />
            <TextField name="company" label="Empresa" autoComplete="organization" />
            <TextField name="whatsapp" label="WhatsApp" required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" defaultValue={user?.whatsapp} />
            <TextField name="email" label="E-mail" type="email" required autoComplete="email" defaultValue={user?.email} />
          </div>
          <div className="hidden" aria-hidden>
            <label>Site <input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <p className="text-xs text-steel">Ao solicitar, você concorda em ser contatado(a) por WhatsApp ou e-mail sobre este orçamento.</p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
          <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} className={cn("btn btn-ghost", step === 0 && "invisible")}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
          </button>
          {step < 2 ? (
            <button type="button" onClick={next} className="btn btn-primary">
              Continuar <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <SubmitButton size="lg" pendingText="Enviando…">Solicitar orçamento</SubmitButton>
          )}
        </div>
      </div>
    </div>
  );
}
