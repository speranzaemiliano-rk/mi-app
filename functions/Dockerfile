# Imagen del backend RK con navegador headless (Playwright) preinstalado.
# Se usa para el "robot propio" que importa comprobantes recibidos de ARCA.
# La imagen oficial de Playwright ya trae Chromium + todas las librerías del sistema,
# así no hay que instalar dependencias del navegador a mano.
#
# IMPORTANTE (Railway): para que Railway construya con este Dockerfile, el servicio
# tiene que tener su "Root Directory" apuntando a /functions (o el Dockerfile en la
# raíz del build). Si algo sale mal, borrá este archivo y Railway vuelve a nixpacks.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Instalar dependencias primero (mejor cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del backend
COPY . .

ENV NODE_ENV=production
# La imagen de Playwright deja los navegadores en /ms-playwright; que playwright-core los encuentre.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# El server usa process.env.PORT || 3000; Railway inyecta PORT.
CMD ["node", "server.js"]
