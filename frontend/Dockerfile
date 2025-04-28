FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with --legacy-peer-deps to handle potential peer dependency issues
RUN npm install --legacy-peer-deps

COPY . .

# Default environment variables for development
ENV REACT_APP_API_URL=http://backend:4000
ENV NODE_ENV=development

# Start the development server
CMD ["npm", "start"]
