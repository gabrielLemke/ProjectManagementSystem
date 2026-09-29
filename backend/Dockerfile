# ==========================================
# Estágio 1: Build da Aplicação
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalação de dependências do sistema necessárias para compilação
RUN apk add --no-cache openssl

# Copia arquivos de definição de dependências e schema do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies)
RUN npm ci

# Gera o Prisma Client tipado
RUN npx prisma generate

# Copia o código-fonte e compila o TypeScript
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ==========================================
# Estágio 2: Imagem Final de Produção (Runner)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

RUN apk add --no-cache openssl

# Copia package.json e instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copia os artefatos compilados do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Segurança: executa o processo com usuário sem privilégios de root
USER node

EXPOSE 3333

CMD ["node", "dist/server.js"]
