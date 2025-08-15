# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install deps (needs token for GitHub Packages) ----
# Copy only manifests first for better layer caching
COPY package*.json ./
COPY .npmrc .npmrc

# Pass token at build time to authenticate to npm.pkg.github.com
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}

RUN npm ci

# ---- Build stage ----
# Copy the rest of the source
COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate && npm run build

# ---- Runtime ----
EXPOSE 4000
# Apply DB migrations at container start, then run the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
