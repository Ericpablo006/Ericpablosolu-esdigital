// Dados de DEMONSTRAÇÃO (opcional): produtos e portfólio de exemplo para ver a loja funcionando.
// NÃO rode em produção. Apague tudo depois em Admin → Produtos / Portfólio.
// Uso: npm run db:seed:demo
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

try {
  process.loadEnvFile();
} catch {
  /* sem .env */
}

const db = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed de demonstração bloqueado em produção.");

  // Arquivo de exemplo para testar a entrega digital pós-pagamento
  const dir = path.resolve(process.env.UPLOAD_DIR || "./storage", "private");
  mkdirSync(dir, { recursive: true });
  const fileKey = `${randomUUID()}.txt`;
  writeFileSync(path.join(dir, fileKey), "Arquivo de demonstração — entregue somente após a confirmação do pagamento.\n");

  const products = [
    { slug: "demo-template-site-institucional", name: "Template de Site Institucional", category: "Templates", priceCents: 9700, promoPriceCents: 6900, featured: true, shortDescription: "Layout profissional e responsivo pronto para personalizar.", description: "Template completo para site institucional com páginas de início, serviços, sobre e contato. (Produto de demonstração.)", features: ["Design responsivo", "Seções prontas para editar", "Código organizado"], includes: ["Arquivos do template", "Guia de instalação"], requirements: ["Editor de código", "Hospedagem web"], fileKey, fileName: "demo-produto.txt" },
    { slug: "demo-landing-page-conversao", name: "Landing Page de Alta Conversão", category: "Landing pages", priceCents: 7900, shortDescription: "Página de vendas focada em conversão.", description: "Landing page com estrutura pensada para campanhas e captação de contatos. (Produto de demonstração.)", features: ["Estrutura de conversão", "Formulário e WhatsApp", "Carregamento rápido"], includes: ["Arquivos da página", "Guia de personalização"], requirements: ["Editor de código"], externalUrl: "https://example.com/demo" },
    { slug: "demo-pack-artes-redes-sociais", name: "Pack de Artes para Redes Sociais", category: "Packs de design", priceCents: 4900, shortDescription: "Modelos editáveis para posts e stories.", description: "Coleção de modelos editáveis para feed e stories. (Produto de demonstração.)", features: ["Modelos editáveis", "Formatos feed e stories"], includes: ["Arquivos editáveis", "Fontes sugeridas"], requirements: ["Editor de imagens compatível"] },
    { slug: "demo-kit-identidade-visual", name: "Kit de Identidade Visual Editável", category: "Layouts", priceCents: 12900, shortDescription: "Base de identidade visual para adaptar à sua marca.", description: "Kit com estrutura de logotipo, paleta e aplicações. (Produto de demonstração.)", features: ["Logotipo base", "Paleta de cores", "Aplicações de marca"], includes: ["Arquivos editáveis", "Manual resumido"], requirements: ["Editor vetorial"] },
    { slug: "demo-sistema-agendamento", name: "Sistema de Agendamento (código-fonte)", category: "Sistemas", priceCents: 29900, shortDescription: "Base de sistema web para agendamentos.", description: "Código-fonte de sistema de agendamento com cadastro e painel. (Produto de demonstração.)", features: ["Cadastro de clientes", "Agenda", "Painel administrativo"], includes: ["Código-fonte", "Documentação"], requirements: ["Node.js", "PostgreSQL"] },
    { slug: "demo-layout-loja-virtual", name: "Layout de Loja Virtual", category: "Layouts", priceCents: 8900, shortDescription: "Interface moderna para e-commerce.", description: "Layout de loja virtual com vitrine, produto e checkout. (Produto de demonstração.)", features: ["Vitrine", "Página de produto", "Checkout"], includes: ["Arquivos de design"], requirements: ["Editor de design"] },
  ];
  for (const p of products) {
    await db.product.upsert({ where: { slug: p.slug }, create: { ...p, images: [] }, update: {} });
  }

  const portfolio = [
    { title: "Site institucional (exemplo)", client: "Cliente de exemplo", category: "Sites", description: "Projeto de demonstração para ilustrar como seus trabalhos aparecem no portfólio.", technologies: ["Next.js", "Tailwind CSS"], sortOrder: 1 },
    { title: "Sistema de gestão (exemplo)", client: "Cliente de exemplo", category: "Sistemas", description: "Projeto de demonstração de um sistema sob medida com painel administrativo.", technologies: ["TypeScript", "PostgreSQL"], sortOrder: 2 },
    { title: "Loja virtual (exemplo)", client: "Cliente de exemplo", category: "Lojas virtuais", description: "Projeto de demonstração de e-commerce com pagamentos online.", technologies: ["Next.js", "PIX"], sortOrder: 3 },
  ];
  if ((await db.portfolioItem.count()) === 0) {
    for (const p of portfolio) await db.portfolioItem.create({ data: p });
  }

  await db.coupon.upsert({ where: { code: "BEMVINDO10" }, create: { code: "BEMVINDO10", type: "PERCENT", value: 10 }, update: {} });
  console.log("✔ Dados de demonstração criados (produtos, portfólio e cupom BEMVINDO10).");
}

main()
  .catch((e) => {
    console.error("✖", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
