"use client";

import { ActionForm } from "./action-form";
import { TextArea, TextField } from "./fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/brand/icons";
import { sendContactMessage } from "@/actions/contact";

export function ContactForm({ whatsappHref }: { whatsappHref: string }) {
  return (
    <ActionForm action={sendContactMessage} className="grid gap-5 sm:grid-cols-2" resetOnSuccess>
      <TextField name="name" label="Nome" required autoComplete="name" maxLength={120} />
      <TextField name="whatsapp" label="WhatsApp" required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
      <TextField name="email" label="E-mail" type="email" required autoComplete="email" wrapperClassName="sm:col-span-2" />
      <TextField name="subject" label="Assunto" required maxLength={150} wrapperClassName="sm:col-span-2" />
      <TextArea name="message" label="Mensagem" required rows={6} maxLength={4000} wrapperClassName="sm:col-span-2" />
      {/* Campo isca contra robôs (invisível para pessoas) */}
      <div className="hidden" aria-hidden>
        <label>Site <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
        <SubmitButton pendingText="Enviando…">Enviar mensagem</SubmitButton>
        <ButtonLink href={whatsappHref} variant="whatsapp">
          <WhatsAppIcon className="h-4 w-4" /> Falar pelo WhatsApp
        </ButtonLink>
      </div>
    </ActionForm>
  );
}
