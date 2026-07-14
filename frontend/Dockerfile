# ─── Stage 1: Build React App ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bağımlılıkları önce kopyala (layer cache optimizasyonu)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Kaynak kodları kopyala ve build et
COPY . .
RUN npm run build

# ─── Stage 2: Nginx ile Serve Et ────────────────────────────────────
FROM nginx:1.27-alpine

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını nginx'e kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
