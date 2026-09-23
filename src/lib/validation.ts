import { z } from "zod";
import { parseMoneyToCents } from "@/utils/money";
import { onlyDigits } from "@/utils/format";
import { isValidCpfCnpj } from "@/utils/validators";

// Mensagens de erro em português para todo o sistema.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: issue.received === "undefined" || issue.received === "null" ? "Campo obrigatório." : "Valor inválido." };
    case z.ZodIssueCode.too_small:
      if (issue.type === "string")
        return { message: issue.minimum === 1 ? "Campo obrigatório." : `Use pelo menos ${issue.minimum} caracteres.` };
      if (issue.type === "array") return { message: `Informe pelo menos ${issue.minimum}.` };
      return { message: `O valor mínimo é ${issue.minimum}.` };
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") return { message: `Use no máximo ${issue.maximum} caracteres.` };
      return { message: `O valor máximo é ${issue.maximum}.` };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "E-mail inválido." };
      if (issue.validation === "url") return { message: "URL inválida." };
      return { message: "Formato inválido." };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Opção inválida." };
    default:
      return { message: ctx.defaultError };
  }
});

export const zEmail = z.string().trim().toLowerCase().min(1).max(190).email();

export const zPassword = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letras e números na senha.");

export const zName = z.string().trim().min(2, "Informe o nome.").max(120);

export const zPhone = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length >= 10 && d.length <= 13, "WhatsApp inválido. Use DDD + número.");

export const zCpfCnpj = z
  .string()
  .trim()
  .refine(isValidCpfCnpj, "CPF/CNPJ inválido.")
  .transform(onlyDigits);

/** Checkbox HTML: "on"/"true" → true. */
export const zBool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

/** Campo de dinheiro digitado ("1.500,00") → centavos. */
export const zMoney = z
  .string()
  .trim()
  .min(1)
  .transform((v, ctx) => {
    const cents = parseMoneyToCents(v);
    if (cents === null || cents < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor inválido." });
      return z.NEVER;
    }
    return cents;
  });

/** Dinheiro opcional: vazio → null. */
export const zMoneyOptional = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const cents = parseMoneyToCents(v);
    if (cents === null || cents < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor inválido." });
      return z.NEVER;
    }
    return cents;
  });

/** Textarea com uma linha por item → array. */
export const zLines = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 50),
  );

/** Texto opcional: vazio → null. */
export const zOptText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

/** Imagem interna (/uploads/…) ou URL https. */
export const zImageRef = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || v.startsWith("/uploads/") || /^https:\/\/\S+$/.test(v), "Use um upload ou uma URL https.");

/** Lista de imagens (uma por linha). */
export const zImageList = zLines.refine(
  (list) => list.every((v) => v.startsWith("/uploads/") || /^https:\/\/\S+$/.test(v)),
  "Cada imagem deve ser um upload ou uma URL https.",
);

export const zHttpUrlOptional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), "Informe uma URL começando com http:// ou https://");

export const zInt = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

export const zDateInput = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const zOptDateInput = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida.");
