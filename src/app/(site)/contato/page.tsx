import { Mail } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import { ContactForm } from "@/components/forms/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/ui/misc";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { formatPhoneBR, instagramHandle, instagramUrl, whatsappUrl } from "@/utils/format";
import { DEFAULT_WHATSAPP_MESSAGE } from "@/types/constants";

export const generateMetadata = () => pageMetadata({ title: "Contato", description: "Fale com a Eric Pablo Soluções Digitais por WhatsApp, e-mail, Instagram ou pelo formulário.", path: "/contato" });

export default async function ContactPage() {
  const s = await getSettings();
  const insta = instagramUrl(s.instagram);
  const channels = [
    s.whatsapp && { icon: <WhatsAppIcon className="h-5 w-5" />, label: "WhatsApp", value: formatPhoneBR(s.whatsapp), href: whatsappUrl(s.whatsapp, DEFAULT_WHATSAPP_MESSAGE), color: "text-[#25d366]" },
    s.email && { icon: <Mail className="h-5 w-5" />, label: "E-mail", value: s.email, href: `mailto:${s.email}`, color: "text-sky" },
    insta && { icon: <InstagramIcon className="h-5 w-5" />, label: "Instagram", value: instagramHandle(s.instagram), href: insta, color: "text-sky" },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href: string; color: string }[];

  return (
    <>
      <PageHero eyebrow="Contato" title={<>Vamos conversar sobre o <span className="text-neon">seu projeto</span>?</>} description="Envie uma mensagem ou fale direto pelo WhatsApp. Respondemos o mais rápido possível." />
      <section className="py-14 md:py-20">
        <div className="container-x grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="card p-6 md:p-9">
            <h2 className="mb-6 text-2xl font-bold">Envie sua mensagem</h2>
            <ContactForm whatsappHref={whatsappUrl(s.whatsapp, DEFAULT_WHATSAPP_MESSAGE)} />
          </div>
          <aside className="space-y-4">
            {channels.map((c) => (
              <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card card-hover flex items-center gap-4 p-5">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 ${c.color}`}>{c.icon}</span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-steel">{c.label}</span>
                  <span className="block truncate font-medium text-white">{c.value}</span>
                </span>
              </a>
            ))}
            {channels.length === 0 && <p className="card p-5 text-sm text-steel">Use o formulário ao lado para falar com a gente.</p>}
            <div className="card p-6">
              <h3 className="text-lg font-bold">Prefere um orçamento direto?</h3>
              <p className="mt-2 text-sm text-steel">Responda algumas perguntas rápidas e receba uma proposta sob medida.</p>
              <ButtonLink href="/orcamento" className="mt-5 w-full">Monte seu orçamento</ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
