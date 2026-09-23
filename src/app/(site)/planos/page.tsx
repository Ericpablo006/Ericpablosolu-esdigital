import { Check, Sparkles } from "lucide-react";
import { WhatsAppIcon } from "@/components/brand/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { listActivePlans } from "@/services/catalog";
import { whatsappUrl } from "@/utils/format";
import { formatBRL } from "@/utils/money";

export const generateMetadata = () =>
  pageMetadata({ title: "Planos", description: "Planos Start, Profissional e Business para ter sua presença digital com o melhor custo-benefício.", path: "/planos" });

export default async function PlansPage() {
  const [plans, settings] = await Promise.all([listActivePlans(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Planos" title={<>O plano certo para <span className="text-neon">cada etapa</span></>} description="Escolha o pacote que combina com o momento da sua empresa. Precisa de algo diferente? Montamos sob medida." />
      <section className="py-16 md:py-20">
        <div className="container-x">
          {plans.length === 0 ? (
            <EmptyState title="Planos em breve" description="Fale com a gente para receber uma proposta personalizada." action={<ButtonLink href="/orcamento">Solicitar orçamento</ButtonLink>} />
          ) : (
            <div className={cn("mx-auto grid gap-6", plans.length === 1 ? "max-w-md" : plans.length === 2 ? "max-w-3xl md:grid-cols-2" : "max-w-6xl md:grid-cols-2 lg:grid-cols-3")}>
              {plans.map((p) => (
                <article key={p.id} className={cn("relative flex flex-col rounded-3xl p-7", p.highlighted ? "border border-neon-2/60 bg-gradient-to-b from-navy-2/80 to-ink shadow-[0_0_60px_-15px_rgb(29_107_255_/_0.7)] lg:-translate-y-3" : "card")}>
                  {p.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-neon to-cyan px-4 py-1 text-xs font-bold text-white shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden /> Mais escolhido
                    </span>
                  )}
                  <h2 className="text-xl font-bold uppercase tracking-wide">{p.name}</h2>
                  <p className="mt-1.5 text-sm text-steel">{p.description}</p>
                  <div className="my-6 border-y border-white/8 py-6">
                    <p className="font-display text-4xl font-bold text-white">
                      {formatBRL(p.priceCents)}
                      {p.billing === "MONTHLY" && <span className="text-base font-medium text-steel">/mês</span>}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sky">{p.billing === "MONTHLY" ? "Mensalidade" : "Pagamento único"}</p>
                  </div>
                  <ul className="flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-silver">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 grid gap-3">
                    <ButtonLink href={`/orcamento?plano=${encodeURIComponent(p.name)}`} variant={p.highlighted ? "primary" : "outline"}>Contratar plano</ButtonLink>
                    <ButtonLink href={whatsappUrl(settings.whatsapp, `Olá! Gostaria de saber mais sobre o ${p.name}.`)} variant="ghost" size="sm">
                      <WhatsAppIcon className="h-4 w-4 text-[#25d366]" /> Tirar dúvidas no WhatsApp
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
