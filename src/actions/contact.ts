"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseForm, safely, fail, type ActionState } from "@/lib/action";
import { limitByIp } from "@/lib/rate-limit";
import { zEmail, zName, zPhone } from "@/lib/validation";
import { notifyAdmins } from "@/services/notifications";
import { emailCompany } from "@/services/mail";

const schema = z.object({
  name: zName,
  whatsapp: zPhone,
  email: zEmail,
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(4000),
  website: z.string().optional(), // honeypot anti-spam
});

export async function sendContactMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(schema, fd);
    if (!parsed.success) return parsed.state;
    const { website, ...data } = parsed.data;
    if (website) return ok("Mensagem enviada! Responderemos em breve."); // bot: finge sucesso

    const limited = await limitByIp("contact", 5, 600);
    if (limited) return fail(limited);

    await db.contactMessage.create({ data });
    await notifyAdmins("Nova mensagem de contato", `${data.name} — ${data.subject}`, "/admin/suporte?tab=mensagens").catch(() => {});
    void emailCompany(`Contato pelo site: ${data.subject}`, `${data.name}\n${data.email}\n${data.whatsapp}\n\n${data.message}`);
    return ok("Mensagem enviada! Responderemos em breve.");
  });
}
