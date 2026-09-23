// Seed de PRODUÇÃO/BASE: cria o administrador e o conteúdo inicial editável (serviços e planos).
// Nada aqui é dado fictício de clientes/vendas. Rode com: npm run db:seed
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  /* sem arquivo .env: usa variáveis do ambiente */
}

const db = new PrismaClient();

const services: Prisma.ServiceCreateInput[] = [
  {
    slug: "site-institucional",
    name: "Site Institucional",
    homeLabel: "Sites profissionais",
    icon: "Globe",
    quoteType: "SITE",
    featured: true,
    sortOrder: 1,
    shortDescription: "Criação de site profissional, responsivo e otimizado.",
    description:
      "Um site institucional moderno que apresenta sua empresa com credibilidade, funciona perfeitamente em qualquer tela e é otimizado para ser encontrado no Google.",
    benefits: ["Design exclusivo e responsivo", "Otimizado para buscadores (SEO)", "Integração com WhatsApp e redes sociais", "Painel para editar textos e imagens", "Hospedagem e domínio configurados"],
    deliveryTime: "10 a 20 dias úteis",
    startingPriceCents: 120000,
  },
  {
    slug: "landing-page",
    name: "Landing Page",
    icon: "LayoutTemplate",
    quoteType: "LANDING",
    sortOrder: 2,
    shortDescription: "Página focada em campanhas, produtos e conversões.",
    description: "Uma página única, direta e persuasiva, criada para transformar visitantes em contatos e clientes em campanhas de anúncios, lançamentos e ofertas.",
    benefits: ["Foco total em conversão", "Carregamento ultrarrápido", "Formulário e botão de WhatsApp", "Pronta para tráfego pago", "Métricas e pixel de acompanhamento"],
    deliveryTime: "3 a 7 dias úteis",
    startingPriceCents: 60000,
  },
  {
    slug: "loja-virtual",
    name: "Loja Virtual",
    homeLabel: "Lojas virtuais",
    icon: "ShoppingBag",
    quoteType: "ECOMMERCE",
    sortOrder: 3,
    shortDescription: "E-commerce completo para venda de produtos.",
    description: "Loja online completa, com catálogo, carrinho, checkout e pagamentos, pronta para vender 24 horas por dia.",
    benefits: ["Catálogo e carrinho de compras", "Pagamento por PIX, cartão e boleto", "Gestão de pedidos e estoque", "Cupons e promoções", "Entrega de produtos digitais"],
    deliveryTime: "20 a 40 dias úteis",
    startingPriceCents: 350000,
  },
  {
    slug: "sistema-personalizado",
    name: "Sistema Personalizado",
    homeLabel: "Sistemas personalizados",
    icon: "Code2",
    quoteType: "SYSTEM",
    featured: true,
    sortOrder: 4,
    shortDescription: "Sistema desenvolvido de acordo com a necessidade do cliente.",
    description: "Sistemas web sob medida para automatizar processos, organizar informações e dar controle total da operação do seu negócio.",
    benefits: ["Desenvolvido para o seu processo", "Acesso por login e níveis de permissão", "Relatórios e painéis de indicadores", "Integrações com outras ferramentas", "Escalável e seguro"],
    deliveryTime: "A combinar, conforme o escopo",
    startingPriceCents: null,
  },
  {
    slug: "aplicativo",
    name: "Aplicativo",
    homeLabel: "Aplicativos modernos",
    icon: "Smartphone",
    quoteType: "APP",
    featured: true,
    sortOrder: 5,
    shortDescription: "Desenvolvimento de aplicações modernas.",
    description: "Aplicativos web e mobile modernos, rápidos e intuitivos, que levam o seu negócio para o bolso do cliente.",
    benefits: ["Experiência de uso fluida", "Funciona no celular e no computador", "Notificações e integrações", "Arquitetura preparada para crescer", "Suporte na publicação"],
    deliveryTime: "A combinar, conforme o escopo",
    startingPriceCents: null,
  },
  {
    slug: "design",
    name: "Design",
    homeLabel: "Design criativo",
    icon: "Palette",
    quoteType: "DESIGN",
    featured: true,
    sortOrder: 6,
    shortDescription: "Logos, artes, identidade visual e materiais digitais.",
    description: "Identidade visual completa e materiais digitais que fazem sua marca ser reconhecida e lembrada.",
    benefits: ["Logotipo e manual de marca", "Artes para redes sociais", "Materiais digitais e apresentações", "Arquivos editáveis entregues", "Revisões incluídas"],
    deliveryTime: "5 a 10 dias úteis",
    startingPriceCents: 25000,
  },
  {
    slug: "marketing-digital",
    name: "Marketing Digital",
    icon: "Megaphone",
    quoteType: "MARKETING",
    featured: true,
    sortOrder: 7,
    shortDescription: "Estratégias para aumentar a presença digital da empresa.",
    description: "Estratégia, conteúdo e campanhas para aumentar sua visibilidade, atrair clientes e fortalecer sua marca na internet.",
    benefits: ["Planejamento de presença digital", "Gestão de redes sociais e tráfego", "Conteúdo estratégico", "Relatórios de desempenho", "Foco em geração de contatos"],
    deliveryTime: "Mensal (recorrente)",
    startingPriceCents: null,
  },
  {
    slug: "automacao",
    name: "Automação",
    icon: "Bot",
    quoteType: "SYSTEM",
    sortOrder: 8,
    shortDescription: "Automatize tarefas repetitivas e ganhe tempo.",
    description: "Automações de atendimento, cobrança, cadastros e integrações entre sistemas para reduzir trabalho manual e erros.",
    benefits: ["Atendimento e respostas automáticas", "Integração entre sistemas", "Menos retrabalho e erros", "Mais tempo para o que importa", "Sob medida para sua rotina"],
    deliveryTime: "A combinar, conforme o escopo",
    startingPriceCents: null,
  },
  {
    slug: "manutencao-e-suporte",
    name: "Manutenção e Suporte de Sites",
    icon: "Wrench",
    quoteType: "OTHER",
    sortOrder: 9,
    shortDescription: "Seu site sempre atualizado, seguro e funcionando.",
    description: "Atualizações, correções, backups e suporte técnico contínuo para que seu site nunca fique fora do ar.",
    benefits: ["Atualizações e correções", "Backups periódicos", "Monitoramento de disponibilidade", "Alterações de conteúdo", "Suporte prioritário"],
    deliveryTime: "Mensal (recorrente)",
    startingPriceCents: 15000,
  },
];

const plans: Prisma.PlanCreateInput[] = [
  {
    name: "Plano Start",
    description: "Para quem está começando.",
    priceCents: 99000,
    billing: "ONE_TIME",
    sortOrder: 1,
    features: ["Landing page ou site de até 5 páginas", "Design responsivo", "Botão de WhatsApp integrado", "SEO básico", "Suporte por 30 dias"],
  },
  {
    name: "Plano Profissional",
    description: "Para empresas que querem crescer.",
    priceCents: 250000,
    billing: "ONE_TIME",
    highlighted: true,
    sortOrder: 2,
    features: ["Site institucional completo", "Identidade visual básica", "SEO avançado", "Painel para editar conteúdo", "Integração com redes sociais", "Suporte por 90 dias"],
  },
  {
    name: "Plano Business",
    description: "Para empresas que precisam de soluções mais completas.",
    priceCents: 49700,
    billing: "MONTHLY",
    sortOrder: 3,
    features: ["Loja virtual ou sistema personalizado", "Pagamentos online", "Área administrativa", "Manutenção e suporte prioritário", "Relatórios mensais"],
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 10 caracteres) no .env antes de rodar o seed.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", active: true } });
    await db.admin.upsert({ where: { userId: existing.id }, create: { userId: existing.id, title: "Administrador" }, update: {} });
    console.log(`✔ Usuário ${email} já existia: garantido como administrador (senha mantida).`);
  } else {
    const user = await db.user.create({
      data: {
        name: process.env.ADMIN_NAME?.trim() || "Administrador",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: "ADMIN",
        admin: { create: { title: "Administrador" } },
      },
    });
    console.log(`✔ Administrador criado: ${user.email}`);
  }

  // Conteúdo inicial: só cria se ainda não existir (não sobrescreve edições feitas no painel).
  for (const s of services) {
    await db.service.upsert({ where: { slug: s.slug }, create: s, update: {} });
  }
  if ((await db.plan.count()) === 0) {
    for (const p of plans) await db.plan.create({ data: p });
  }
  console.log(`✔ Serviços e planos iniciais prontos (edite preços e textos em Admin).`);
}

main()
  .catch((e) => {
    console.error("✖", e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
