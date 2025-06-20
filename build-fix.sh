#!/bin/bash
# Build script with import.meta.dirname fix for Railway

echo "Building DAS application for Railway deployment..."

# Install dependencies
npm ci

# Build client
echo "Building client..."
npm run build

echo "Build completed successfully!"
echo "Ready for Railway deployment."