FROM node:16-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with --legacy-peer-deps to handle potential peer dependency issues
RUN npm install --legacy-peer-deps

# Copy all source files
COPY . .

# Korrigierte Umgebungsvariablen für das neue URL-Schema
ENV NODE_ENV=production
ENV REACT_APP_API_URL=/api

# Build the application
RUN npm run build

# Keep container running to preserve the volume with the build output
CMD ["sh", "-c", "echo 'Frontend built successfully!' && tail -f /dev/null"]
