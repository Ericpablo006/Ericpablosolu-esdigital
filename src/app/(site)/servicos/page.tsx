import { CheckCircle2, Clock, Tag } from "lucide-react";
import { ServiceIcon, WhatsAppIcon } from "@/components/brand/icons";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { SmartImage } from "@/components/ui/smart-image";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { listActiveServices } from "@/services/catalog";
import { formatBRL } from "@/utils/money";
import { whatsappUrl } from "@/utils/format";

export const generateMetadata = () =>
  pageMetadata({ title: "Serviços", description: "Sites institucionais, landing pages, lojas virtuais, sistemas, aplicativos, design e marketing digital sob medida.", path: "/servicos" });

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([listActiveServices(), getSettings()]);

  return (
    <>
      <PageHero eyebrow="Serviços" title={<>Soluções digitais <span className="text-neon">sob medida</span></>} description="Escolha o serviço ideal para o seu projeto. Todos podem ser adaptados à sua necessidade." />
      <section className="py-16 md:py-20">
        <div className="container-x space-y-6">
          {services.length === 0 && <EmptyState title="Nenhum serviço disponível no momento" description="Volte em breve ou fale com a gente para um orçamento personalizado." action={<ButtonLink href="/contato">Falar com a gente</ButtonLink>} />}
          {services.map((s, i) => (
            <article key={s.id} id={s.slug} className="card scroll-mt-28 overflow-hidden">
              <div className={`grid lg:grid-cols-[0.8fr_1.2fr] ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-navy-2 via-navy to-ink p-10">
                  {s.image ? (
                    <SmartImage src={s.image} alt={s.name} sizes="(max-width:1024px) 100vw, 40vw" />
                  ) : (
                    <>
                      <div className="grid-bg absolute inset-0 opacity-80" aria-hidden />
                      <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-neon/30 blur-3xl" aria-hidden />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-sky shadow-[0_0_60px_rgb(59_139_255_/_0.55)] backdrop-blur">
                        <ServiceIcon name={s.icon} className="h-12 w-12" />
                      </div>
                    </>
                  )}
                </div>
                <div className="p-6 md:p-9">
                  <h2 className="text-2xl font-bold uppercase tracking-wide md:text-3xl">{s.name}</h2>
                  <p className="mt-3 leading-relaxed text-silver">{s.shortDescription}</p>
                  {s.description !== s.shortDescription && <p className="mt-3 text-sm leading-relaxed text-steel">{s.description}</p>}

                  {s.benefits.length > 0 && (
                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {s.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-silver">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden /> {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/8 pt-5 text-sm">
                    {s.deliveryTime && (
                      <span className="flex items-center gap-2 text-silver">
                        <Clock className="h-4 w-4 text-sky" aria-hidden /> <span><span className="text-steel">Prazo estimado:</span> {s.deliveryTime}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-silver">
                      <Tag className="h-4 w-4 text-sky" aria-hidden />
                      {s.startingPriceCents ? (
                        <span><span className="text-steel">A partir de</span> <strong className="font-display text-lg text-white">{formatBRL(s.startingPriceCents)}</strong></span>
                      ) : (
                        <strong className="text-white">Solicite orçamento</strong>
                      )}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href={`/orcamento?servico=${s.slug}`}>Contratar</ButtonLink>
                    <ButtonLink href={whatsappUrl(settings.whatsapp, `Olá! Gostaria de saber mais sobre ${s.name}.`)} variant="whatsapp">
                      <WhatsAppIcon className="h-4 w-4" /> Falar no WhatsApp
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
