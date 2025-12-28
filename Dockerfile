# =====================
# Base
# =====================
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# =====================
# Dependencies
# =====================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# =====================
# Build
# =====================
FROM base AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build

# =====================
# Runtime
# =====================
FROM node:20-alpine AS runtime
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 3000
CMD ["pnpm", "run", "start"]
