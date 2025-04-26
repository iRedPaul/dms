# Build-Stage
FROM node:18-alpine as build

WORKDIR /app

# Abhängigkeiten zuerst kopieren und installieren für besseres Caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Restlichen Code kopieren und bauen
COPY . .
RUN npm run build

# Production-Stage mit Nginx
FROM nginx:alpine

# Nginx-Konfiguration kopieren
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build-Ergebnis vom Build-Stage in den Nginx-Container kopieren
COPY --from=build /app/build /usr/share/nginx/html

# Port freigeben
EXPOSE 80

# Nginx im Vordergrund starten
CMD ["nginx", "-g", "daemon off;"]