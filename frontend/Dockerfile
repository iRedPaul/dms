FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with --legacy-peer-deps to handle potential peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

# Updated environment variables for Cloudflare Zero Trust
ENV REACT_APP_API_URL=https://dms.home-lan.cc/api
ENV NODE_ENV=production

# Start the development server
CMD ["npm", "start"]
