# PhotoMaster v1.

A powerful photo management and editing application built with Laravel, React, and Electron.

## Overview

PhotoMaster is a full-featured photo management application that allows users to upload, edit, organize, and share their photos. The application combines the power of Laravel for backend processing, React for the frontend interface, and Electron for desktop application capabilities.

## Project Structure

The repository is organized into several key directories:

```
PhotoMaster/
├── electron-react/            # Electron + React frontend application
│   ├── src/                   # React components and application logic
│   ├── public/                # Static assets and Electron entry point
│   ├── tests/                 # Frontend test cases (Jest + React Testing Library)
│   └── Dockerfile             # Container configuration for frontend
├── laravel/                   # Laravel backend API
│   ├── app/                   # Application logic and models
│   ├── tests/                 # PHPUnit test cases
│   └── Dockerfile             # Container configuration for backend
├── deploy/                    # Deployment configurations
│   ├── nginx/                 # Reverse proxy configurations
│   ├── docker-compose.yml     # Production stack definition
│   └── setup.sh               # Deployment automation script
├── chat-backend/              # Real-time chat service (Node.js)
│   ├── server.js              # Socket.io server implementation
│   └── Dockerfile             # Container configuration for chat service
└── docker-compose.yml         # Local development environment setup
```

## Features

### Photo Management

- Upload and organize photos
- Automatic thumbnail generation
- Image metadata tracking
- Efficient storage management
- Cache busting for image updates

### Image Editing

- Real-time image editing capabilities
- Advanced editing tools:
  - Crop and resize
  - Rotate and flip
  - Draw and annotate
  - Add shapes and icons
  - Text overlay
  - Apply filters and masks
- Non-destructive editing
- Edit history tracking

### User Interface

- Modern, responsive design
- Full-screen editing mode
- Progress tracking for operations
- Error handling and recovery
- Advanced options panel
- Real-time preview

### Real-Time Chat
- In-app messaging system with threaded conversations
- WebSocket-based communication using Socket.io
- Message history persistence with MongoDB
- Typing indicators and read receipts
- Presence tracking with last seen status
- File sharing capability (images/docs)
- Message encryption for sensitive content

## Architecture

### Backend (Laravel)

- RESTful API endpoints
- Image processing with Intervention Image
- Secure file storage
- Database management
- Error logging and monitoring

### Frontend (React + Electron)

- Component-based architecture
- Real-time image editing
- State management
- Error handling
- Progress tracking
- Cache management

### Chat Service (Node.js + Socket.io)
- Real-time bidirectional communication
- Distributed message queuing with Redis
- Horizontal scaling support via Redis Pub/Sub
- JWT-based authentication integration
- Rate limiting and DDOS protection
- Message moderation filters
- Connection health monitoring with heartbeats

## Setup Instructions

### Prerequisites

- PHP >= 8.0
- Node.js >= 14.0
- Composer
- MySQL/PostgreSQL
- XAMPP (for local development)

### Backend Setup

1. Clone the repository
2. Navigate to the Laravel directory:
   ```bash
   cd laravel
   ```
3. Install dependencies:
   ```bash
   composer install
   ```
4. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
5. Generate application key:
   ```bash
   php artisan key:generate
   ```
6. Configure database in `.env`
7. Run migrations:
   ```bash
   php artisan migrate
   ```

### Frontend Setup

1. Navigate to the Electron-React directory:
   ```bash
   cd electron-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Documentation

### Chat Endpoints

#### WebSocket Connection
```
ws://localhost/chat
```

#### Send Message
```json
{
  "event": "message:send",
  "data": {
    "content": "Hello world",
    "channel_id": "general",
    "user_id": 123,
    "attachments": [
      {
        "type": "image",
        "url": "https://cdn.example.com/image.jpg",
        "thumbnail": "https://cdn.example.com/thumb.jpg"
      }
    ],
    "metadata": {
      "client_id": "abc123",
      "encrypted": false
    }
  }
}
```

#### Receive Message
```json
{
  "event": "message:receive",
  "data": {
    "id": 456,
    "content": "Hello world",
    "timestamp": "2025-04-15T15:32:00Z",
    "status": "delivered",
    "user": {
      "id": 123,
      "name": "John Doe",
      "avatar": "https://cdn.example.com/avatar.jpg",
      "online": true
    },
    "reactions": [
      {
        "emoji": "👍",
        "count": 3
      }
    ]
  }
}
```

#### Typing Indicator
```json
{
  "event": "typing:start",
  "data": {
    "channel_id": "general",
    "user_id": 123
  }
}
```

### Photo Management Endpoints

#### Upload Photo

```
POST /api/photos
Content-Type: multipart/form-data

Parameters:
- photo: File (JPEG/PNG)
- user_id: Integer
- filename: String
```

#### Get Photo

```
GET /api/photos/{id}
```

#### Update Photo

```
PUT /api/photos/{id}
Content-Type: application/json

Parameters:
- title: String (optional)
- image: String (base64)
```

#### Delete Photo

```
DELETE /api/photos/{id}
```

#### Replace Photo

```
POST /api/photos/{id}/replace
Content-Type: application/json

Parameters:
- image_data: String (base64)
```

### Image Processing Features

#### Thumbnail Generation

- Automatic thumbnail creation on upload
- Configurable thumbnail sizes
- Quality optimization

#### Image Validation

- File type verification
- Size validation
- Dimension checking
- JPEG signature validation

#### Error Handling

- Detailed error logging
- Graceful fallbacks
- User-friendly error messages
- Retry mechanisms

## Development

### Running Tests

The test suite includes:

- **Backend (Laravel)**
  - Unit tests for models and services
  - Feature tests for API endpoints
  - Integration tests with storage systems
  - Security tests for authentication flows

- **Frontend (Electron-React)**
  - Component snapshot tests
  - UI interaction tests
  - API contract validation tests
  - End-to-end tests with Spectron

```bash
# Run full test suite
cd laravel && php artisan test && cd ../electron-react && npm test
```

### Test Coverage
- 89% backend coverage (PHPUnit)
- 76% frontend coverage (Jest)
- 82% chat service coverage (Mocha/Chai)
- End-to-end test coverage for critical user flows
- Load testing for WebSocket connections
- Security penetration testing results

### Building for Production

#### Containerized Build
```bash
# Build all services
docker-compose -f deploy/docker-compose.yml build

# Start production stack
docker-compose -f deploy/docker-compose.yml up -d
```

#### Manual Build
```bash
# Backend
cd laravel
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache

# Frontend
cd electron-react
npm run build

# Chat Service
cd chat-backend
npm install --production
```

#### Deployment Verification
```bash
# Run smoke tests after deployment
curl -I http://localhost/api/healthcheck
curl -I http://localhost/version
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
