# Multi-stage Dockerfile supporting Development and Production environments

# ==========================================
# Stage 1: Installer - Resolve dependencies
# ==========================================
FROM node:20-alpine AS deps
# Add libc6-compat for compatibility with native dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package config files
COPY package.json package-lock.json* ./
COPY .npmrc ./

# Install all dependencies (both prod and dev dependencies are required for building)
RUN npm ci

# ==========================================
# Stage 2: Development - Dev runner with hot-reloads
# ==========================================
FROM node:20-alpine AS development
WORKDIR /app

# Copy node_modules from deps stage and application files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate local Prisma Client types
RUN npx prisma generate

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runs Next.js hot-reloading development server
CMD ["npm", "run", "dev"]

# ==========================================
# Stage 3: Builder - Compile production code
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies and source files
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client and static Swagger documentation before compiling
RUN npx prisma generate
RUN npx tsx scripts/generate-swagger.ts
RUN npm run build

# ==========================================
# Stage 4: Runner - Ultra-lightweight production server
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create unprivileged system user for running nextjs securely
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static media folder
COPY --from=builder /app/public ./public

# Setup folder permissions for Next.js caching
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy optimized Next.js standalone build output files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# In standalone mode, Next.js generates a node server.js script that runs the server directly
CMD ["node", "server.js"]
