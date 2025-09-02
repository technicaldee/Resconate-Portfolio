# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for both root and server
COPY package*.json ./
COPY server/package*.json ./server/

# Install all dependencies (including dev) for build
RUN npm install
RUN cd server && npm install --omit=dev

# Copy all project files
COPY . .

# Create dist directory and build Tailwind CSS
RUN mkdir -p dist
RUN npm run build:prod

# Clean up dev dependencies after build
RUN npm prune --omit=dev

# Create uploads directory for server
RUN mkdir -p server/uploads

# Expose the port the server runs on
EXPOSE 5000

# Set working directory to server for startup
WORKDIR /app/server

# Start the server
CMD ["npm", "start"]