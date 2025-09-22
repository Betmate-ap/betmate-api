# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc .npmrc

# Pass token at build time to authenticate to npm.pkg.github.com
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}

# Install production dependencies only, avoid husky
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install all deps (including devDependencies)
COPY package*.json ./
COPY .npmrc .npmrc
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}

# Install with optimizations for constrained environments
RUN npm ci --ignore-scripts --maxsockets=1 --prefer-offline

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

# Copy built application and dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./

# Copy generated Prisma client from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Switch to non-root user
USER nextjs

EXPOSE 4000

# Use npm start to run prestart hooks and the app
CMD ["npm", "run", "start"]
