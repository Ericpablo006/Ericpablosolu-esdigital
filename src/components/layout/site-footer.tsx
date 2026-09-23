import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import type { Settings } from "@/lib/settings";
import { formatPhoneBR, instagramHandle, instagramUrl, whatsappUrl } from "@/utils/format";

export function SiteFooter({ settings }: { settings: Settings }) {
  const insta = instagramUrl(settings.instagram);
  return (
    <footer className="relative mt-24 border-t border-white/8 bg-ink-2/60">
      <div className="glow-line absolute inset-x-0 top-0" aria-hidden />
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo companyName={settings.companyName} logoUrl={settings.logoUrl} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-steel">{settings.tagline}. {settings.slogan}.</p>
        </div>

        <FooterList title="Empresa" links={[["/sobre", "Sobre nós"], ["/portfolio", "Portfólio"], ["/planos", "Planos"], ["/contato", "Contato"]]} />
        <FooterList title="Soluções" links={[["/servicos", "Serviços"], ["/produtos", "Produtos digitais"], ["/orcamento", "Monte seu orçamento"], ["/entrar", "Área do Cliente"]]} />

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Fale conosco</h3>
          <ul className="space-y-3 text-sm">
            {settings.whatsapp && (
              <li>
                <a href={whatsappUrl(settings.whatsapp, "Olá! Vim pelo site da Eric Pablo Soluções Digitais e gostaria de solicitar um orçamento.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-silver transition hover:text-white">
                  <WhatsAppIcon className="h-4 w-4 text-[#25d366]" /> {formatPhoneBR(settings.whatsapp)}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 text-silver transition hover:text-white">
                  <Mail className="h-4 w-4 text-sky" /> {settings.email}
                </a>
              </li>
            )}
            {insta && (
              <li>
                <a href={insta} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-silver transition hover:text-white">
                  <InstagramIcon className="h-4 w-4 text-sky" /> {instagramHandle(settings.instagram)}
                </a>
              </li>
            )}
            {!settings.whatsapp && !settings.email && !insta && (
              <li><Link href="/contato" className="text-silver transition hover:text-white">Envie uma mensagem</Link></li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/8">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-steel sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.companyName}. Todos os direitos reservados.</p>
          <p>{settings.tagline}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">{title}</h3>
      <ul className="space-y-3 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-silver transition hover:text-white">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
