# Etapa 1: Base con pnpm
FROM node:22-slim AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Instalar OpenSSL para Prisma
RUN apt-get update -y && apt-get install -y openssl

# Etapa 2: Dependencias
FROM base AS dependencies

WORKDIR /app

# Copiar archivos de configuración de pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Etapa 3: Build
FROM base AS build

WORKDIR /app

# Copiar archivos de configuración
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar TODAS las dependencias (incluyendo devDependencies)
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Generar Prisma Client (usa prisma.config.ts para la URL)
RUN pnpm prisma generate

# Build de la aplicación
RUN pnpm run build

# Etapa 4: Producción
FROM base AS production

WORKDIR /app

# Copiar node_modules de producción
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar Prisma schema y migraciones
COPY --from=build /app/prisma ./prisma

# Copiar build de la aplicación
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json

# Copiar el cliente de Prisma generado en la ubicación personalizada
COPY --from=build /app/generated ./generated

# Copiar también el cliente generado en node_modules (por si acaso)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Exponer puerto (Railway lo asigna dinámicamente)
EXPOSE 3000

# Script de inicio: ejecutar migraciones y luego iniciar la app
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]