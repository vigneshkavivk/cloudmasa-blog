# ---------- Stage 1: Install Dependencies ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# ---------- Stage 2: Production Image ----------
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ✅ Install real AWS CLI (NOT npm version)
RUN apk add --no-cache aws-cli

# Copy app
COPY --from=builder /app /app

# Create logs directory and give ownership
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

# Switch user
USER appuser

EXPOSE 3000

CMD ["node", "index.js"]
