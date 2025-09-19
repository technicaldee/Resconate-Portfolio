# Multi-stage build for Resconate Portfolio with HR Platform
FROM node:18-alpine AS frontend-builder

# Set working directory for frontend
WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy frontend source files
COPY . .

# Build Tailwind CSS
RUN mkdir -p dist
RUN npm run build:prod

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --only=production

# Copy server source files
COPY server/ ./

# Copy built frontend files from builder stage
COPY --from=frontend-builder /app/ /app/frontend/

# Create uploads directory
RUN mkdir -p uploads

# Expose port 3001 (as configured in server)
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the server
CMD ["npm", "start"]