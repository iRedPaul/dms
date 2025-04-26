FROM node:18-alpine

WORKDIR /app

# Abhängigkeiten zuerst kopieren und installieren für besseres Caching
COPY package*.json ./
RUN npm install

# Restlichen Code kopieren
COPY . .

# Speicherverzeichnis erstellen
RUN mkdir -p /storage \
    /storage/invoices \
    /storage/contracts \
    /storage/reports \
    /storage/forms \
    /storage/other \
    /storage/temp

# Berechtigungen für Speicherverzeichnis setzen
RUN chmod -R 777 /storage

# Storage-Service-Port freigeben
EXPOSE 5000

# Startkommando
CMD ["node", "server.js"]