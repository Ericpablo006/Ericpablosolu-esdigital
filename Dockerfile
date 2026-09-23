# Imagem de produção (Next.js standalone). Uso típico: `docker compose up -d --build` (veja docker-compose.yml).
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV BUILD_STANDALONE=1 NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public && npx prisma generate && npx next build

# Usada pelo serviço "migrate" do docker-compose (aplica migrations e seed).
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS run
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/data/storage
RUN addgroup -S app && adduser -S app -G app && mkdir -p /data/storage && chown -R app:app /data
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
VOLUME ["/data/storage"]
CMD ["node", "server.js"]
