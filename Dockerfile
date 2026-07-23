# ============================================================
# Stage 1: Build Frontend
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ============================================================
# Stage 2: Build Backend
# ============================================================
FROM node:20-alpine AS backend-builder

RUN apk add --no-cache openssl

WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 3: Production Image
# ============================================================
FROM node:20-alpine

RUN apk add --no-cache openssl curl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy backend production artifacts
COPY --from=backend-builder --chown=appuser:appgroup /backend/dist ./dist
COPY --from=backend-builder --chown=appuser:appgroup /backend/node_modules ./node_modules
COPY --from=backend-builder --chown=appuser:appgroup /backend/prisma ./prisma
COPY --from=backend-builder --chown=appuser:appgroup /backend/package.json ./

# Copy frontend static build
COPY --from=frontend-builder --chown=appuser:appgroup /frontend/dist ./public

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
