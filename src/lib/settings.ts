import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/** Todas as configurações editáveis no painel (Admin → Configurações). */
export const SETTING_DEFAULTS = {
  companyName: "Eric Pablo Soluções Digitais",
  slogan: "Ideias que viram resultados",
  tagline: "Seu projeto, nossa tecnologia",
  logoUrl: "",
  whatsapp: "",
  instagram: "",
  email: "",
  companyDocument: "",
  companyCity: "",
  heroTitle: "Transformamos ideias em soluções digitais.",
  heroSubtitle:
    "Sites, sistemas, aplicativos, design e tecnologia para transformar seu projeto em resultado.",
  solutionsTitle: "Soluções digitais para seu negócio",
  aboutTitle: "Sobre a Eric Pablo Soluções Digitais",
  aboutText:
    "A Eric Pablo Soluções Digitais nasceu com o objetivo de transformar ideias em soluções digitais modernas, funcionais e capazes de gerar resultados.",
  mission:
    "Desenvolver soluções digitais sob medida que impulsionem o crescimento dos nossos clientes, unindo tecnologia, design e atendimento próximo.",
  vision:
    "Ser referência em soluções digitais para pequenas e médias empresas, reconhecida pela qualidade técnica e pelos resultados entregues.",
  values: "Compromisso com resultados\nTransparência\nInovação constante\nExcelência técnica\nRespeito ao cliente",
  seoDescription:
    "Criação de sites, lojas virtuais, sistemas, aplicativos, design e marketing digital. Ideias que viram resultados.",
  pixKey: "",
  pixReceiverName: "",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = { [K in SettingKey]: string };

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    const rows = await db.setting.findMany();
    const out: Settings = { ...SETTING_DEFAULTS };
    for (const r of rows) {
      if (r.key in SETTING_DEFAULTS) out[r.key as SettingKey] = r.value;
    }
    return out;
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 300 },
);
