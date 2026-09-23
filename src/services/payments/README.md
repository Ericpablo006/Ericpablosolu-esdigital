# Pagamentos — arquitetura

Tudo que fala com pagamento passa por uma interface única (`PaymentProvider`, em `types.ts`).
O provedor ativo é escolhido pela variável de ambiente `PAYMENT_PROVIDER`.

| Provedor  | Uso                                                                                         |
|-----------|---------------------------------------------------------------------------------------------|
| `manual`  | **Padrão para produção.** PIX com QR Code/“copia e cola” gerado com a sua chave PIX. Você confirma o recebimento em *Admin → Pedidos*. |
| `webhook` | Igual ao manual, mas também aceita eventos assinados (HMAC) em `POST /api/webhooks/payments/webhook`, para ligar um gateway ou automação. |
| `sandbox` | Somente testes: simula PIX/cartão/boleto e aprova com um clique. Bloqueado com `NODE_ENV=production`. |

## Fluxo

1. `createOrder()` (`services/orders.ts`) cria o pedido + um `Payment` `PENDING` e chama `provider.createCharge()`.
2. A tela `/pedido/[número]` exibe os dados da cobrança (PIX, boleto, link…).
3. Quando o pagamento é aprovado — pelo webhook ou pelo admin — `confirmPayment()` (`confirm.ts`):
   marca o pagamento `APPROVED`, o pedido `PAID` e **só então** cria os registros de `Download`.
4. A rota `/api/downloads/[id]` só entrega o arquivo se o pedido estiver `PAID`.

## Integrando um gateway (Mercado Pago, Asaas, Stripe, Pagar.me…)

1. Crie `services/payments/meugateway.ts` exportando um `PaymentProvider`:
   - `createCharge()` chama a API do gateway (chave em `process.env`, **nunca** no frontend) e devolve
     `providerRef` (id da cobrança no gateway) e os dados exibíveis (`pixPayload`, `boletoLine`, `checkoutUrl`).
   - `parseWebhook()` valida a assinatura do webhook e devolve `{ providerRef, status }`.
2. Registre-o no objeto `registry` em `index.ts`.
3. Configure `PAYMENT_PROVIDER=meugateway` e as chaves no ambiente.
4. Cadastre no painel do gateway a URL `https://SEU_DOMINIO/api/webhooks/payments/meugateway`.

O restante (pedido, downloads, notificações, financeiro) funciona sem alterações.
