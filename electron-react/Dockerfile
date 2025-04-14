FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

# Install dependencies including the image editor packages with legacy peer deps
RUN npm install --legacy-peer-deps && \
    npm install --legacy-peer-deps tui-image-editor @toast-ui/react-image-editor

COPY . .

# Expose port 3000 for the React development server
EXPOSE 3000

# Start both the React development server and wait for the chat server
CMD ["sh", "-c", "npm run dev"]