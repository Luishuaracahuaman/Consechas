# ==========================================
# Etapa 1: Compilación del Frontend (Svelte 5)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/svelte-dapp

# Copiar archivos de dependencias del frontend
COPY svelte-dapp/package*.json ./
RUN npm install

# Copiar código fuente y compilar bundle de producción
COPY svelte-dapp/ ./
RUN npm run build

# ==========================================
# Etapa 2: Entorno de Producción
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar dependencias y código del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

COPY backend/ ./backend/

# Copiar el frontend compilado desde la etapa 1
COPY --from=frontend-builder /app/svelte-dapp/dist ./svelte-dapp/dist

# Exponer el puerto de la DApp
EXPOSE 3000

# Iniciar servidor Express (sirve API + Web3 DApp)
WORKDIR /app/backend
CMD ["node", "server.js"]
