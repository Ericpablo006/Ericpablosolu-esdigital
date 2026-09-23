// Prepara o ambiente LOCAL: cria o arquivo .env com segredos aleatórios (nada é enviado para lugar nenhum).
// Uso: npm run setup
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

if (existsSync(".env")) {
  console.log("\n✔ O arquivo .env já existe — nada foi alterado.\n  (Apague-o e rode `npm run setup` de novo se quiser recomeçar.)\n");
  process.exit(0);
}

// Sem terminal interativo (CI/pipe), usa variáveis de ambiente ou os padrões, sem perguntar.
const interactive = Boolean(stdin.isTTY);
const rl = interactive ? readline.createInterface({ input: stdin, output: stdout }) : null;
const ask = async (q, def) => (rl ? (await rl.question(`${q}${def ? ` [${def}]` : ""}: `)).trim() || def : def);

console.log("\nConfiguração inicial — Eric Pablo Soluções Digitais\n");
const adminName = await ask("Seu nome (administrador)", process.env.ADMIN_NAME || "Eric Pablo");
const adminEmail = await ask("Seu e-mail de administrador", process.env.ADMIN_EMAIL || "admin@localhost.dev");
const port = await ask("Porta do site", process.env.PORT || "3000");
rl?.close();

const secret = randomBytes(48).toString("base64url");
const adminPassword = `Ep!${randomBytes(9).toString("base64url")}`;

let env = readFileSync(".env.example", "utf8");
const set = (key, value) => {
  env = env.replace(new RegExp(`^${key}=.*$`, "m"), `${key}="${value}"`);
};
set("AUTH_SECRET", secret);
set("APP_URL", `http://localhost:${port}`);
set("ADMIN_NAME", adminName);
set("ADMIN_EMAIL", adminEmail);
set("ADMIN_PASSWORD", adminPassword);
set("PAYMENT_PROVIDER", "sandbox"); // local: permite simular pagamentos. Em produção use "manual".
writeFileSync(".env", env, { mode: 0o600 });

console.log(`
✔ Arquivo .env criado.

  Administrador:  ${adminEmail}
  Senha inicial:  ${adminPassword}
  (anote agora — depois do primeiro login, troque em "Meu perfil")

Próximos passos:
  1) npm run db:local     ← em um terminal separado (PostgreSQL local, deixe aberto)
  2) npm run db:deploy    ← cria as tabelas
  3) npm run db:seed      ← cria o administrador, serviços e planos
  4) npm run db:seed:demo ← (opcional) produtos e portfólio de exemplo
  5) npm run dev          ← abre em http://localhost:${port}
`);
