# Eric Pablo Soluções Digitais — Site, Loja e Painel

> **Ideias que viram resultados** · *Seu projeto, nossa tecnologia*

Plataforma completa para a **Eric Pablo Soluções Digitais** captar clientes, vender produtos digitais e serviços e administrar projetos — não é apenas um site estático:

| Área | O que faz |
|------|-----------|
| **Site público** | Home, Serviços, Produtos, Portfólio, Planos, Sobre, Contato, botão flutuante de WhatsApp, SEO |
| **Orçamento interativo** | “Monte seu orçamento” em 3 passos → grava no banco e aparece no painel |
| **Loja de produtos digitais** | Catálogo, página do produto, avaliações, carrinho, cupons, checkout, PIX (QR Code + copia e cola), entrega **só após pagamento confirmado** |
| **Área do Cliente** | Visão geral, pedidos, projetos (status, prazo, valor, progresso), orçamentos, pagamentos/recibos, downloads, suporte (chamados), perfil |
| **Painel administrativo** | Dashboard com gráficos, clientes, produtos, serviços, pedidos, orçamentos, projetos, financeiro (Hoje/Semana/Mês/Ano/Período), recibos em PDF, portfólio, planos, cupons, suporte e configurações |

Tudo o que aparece no site (produtos, serviços, planos, portfólio, textos, logo, contatos) vem do **banco de dados** e é editável no painel — sem mexer no código.

---

## Sumário

1. [Stack](#stack)
2. [Instalação rápida (local)](#instalação-rápida-local)
3. [Primeiro acesso e o que configurar](#primeiro-acesso-e-o-que-configurar)
4. [Variáveis de ambiente](#variáveis-de-ambiente)
5. [Banco de dados](#banco-de-dados)
6. [Pagamentos](#pagamentos)
7. [Logo e identidade visual](#logo-e-identidade-visual)
8. [Segurança](#segurança)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Testes e verificação](#testes-e-verificação)
11. [Como publicar](#como-publicar)
12. [Limitações conhecidas e próximos passos](#limitações-conhecidas-e-próximos-passos)

---

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS 4** (design system próprio: preto, azul elétrico, azul escuro, branco e prata)
- **PostgreSQL** + **Prisma 6** (ORM, migrations versionadas)
- Autenticação própria: **bcrypt** (custo 12) + sessão **JWT (jose)** em cookie `httpOnly`
- **Zod** (validação), **pdf-lib** (recibos em PDF), **qrcode** (PIX), **nodemailer** (e-mail), **lucide-react** (ícones)
- Requisitos: **Node.js 20.9+** (testado no Node 24) e npm

---

## Instalação rápida (local)

Você **não precisa instalar o PostgreSQL** para desenvolver: o projeto traz um banco local pronto.

```bash
# 1) dependências
npm install

# 2) cria o .env com segredos aleatórios e uma senha de admin (anote-a!)
npm run setup

# 3) em OUTRO terminal, deixe aberto: sobe o PostgreSQL local (dados em ~/.ep-digital-db)
npm run db:local

# 4) cria as tabelas
npm run db:deploy

# 5) cria o administrador + serviços e planos iniciais
npm run db:seed

# 6) (opcional) produtos e portfólio de EXEMPLO, para ver a loja funcionando
npm run db:seed:demo

# 7) abre o site
npm run dev            # http://localhost:3000
```

- Site: `http://localhost:3000` · Painel: `http://localhost:3000/admin/login`
- Entre com o e-mail/senha que o `npm run setup` mostrou.
- Já tem PostgreSQL (ou Neon/Supabase)? Pule o passo 3 e ajuste a `DATABASE_URL` no `.env`.

> **Dados de exemplo:** `npm run db:seed:demo` cria produtos/portfólio fictícios (marcados como “exemplo”) e o cupom `BEMVINDO10`. Apague-os em *Admin → Produtos / Portfólio / Cupons* antes de publicar. **Nunca rode o seed de demonstração em produção** (ele recusa rodar com `NODE_ENV=production`).

---

## Primeiro acesso e o que configurar

Entre em **Admin → Configurações** e preencha (o dashboard mostra um aviso enquanto faltar):

1. **Logo** (upload) — aparece no cabeçalho, login, painel, rodapé e recibos.
2. **WhatsApp, e-mail, Instagram** — alimentam o botão flutuante, contatos, rodapé e recibos.
3. **Chave PIX + nome do recebedor** — o checkout gera QR Code/“copia e cola” automaticamente.
4. **CNPJ/CPF e cidade** da empresa — usados nos recibos e no PIX.
5. Textos da Home, Sobre, missão/visão/valores e descrição SEO.

Depois revise **Serviços** e **Planos**: os **preços iniciais que vêm do seed são apenas exemplos** — ajuste (ou zere para exibir “Solicite orçamento”).

### Gerentes (ver os pedidos de qualquer lugar)

O perfil **Gerente** enxerga **todos os pedidos** em tempo real, de qualquer navegador ou aparelho, porque os pedidos ficam no banco de dados do servidor.

- **Cadastrar:** *Admin → Gerentes* → nome, e-mail e senha inicial. Dá para redefinir a senha, desativar (derruba a sessão na hora) e excluir.
- **Entrar:** pelo **mesmo login do cliente** (`/entrar`). O sistema reconhece o perfil e leva o gerente para `/gerente/pedidos`.
- **O que ele vê:** lista de pedidos (busca por nº/nome/e-mail, filtro por status, totais), detalhes de cada pedido (itens, valores, pagamentos, contato do comprador com botão de WhatsApp) e “Minha conta” (trocar a senha).
- **O que ele não faz:** confirmar/cancelar/estornar pagamentos, editar qualquer coisa, ver CPF/CNPJ, links de download, finanças ou configurações. Todas as telas e ações de admin exigem o papel `ADMIN` (middleware + verificação no banco); `/cliente` redireciona o gerente para `/gerente`.
- **Atualização de bancos já existentes:** rode `npm run db:deploy` (aplica a migração `manager_role`, que adiciona o papel `MANAGER`).

---

## Variáveis de ambiente

Copie `.env.example` para `.env` (ou use `npm run setup`). **Nunca versione o `.env` nem coloque chaves no frontend.**

| Variável | Para quê |
|----------|----------|
| `DATABASE_URL` | Conexão PostgreSQL |
| `AUTH_SECRET` | Assina as sessões (≥ 32 caracteres aleatórios) |
| `APP_URL` | URL pública (sem `/` final): links de e-mail, sitemap, Open Graph, cookies `Secure` (quando `https://`) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Administrador criado pelo `npm run db:seed` (senha ≥ 10 caracteres) |
| `PAYMENT_PROVIDER` | `manual` (produção) · `sandbox` (só testes) · `webhook` |
| `PAYMENT_WEBHOOK_SECRET` | Segredo HMAC dos webhooks |
| `SMTP_*`, `MAIL_FROM` | Envio de e-mail (recuperação de senha, avisos). Sem SMTP, os e-mails aparecem no console |
| `UPLOAD_DIR` | Pasta de imagens e arquivos privados (use volume persistente em produção) |
| `POSTGRES_PASSWORD` | Somente para o `docker-compose.yml` |

---

## Banco de dados

**Modelo** (`prisma/schema.prisma`): `users`, `customers`, `admins`, `products`, `services`, `orders`, `order_items`, `payments`, `quotes`, `projects`, `portfolio`, `plans`, `support_tickets`, `messages`, `coupons`, `downloads`, `settings` — mais `receipts`, `product_reviews`, `contact_messages`, `notifications`, `password_reset_tokens` e `rate_limits`. Valores monetários ficam em **centavos** (inteiros).

Comandos:

| Comando | Uso |
|---------|-----|
| `npm run db:local` | PostgreSQL local para desenvolvimento (sem instalar nada) |
| `npm run db:migrate` | **Desenvolvimento**: cria/aplica novas migrations após editar o `schema.prisma` |
| `npm run db:deploy` | **Produção**: aplica as migrations existentes |
| `npm run db:seed` | Administrador + serviços + planos (não sobrescreve edições) |
| `npm run db:studio` | Interface visual do banco |

**Banco em produção** — qualquer PostgreSQL 14+: [Neon](https://neon.tech), [Supabase](https://supabase.com), Railway, Render, AWS RDS ou o do `docker-compose.yml`. Use a URL de conexão no `DATABASE_URL` (com `?sslmode=require` quando o provedor exigir), rode `npm run db:deploy` e depois `npm run db:seed`.

---

## Pagamentos

A arquitetura é desacoplada (`src/services/payments/`): pedido → cobrança → confirmação → liberação do download.

- **`manual` (recomendado para começar):** o checkout gera **PIX real** (QR Code + copia e cola) com a sua chave. O cliente paga e você confirma em *Admin → Pedidos → Confirmar pagamento* (o cliente pode enviar o comprovante pelo WhatsApp). Cartão e boleto aparecem como “Em breve”.
- **`sandbox`:** simula PIX/cartão/boleto com um botão “Simular pagamento aprovado”. **É bloqueado automaticamente em produção.**
- **`webhook`:** igual ao manual, mas aceita eventos assinados (HMAC-SHA256) em `POST /api/webhooks/payments/webhook` — para ligar um gateway ou automação (n8n, Make…).
- **Gateway próprio (Mercado Pago, Asaas, Stripe, Pagar.me…):** implemente a interface `PaymentProvider` e registre-a — passo a passo em [`src/services/payments/README.md`](src/services/payments/README.md). O restante do sistema não muda.

**Regra de ouro:** produtos digitais só são liberados quando o pagamento fica `APPROVED` (rota `/api/downloads/[id]` valida dono, pedido pago e limite de downloads). Estornos revogam o acesso.

**Recibos:** *Admin → Pagamentos → Recibos de serviço* gera PDF com a identidade da empresa. É um **recibo/comprovante comercial — não é Nota Fiscal eletrônica**. Emissão fiscal exige integração própria (ex.: NFe.io, Focus NFe, eNotas) e pode ser adicionada depois.

---

## Logo e identidade visual

Nenhum arquivo de logo foi enviado junto com o pedido, então o projeto usa um **monograma “EP” vetorial** provisório (`src/assets/brand.ts`). Para usar a logo oficial: **Admin → Configurações → Logo** (PNG/JPG/WEBP, fundo transparente). Ela passa a valer no site, login, painel, rodapé e PDFs — sem alterar código. O favicon fica em `src/app/icon.svg` (substitua por um arquivo seu).

Cores e efeitos ficam em `src/styles/globals.css` (bloco `@theme`).

---

## Segurança

Implementado:

- Senhas com **bcrypt (custo 12)**; nunca em texto puro. Mensagens de login genéricas e tempo de resposta equalizado (dificulta enumeração de e-mails).
- Sessão em **JWT assinado** (`httpOnly`, `SameSite=Lax`, `Secure` em HTTPS), revalidada no banco a cada requisição: desativar conta ou trocar senha **derruba as sessões** existentes (`tokenVersion`).
- **Autorização por papel** em três camadas: middleware (rápido) → `requireAdmin()`/`requireUser()` nas páginas → checagem dentro de **cada Server Action/rota de API**. Admin em rota separada (`/admin/login`), que recusa contas de cliente.
- **Validação** de todas as entradas com Zod; preços/totais **sempre recalculados no servidor** (o navegador só envia IDs e quantidades).
- **SQL Injection:** somente consultas parametrizadas (Prisma / `$queryRaw` com template). **XSS:** React escapa tudo; sem `dangerouslySetInnerHTML` além de JSON-LD escapado; **CSP**, `X-Frame-Options`, `nosniff`, HSTS e `Referrer-Policy` ativos.
- **Rate limiting** persistido no banco (login por IP e e-mail, cadastro, recuperação de senha, contato, orçamento, chamados, pedidos, uploads).
- **Uploads:** só administradores; tipo verificado pelos **bytes** (não pela extensão), limite de tamanho, nomes aleatórios, SVG bloqueado, lista de extensões permitidas; arquivos de produtos ficam **fora** da pasta pública e só saem pela rota autorizada.
- CSRF: Server Actions checam `Origin`; rotas de API com cookie checam mesma origem. Redirecionamentos (`?next=`) só aceitam caminhos internos.
- Recuperação de senha com token aleatório de uso único, **guardado apenas como hash SHA-256**, validade de 1 hora.
- Segredos somente em variáveis de ambiente (nada de chaves no frontend).

Recomendado ao publicar: HTTPS obrigatório, `PAYMENT_PROVIDER=manual`, senha de admin forte, backups do banco e do volume de uploads, e (se houver vários servidores atrás de proxy) confirmar que o proxy define `X-Forwarded-For` corretamente para o rate limit por IP.

---

## Estrutura do projeto

```
prisma/                 schema.prisma, migrations, seed.ts (base) e seed-demo.ts (exemplo)
scripts/                setup.mjs (cria .env), dev-db.mjs (PostgreSQL local), smoke.mjs (teste de fumaça)
tests/                  testes unitários (Vitest)
src/
  app/                  rotas (App Router)
    (site)/             páginas públicas: home, serviços, produtos, portfólio, planos, sobre, contato,
                        orçamento, carrinho, checkout, pedido
    (auth)/             entrar, cadastro, esqueci/redefinir senha
    cliente/            Área do Cliente
    admin/              login administrativo e painel (grupo (panel))
    api/                upload, downloads protegidos, recibos em PDF, webhooks de pagamento
    uploads/            serve as imagens enviadas
  actions/              Server Actions (auth, checkout, orçamento, suporte, admin/*)
  components/           ui/, forms/, layout/, brand/, dashboard/, admin/, shop/, quote/, home/…
  services/             regras de negócio: orders, catalog, payments/*, finance, dashboard, receipt-pdf, mail…
  lib/                  db, auth (senha/sessão), storage, settings, rate-limit, validação, seo…
  utils/                dinheiro, datas, PIX (BR Code), valor por extenso, CPF/CNPJ…
  types/                rótulos/constantes de enums
  assets/               marca vetorial padrão
  styles/               globals.css (design system)
```

---

## Testes e verificação

```bash
npm run typecheck   # TypeScript
npm test            # testes unitários (dinheiro, PIX/CRC16, CPF/CNPJ, extenso, promoções, períodos…)
npm run build       # build de produção
npm start &         # sobe o build
npm run smoke       # rotas públicas, proteção de áreas restritas, cabeçalhos de segurança
```

O `smoke` aceita `SMOKE_URL=https://seusite.com.br npm run smoke` para checar o site publicado.

---

## Como publicar

### Opção A — VPS/servidor próprio com Docker (recomendada: uploads e banco persistentes)

```bash
cp .env.example .env         # preencha AUTH_SECRET, ADMIN_*, APP_URL=https://seudominio.com.br,
                             # POSTGRES_PASSWORD, PAYMENT_PROVIDER=manual, SMTP_*
docker compose up -d --build
docker compose run --rm migrate                       # aplica as migrations
docker compose run --rm migrate npm run db:seed       # cria admin + conteúdo inicial
```

Coloque um proxy HTTPS (Caddy é o mais simples) na frente da porta `3000`. Faça backup dos volumes `pgdata` e `uploads`.

### Opção B — Railway / Render / Fly.io

Crie um serviço a partir do repositório e um PostgreSQL gerenciado; configure as variáveis do `.env.example`; comando de build `npm run build`, de start `npm start`, e rode `npm run db:deploy` + `npm run db:seed` uma vez. **Anexe um volume persistente** em `UPLOAD_DIR` (ex.: `/data/storage`).

### Opção C — Vercel + Neon (mais simples para começar)

O disco da Vercel não é persistente, então os uploads (logo, imagens, arquivos de produto) vão para a **Vercel Blob** automaticamente — não precisa trocar nenhum código, é só ativar e colar o token (veja o passo 4).

1. **Banco de dados:** crie uma conta grátis em [neon.tech](https://neon.tech), crie um projeto e copie a "Connection string" (formato `postgresql://usuario:senha@host/banco?sslmode=require`). Essa é a sua `DATABASE_URL`.
2. **Repositório:** suba a pasta `ep-digital` para um repositório no GitHub (a Vercel importa direto de lá).
3. **Projeto na Vercel:** em [vercel.com](https://vercel.com), "Add New → Project", importe o repositório. Framework = Next.js (detecta sozinho). Não clique em "Deploy" ainda — primeiro configure as variáveis de ambiente (próximo passo).
4. **Variáveis de ambiente** (Project → Settings → Environment Variables), copiando os nomes de `.env.example`:
   - `DATABASE_URL` → a connection string do Neon.
   - `AUTH_SECRET` → gere com `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.
   - `APP_URL` → o endereço que a Vercel vai te dar (ex.: `https://seu-projeto.vercel.app`) — dá para editar depois de o primeiro deploy criar o domínio.
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` → o administrador que o `db:seed` cria.
   - `PAYMENT_PROVIDER=manual`, `PAYMENT_WEBHOOK_SECRET` → gere como o `AUTH_SECRET`.
   - `SMTP_*` e `MAIL_FROM` (opcional no começo — sem isso, "esqueci minha senha" só grava no log em vez de enviar e-mail).
   - **Upload de arquivos:** em Project → Storage → Create Database → **Blob**, crie um armazenamento e conecte ao projeto. A Vercel adiciona a variável `BLOB_READ_WRITE_TOKEN` sozinha — não precisa copiar nada manualmente.
5. **Deploy:** clique em "Deploy". Ele vai instalar as dependências e rodar `npm run build` (que já inclui `prisma generate`).
6. **Criar as tabelas e o admin** (uma vez, depois do primeiro deploy): na sua máquina, com a `DATABASE_URL` do Neon num `.env` temporário, rode `npm run db:deploy` e depois `npm run db:seed`. (Alternativa sem instalar nada localmente: rode os mesmos comandos por um "Deploy Hook"/terminal da Vercel, se preferir.)
7. Acesse a URL da Vercel, entre em `/admin/login` com o e-mail e a senha definidos, e troque a senha em Configurações.

**Domínio próprio:** compre em qualquer registrador (Registro.br para `.com.br`, ou Namecheap/GoDaddy) e aponte em Project → Settings → Domains na Vercel; depois atualize `APP_URL`.

### Checklist antes de divulgar

- [ ] `APP_URL` com `https://` e domínio final
- [ ] `PAYMENT_PROVIDER=manual` e chave PIX configurada (faça um pedido de teste de R$ 1,00)
- [ ] Senha de admin trocada; conta `admin@localhost.dev` **não** existe em produção
- [ ] Dados de exemplo removidos (Produtos, Portfólio, Cupons); preços de Serviços e Planos revisados
- [ ] Logo, WhatsApp, e-mail, Instagram e CNPJ preenchidos
- [ ] SMTP configurado e recuperação de senha testada
- [ ] Backups automáticos do banco e dos uploads
- [ ] `SMOKE_URL=https://seudominio npm run smoke`

---

## Limitações conhecidas e próximos passos

- **Pagamento por cartão/boleto** exige um gateway (interface pronta, integração não incluída): hoje o fluxo real é PIX com confirmação manual ou por webhook.
- **Nota Fiscal eletrônica** não é emitida (apenas recibo comercial em PDF).
- **Upload em nuvem** (S3/R2) não incluído — veja a Opção C.
- Rate limit por IP depende do cabeçalho `X-Forwarded-For` do seu proxy.
- Sem verificação de e-mail no cadastro e sem 2FA (bons próximos passos).
