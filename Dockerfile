# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# ---------- Dev dependencies ----------
FROM base AS dev-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# ---------- Build ----------
FROM base AS build
COPY . .
COPY --from=dev-deps /app/node_modules ./node_modules
RUN pnpm run build

# ---------- Prod dependencies ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------- Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# React Router 7 usa Vite preview / server
EXPOSE 5173

CMD ["pnpm", "run", "start"]
