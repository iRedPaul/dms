FROM node:18-alpine

WORKDIR /app

# Abhängigkeiten zuerst kopieren und installieren für besseres Caching
COPY package*.json ./
RUN npm install

# Restlichen Code kopieren
COPY . .

# API-Port freigeben
EXPOSE 4000

# Startkommando
CMD ["node", "server.js"]