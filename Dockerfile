# syntax=docker/dockerfile:1

# This is a placeholder Dockerfile for the root of the project
# It enables building both Laravel and React applications together

# Multi-stage build for PhotoMaster application
FROM php:8.0-apache as backend

# Install PHP dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    default-mysql-client \
    gnupg

# Remove existing Node.js installation
# Replace with:
# Install Node.js 16.x
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@8

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Configure Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

# Set up Laravel backend
WORKDIR /var/www/html
COPY laravel/ .
RUN composer install --no-dev --optimize-autoloader
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Configure Apache DocumentRoot
RUN sed -i 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf

# Set up Electron-React frontend
WORKDIR /app
COPY electron-react/ .
RUN npm install

# Expose ports
EXPOSE 80 3000

# Create startup script
WORKDIR /
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

# Production stage - importing from laravel and electron-react
FROM photomaster-laravel:latest AS laravel-prod
FROM photomaster-electron-react:latest AS react-prod

# Final production image
FROM nginx:alpine AS production

# Copy assets from both applications
COPY --from=laravel-prod /var/www/html /var/www/html
COPY --from=react-prod /usr/share/nginx/html /usr/share/nginx/html

# This Dockerfile is primarily used as a reference point for the docker/build-push-action
# The actual build process happens in the GitHub Actions workflow
# See laravel/Dockerfile and electron-react/Dockerfile for the actual build definitions