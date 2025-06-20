# Railway deployment Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with Railway-specific build script
RUN node build-railway.js

# Remove dev dependencies after build
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the application with explicit module resolution
CMD ["node", "--experimental-modules", "--es-module-specifier-resolution=node", "dist/index.js"]