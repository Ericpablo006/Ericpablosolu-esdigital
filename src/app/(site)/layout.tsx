import { CartProvider } from "@/components/cart/cart-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth/session";
import { appUrl } from "@/lib/env";
import { instagramUrl } from "@/utils/format";
import { jsonLd } from "@/lib/utils";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const insta = instagramUrl(settings.instagram);
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    slogan: settings.slogan,
    url: appUrl(),
    ...(settings.email ? { email: settings.email } : {}),
    ...(insta ? { sameAs: [insta] } : {}),
  };

  return (
    <CartProvider>
      <SiteHeader companyName={settings.companyName} logoUrl={settings.logoUrl} user={user ? { name: user.name, role: user.role } : null} />
      <main id="conteudo">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFloat number={settings.whatsapp} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organization) }} />
    </CartProvider>
  );
}
