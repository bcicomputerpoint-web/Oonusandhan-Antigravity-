# ==========================================
# Stage 1: Build Workspace & Compile Assets
# ==========================================
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy root lockfiles and workspace configs
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
COPY packages/ui/package*.json ./packages/ui/

# Install dependencies across all workspaces
RUN npm ci

# Copy the rest of the application files
COPY . .

# Compile libraries in sequence to resolve dependency order errors
RUN npm run build --workspace=@onusandhan/types
RUN npm run db:generate --workspace=@onusandhan/db
RUN npm run build --workspace=@onusandhan/db
RUN npm run build --workspace=@onusandhan/ui

# Compile backend API
RUN npm run build --workspace=@onusandhan/api

# ==========================================
# Stage 2: Production Lightweight Runner
# ==========================================
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy lock files and package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
COPY packages/ui/package*.json ./packages/ui/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled files and required prisma artifacts from builder stage
COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/packages/db/dist ./packages/db/dist
COPY --from=builder /usr/src/app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder /usr/src/app/packages/config ./packages/config
COPY --from=builder /usr/src/app/packages/ui/dist ./packages/ui/dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose backend port
EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

# Start Fastify server
CMD ["npm", "run", "start", "--workspace=@onusandhan/api"]
