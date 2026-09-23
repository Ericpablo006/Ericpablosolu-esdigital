import { Compass, Eye, Gem } from "lucide-react";
import { Particles } from "@/components/effects/particles";
import { WhyUs } from "@/components/home/why-us";
import { ButtonLink } from "@/components/ui/button";
import { PageHero, SectionHeading } from "@/components/ui/misc";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = async () => pageMetadata({ title: "Sobre nós", description: (await getSettings()).aboutText, path: "/sobre" });

export default async function AboutPage() {
  const s = await getSettings();
  const values = s.values.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  return (
    <>
      <PageHero eyebrow="Sobre" title={s.aboutTitle} description={s.aboutText} />

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-6 md:grid-cols-3">
          <div className="card p-7">
            <Compass className="mb-4 h-8 w-8 text-sky" aria-hidden />
            <h2 className="text-xl font-bold">Missão</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">{s.mission}</p>
          </div>
          <div className="card p-7">
            <Eye className="mb-4 h-8 w-8 text-sky" aria-hidden />
            <h2 className="text-xl font-bold">Visão</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">{s.vision}</p>
          </div>
          <div className="card p-7">
            <Gem className="mb-4 h-8 w-8 text-sky" aria-hidden />
            <h2 className="text-xl font-bold">Valores</h2>
            <ul className="mt-3 space-y-2 text-sm text-steel">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />{v}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-ink-2/50 py-16 md:py-24">
        <div className="container-x">
          <SectionHeading eyebrow="Diferenciais" title={`Por que escolher a ${s.companyName}?`} />
          <WhyUs />
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl border border-neon-2/30 bg-gradient-to-br from-navy-2 via-navy to-ink px-6 py-14 text-center">
          <Particles />
          <div className="relative">
            <h2 className="text-3xl font-bold">{s.tagline}.</h2>
            <p className="mx-auto mt-3 max-w-lg text-silver/90">Vamos conversar sobre o seu projeto?</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href="/orcamento" size="lg">Solicitar orçamento</ButtonLink>
              <ButtonLink href="/contato" variant="outline" size="lg">Entrar em contato</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
