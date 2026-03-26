# ─────────────────────────────────────────────
# Stage 1 — Build frontend (Vite)
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Build backend (TypeScript → JS)
# ─────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

RUN apk add --no-cache openssl

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3 — Production image
# nginx (frontend) + node (backend) via shell entrypoint
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache openssl nginx

# ── Backend deps + build ──────────────────────
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY --from=backend-builder /app/backend/dist ./dist
RUN mkdir -p uploads

# ── Frontend static files ────────────────────
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# ── Nginx config ─────────────────────────────
COPY nginx.conf /etc/nginx/http.d/default.conf

# ── Entrypoint script ─────────────────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
