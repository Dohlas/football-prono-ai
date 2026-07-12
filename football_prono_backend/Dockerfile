FROM mcr.microsoft.com/playwright:v1.47.0-jammy

# S'assurer d'être en mode non-interactif
ENV DEBIAN_FRONTEND=noninteractive

# Désactiver le téléchargement des navigateurs car l'image de base Playwright les contient déjà
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les outils de compilation requis par node-gyp pour sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Installer uniquement les dépendances de production et compiler sqlite3 depuis les sources
RUN npm ci --omit=dev && npm rebuild sqlite3 --build-from-source

# Copier le reste de l'application
COPY . .

# Exposer le port de l'application
EXPOSE 3000

# Commande de démarrage
CMD ["node", "index.js"]
