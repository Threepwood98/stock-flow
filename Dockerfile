# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm prisma

# ---------- Dev dependencies ----------
FROM base AS dev-deps
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate

# ---------- Build ----------
FROM base AS build
COPY . .
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=dev-deps /app/generated ./generated
RUN pnpm run build

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=dev-deps /app/generated ./generated
COPY --from=build /app/dist ./dist

EXPOSE 5173
CMD ["pnpm", "run", "start"]
