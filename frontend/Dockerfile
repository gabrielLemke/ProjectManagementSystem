# ==========================================
# Estágio 1: Build do Bundle React com Vite
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Argumento para injetar a URL da API em tempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# Estágio 2: Servidor Web Nginx de Alta Performance
# ==========================================
FROM nginx:1.27-alpine AS runner

# Copia os arquivos estáticos gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia as configurações do Nginx com suporte a SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
