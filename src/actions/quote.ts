"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { getCurrentUser } from "@/lib/auth/session";
import { limitByIp } from "@/lib/rate-limit";
import { zEmail, zName, zOptText, zPhone } from "@/lib/validation";
import { emailCompany } from "@/services/mail";
import { notifyAdmins } from "@/services/notifications";
import { QUOTE_TYPE_LABEL } from "@/types/labels";
import { quoteNumber } from "@/utils/format";

const yesNo = z.enum(["yes", "no"]).default("no").transform((v) => v === "yes");

const schema = z.object({
  type: z.enum(["SITE", "ECOMMERCE", "LANDING", "SYSTEM", "APP", "DESIGN", "MARKETING", "OTHER"], { errorMap: () => ({ message: "Escolha o que você precisa." }) }),
  objective: z.string().trim().min(3, "Informe o objetivo do projeto.").max(200),
  deadline: z.string().trim().min(1, "Informe o prazo desejado.").max(100),
  hasDomain: yesNo,
  hasHosting: yesNo,
  hasBrand: yesNo,
  wantsMaintenance: yesNo,
  wantsWhatsapp: yesNo,
  wantsPayments: yesNo,
  wantsAdminArea: yesNo,
  description: z.string().trim().min(10, "Conte um pouco sobre o seu projeto (mín. 10 caracteres).").max(4000),
  name: zName,
  company: zOptText(150),
  whatsapp: zPhone,
  email: zEmail,
  website: z.string().optional(), // honeypot
});

export async function createQuote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const parsed = parseForm(schema, fd);
    if (!parsed.success) return parsed.state;
    const { website, ...data } = parsed.data;
    if (website) return ok("Orçamento enviado!", { redirectTo: "/orcamento/enviado" });

    const limited = await limitByIp("quote", 5, 600);
    if (limited) return fail(limited);

    const user = await getCurrentUser();
    const quote = await db.quote.create({ data: { ...data, userId: user?.id ?? null } });
    const label = quoteNumber(quote.number);
    await notifyAdmins("Novo orçamento", `${label} — ${QUOTE_TYPE_LABEL[quote.type]} — ${quote.name}`, `/admin/orcamentos/${quote.id}`).catch(() => {});
    void emailCompany(
      `Novo orçamento ${label}: ${QUOTE_TYPE_LABEL[quote.type]}`,
      `${quote.name} (${quote.company ?? "sem empresa"})\n${quote.email} · ${quote.whatsapp}\nObjetivo: ${quote.objective}\nPrazo: ${quote.deadline}\n\n${quote.description}`,
    );
    return ok("Orçamento enviado com sucesso!", { redirectTo: `/orcamento/enviado?n=${quote.number}` });
  });
}
