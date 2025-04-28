FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./

# Install dependencies with --legacy-peer-deps to handle potential peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

# Set environment variables for production build
ENV REACT_APP_API_URL=http://backend:4000
ENV NODE_ENV=production

# Build with the fixed environment
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Add nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
