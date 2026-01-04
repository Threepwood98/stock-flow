# Etapa 1: Base con pnpm
FROM node:22-slim AS base

# Instalar pnpm y OpenSSL (necesario para Prisma)
RUN apt-get update -y && \
    apt-get install -y openssl && \
    npm install -g pnpm

# Etapa 2: Dependencias
FROM base AS dependencies

WORKDIR /app

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias (incluye prisma CLI)
RUN pnpm install --frozen-lockfile

# Etapa 3: Build
FROM base AS build

WORKDIR /app

# Copiar node_modules desde dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Establecer DATABASE_URL dummy para generar Prisma Client
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Generar Prisma Client
RUN pnpm prisma generate

# Build de la aplicación
RUN pnpm run build

# Etapa 4: Producción
FROM base AS production

WORKDIR /app

COPY package.json ./
COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated
COPY --from=build /app/app ./app
COPY --from=build /app/types ./types
COPY --from=build /app/build ./build
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json


# Exponer puerto
EXPOSE 3000

# Comando de inicio: migrar y arrancar
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]