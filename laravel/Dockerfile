# syntax=docker/dockerfile:1

# Base PHP image
FROM php:8.2-fpm AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Test stage
FROM base AS test

# Set development environment
ENV APP_ENV=testing

# Copy composer files
COPY composer.json composer.lock ./

# Install dependencies (no scripts, no autoloader)
RUN composer install --prefer-dist --no-scripts --no-autoloader --no-interaction

# Copy application files
COPY . .

# Generate autoload files
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# Create .env.testing file
RUN cp .env.example .env.testing \
    && php artisan key:generate --env=testing

# Run tests
CMD ["php", "artisan", "test"]

# Production stage
FROM base AS production

# Set production environment
ENV APP_ENV=production
ENV APP_DEBUG=false

# Copy composer files
COPY composer.json composer.lock ./

# Install dependencies (no dev dependencies, no scripts, no autoloader)
RUN composer install --prefer-dist --no-dev --no-scripts --no-autoloader --no-interaction

# Copy application files
COPY . .

# Generate autoload files
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Generate the application key
RUN php artisan key:generate --force

# Cache configuration and routes
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Expose port 9000
EXPOSE 9000

# Start PHP-FPM
CMD ["php-fpm"]
