# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /app

# Set environment variable to handle OpenSSL issue
ENV NODE_OPTIONS=--openssl-legacy-provider

# Copy package files
COPY electron-react/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY electron-react/ .

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]