import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { firstParam } from "@/lib/utils";
import { quoteNumber } from "@/utils/format";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({ title: "Orçamento enviado", path: "/orcamento/enviado", noindex: true });

export default async function QuoteSentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const n = parseInt(firstParam((await searchParams).n) ?? "", 10);
  return (
    <section className="flex min-h-[80vh] items-center pb-16 pt-32">
      <div className="container-x">
        <div className="card mx-auto max-w-xl p-9 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ok/15 text-ok shadow-[0_0_40px_rgb(52_211_153_/_0.35)]">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold">Orçamento enviado!</h1>
          {Number.isFinite(n) && <p className="mt-2 text-sm font-semibold text-sky">Protocolo {quoteNumber(n)}</p>}
          <p className="mt-4 leading-relaxed text-steel">Recebemos sua solicitação e vamos analisá-la com carinho. Em breve entraremos em contato pelo WhatsApp ou e-mail informado com a proposta.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/cliente/orcamentos">Acompanhar na Área do Cliente</ButtonLink>
            <ButtonLink href="/" variant="outline">Voltar ao início</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
