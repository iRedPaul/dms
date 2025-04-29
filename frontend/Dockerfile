FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with --legacy-peer-deps to handle potential peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

# Korrigierte Umgebungsvariablen für das neue URL-Schema
ENV REACT_APP_API_URL=/api
ENV NODE_ENV=production

# Start the development server
CMD ["npm", "start"]
