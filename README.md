# PhotoMaster

A powerful photo management and editing application built with Laravel, React, and Electron.

## Overview

PhotoMaster is a full-featured photo management application that allows users to upload, edit, organize, and share their photos. The application combines the power of Laravel for backend processing, React for the frontend interface, and Electron for desktop application capabilities.

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

```bash
# Backend tests
cd laravel
php artisan test

# Frontend tests
cd electron-react
npm test
```

### Building for Production

```bash
# Backend
cd laravel
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache

# Frontend
cd electron-react
npm run build
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
