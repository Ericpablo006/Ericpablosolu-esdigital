import Link from "next/link";
import { WhatsAppIcon } from "@/components/brand/icons";
import { whatsappUrl } from "@/utils/format";

/** Botão flutuante do WhatsApp. Sem número configurado, leva para a página de contato. */
export function WhatsAppFloat({ number }: { number: string }) {
  const cls = "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-6px_rgb(37_211_102_/_0.7)] transition hover:scale-110 animate-pulse-ring no-print";
  const label = "Falar no WhatsApp";
  if (!number) {
    return (
      <Link href="/contato" aria-label={label} className={cls}>
        <WhatsAppIcon className="h-7 w-7" />
      </Link>
    );
  }
  return (
    <a
      href={whatsappUrl(number, "Olá! Vim pelo site da Eric Pablo Soluções Digitais e gostaria de solicitar um orçamento.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cls}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
