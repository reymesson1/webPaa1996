# ==========================================
# DocIntel AI Backend - Multi-stage Dockerfile
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Security: create and run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist
COPY src/database/schema.sql ./dist/database/schema.sql

# Create persistent data directory and set permissions
RUN mkdir -p /app/.data && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
