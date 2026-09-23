import { QuoteWizard } from "@/components/quote/quote-wizard";
import { PageHero } from "@/components/ui/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";

export const generateMetadata = () => pageMetadata({ title: "Monte seu orçamento", description: "Responda algumas perguntas e receba uma proposta sob medida para o seu projeto digital.", path: "/orcamento" });

const TYPES = ["SITE", "ECOMMERCE", "LANDING", "SYSTEM", "APP", "DESIGN", "MARKETING", "OTHER"];

export default async function QuotePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  let initialType = firstParam(sp.tipo);
  let note = "";
  const serviceSlug = firstParam(sp.servico);
  if (serviceSlug) {
    const svc = await db.service.findUnique({ where: { slug: serviceSlug }, select: { name: true, quoteType: true } });
    if (svc) {
      initialType = svc.quoteType;
      note = `Serviço de interesse: ${svc.name}\n`;
    }
  }
  const plano = firstParam(sp.plano)?.slice(0, 80);
  if (plano) note += `Plano de interesse: ${plano}\n`;
  if (initialType && !TYPES.includes(initialType)) initialType = undefined;

  return (
    <>
      <PageHero eyebrow="Orçamento" title={<>Monte seu <span className="text-neon">orçamento</span></>} description="Em 3 passos rápidos você nos conta o que precisa e recebe uma proposta personalizada." />
      <section className="py-12 md:py-16">
        <div className="container-x">
          <QuoteWizard initialType={initialType} initialNote={note} user={user ? { name: user.name, email: user.email, whatsapp: user.whatsapp ?? "" } : null} />
        </div>
      </section>
    </>
  );
}
