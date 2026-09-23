import nodemailer from "nodemailer";
import { smtpConfigured } from "@/lib/env";
import { getSettings } from "@/lib/settings";

type Mail = { to: string; subject: string; text: string; html?: string };

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

/** Envia e-mail via SMTP. Sem SMTP configurado, registra no console (modo desenvolvimento). */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!smtpConfigured()) {
    console.log(`\n[e-mail simulado] Para: ${mail.to}\nAssunto: ${mail.subject}\n${mail.text}\n`);
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      ...mail,
    });
    return true;
  } catch (err) {
    console.error("[mail] falha ao enviar:", err);
    return false;
  }
}

/** Avisa a empresa por e-mail (melhor esforço). */
export async function emailCompany(subject: string, text: string) {
  const settings = await getSettings();
  if (!settings.email) return;
  await sendMail({ to: settings.email, subject, text });
}
