// Teste rápido de fumaça: verifica rotas públicas, proteção das áreas restritas e cabeçalhos de segurança.
// Uso: com o site rodando (npm run dev / npm start):  npm run smoke   (ou SMOKE_URL=https://seusite.com.br npm run smoke)
const base = (process.env.SMOKE_URL || "http://localhost:3100").replace(/\/$/, "");
let failures = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ${name}`);
  } catch (e) {
    failures++;
    console.log(`  ✖ ${name}\n      ${e.message}`);
  }
}
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });
const expectStatus = async (path, expected, init) => {
  const res = await get(path, init);
  const ok = Array.isArray(expected) ? expected.includes(res.status) : res.status === expected;
  if (!ok) throw new Error(`${path} → ${res.status} (esperado ${expected})`);
  return res;
};

console.log(`\nSmoke test em ${base}\n`);

console.log("Páginas públicas");
for (const p of ["/", "/servicos", "/produtos", "/portfolio", "/planos", "/sobre", "/contato", "/orcamento", "/carrinho", "/entrar", "/cadastro", "/esqueci-senha", "/admin/login", "/robots.txt", "/sitemap.xml", "/icon.svg"]) {
  await check(p, () => expectStatus(p, 200));
}
await check("404 para rota inexistente", () => expectStatus("/nao-existe-xyz", 404));
await check("404 para produto inexistente", () => expectStatus("/produtos/nao-existe-xyz", 404));

console.log("\nÁreas protegidas (sem login)");
for (const p of ["/admin", "/admin/produtos", "/admin/pedidos", "/admin/configuracoes", "/cliente", "/cliente/pedidos"]) {
  await check(`${p} redireciona`, async () => {
    const res = await expectStatus(p, [302, 303, 307, 308]);
    const loc = res.headers.get("location") || "";
    if (!/\/(admin\/login|entrar)/.test(loc)) throw new Error(`redirecionou para ${loc}`);
  });
}
await check("/checkout exige login", async () => {
  const res = await expectStatus("/checkout", [302, 303, 307, 308]);
  if (!(res.headers.get("location") || "").includes("/entrar")) throw new Error("não redirecionou ao login");
});
await check("upload bloqueado sem admin", () => expectStatus("/api/upload", [401, 403, 405], { method: "POST" }));
await check("download bloqueado sem login", () => expectStatus("/api/downloads/qualquer", [302, 303, 307, 308, 401, 404]));
await check("recibo PDF bloqueado sem login", () => expectStatus("/api/receipts/x/pdf", 401));
await check("webhook sem assinatura é rejeitado", () => expectStatus("/api/webhooks/payments/webhook", [401, 404], { method: "POST", body: "{}" }));
await check("webhook de provedor inexistente = 404", () => expectStatus("/api/webhooks/payments/nao-existe", 404, { method: "POST", body: "{}" }));
await check("uploads: path traversal bloqueado", () => expectStatus("/uploads/..%2f..%2f.env", 404));

console.log("\nSegurança");
await check("cabeçalhos de segurança", async () => {
  const res = await get("/");
  for (const h of ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "strict-transport-security"]) {
    if (!res.headers.get(h)) throw new Error(`faltando ${h}`);
  }
  if (res.headers.get("x-powered-by")) throw new Error("x-powered-by exposto");
});

console.log(failures ? `\n${failures} verificação(ões) falharam.\n` : "\nTudo certo!\n");
process.exit(failures ? 1 : 0);
