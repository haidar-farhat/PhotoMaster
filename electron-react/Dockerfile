# syntax=docker/dockerfile:1

# Base Node image
FROM node:16-alpine AS base

# Install build dependencies for native Node modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Test stage
FROM base AS test

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Run tests
CMD ["npm", "test", "--", "--watchAll=false"]

# Build stage
FROM base AS build

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# Try npm ci first, fall back to npm install if it fails
RUN npm ci || (echo "npm ci failed, falling back to npm install..." && npm install)

# Copy application files
COPY . .

# Build app
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]