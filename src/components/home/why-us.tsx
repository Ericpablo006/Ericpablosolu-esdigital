import { Cpu, Headphones, LineChart, Palette, Ruler, UserCheck } from "lucide-react";

const ITEMS = [
  { icon: UserCheck, title: "Atendimento personalizado", text: "Você conversa direto com quem desenvolve. Cada projeto começa entendendo o seu negócio, não aplicando um molde." },
  { icon: Cpu, title: "Tecnologia moderna", text: "Ferramentas atuais, código organizado e arquitetura preparada para crescer junto com a sua empresa." },
  { icon: Ruler, title: "Projetos sob medida", text: "Nada de solução genérica: desenhamos o que faz sentido para o seu objetivo, prazo e orçamento." },
  { icon: Palette, title: "Design profissional", text: "Identidade visual e interfaces elegantes, pensadas para passar credibilidade e converter." },
  { icon: Headphones, title: "Suporte", text: "Acompanhamento pela Área do Cliente e manutenção contínua depois da entrega." },
  { icon: LineChart, title: "Foco em resultados", text: "Cada decisão é guiada por métricas simples: mais contatos, mais vendas, menos retrabalho." },
];

export function WhyUs() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ITEMS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="card card-hover p-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neon-2/30 bg-neon/15 text-sky shadow-[0_0_24px_-4px_rgb(29_107_255_/_0.6)]">
            <Icon className="h-6 w-6" aria-hidden />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-steel">{text}</p>
        </div>
      ))}
    </div>
  );
}
