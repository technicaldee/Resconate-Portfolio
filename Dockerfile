# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json files
COPY package*.json ./

# Install dependencies for build
RUN npm install

# Copy all project files
COPY . .

# Create dist directory and build Tailwind CSS
RUN mkdir -p dist
RUN npm run build:prod

# Install a simple static file server
RUN npm install -g serve

# Expose port 3000 for static serving
EXPOSE 3000

# Serve the static files
CMD ["serve", "-s", ".", "-l", "3000"]