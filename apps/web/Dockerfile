# ==========================================
# Stage 1: Build Workspace & Compile Assets
# ==========================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy root lockfiles and workspace configs
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY packages/db/package*.json ./packages/db/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
COPY packages/ui/package*.json ./packages/ui/

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile libraries in sequence to resolve dependency order errors
RUN npm run build --workspace=@onusandhan/types
RUN npm run db:generate --workspace=@onusandhan/db
RUN npm run build --workspace=@onusandhan/db
RUN npm run build --workspace=@onusandhan/ui

# Disable telemetry data collection during Next.js build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Compile workspaces and build Next.js application
RUN npm run build --workspace=@onusandhan/web

# ==========================================
# Stage 2: Production Lightweight Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy lock files and package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY packages/db/package*.json ./packages/db/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
COPY packages/ui/package*.json ./packages/ui/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled assets from builder stage
COPY --from=builder /usr/src/app/apps/web/.next ./apps/web/.next
COPY --from=builder /usr/src/app/apps/web/public ./apps/web/public
COPY --from=builder /usr/src/app/packages/db/dist ./packages/db/dist
COPY --from=builder /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder /usr/src/app/packages/config ./packages/config
COPY --from=builder /usr/src/app/packages/ui/dist ./packages/ui/dist

# Expose Next.js default port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start Next.js server
CMD ["npm", "run", "start", "--workspace=@onusandhan/web"]
