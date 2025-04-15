FROM php:8.1-apache

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libmagickwand-dev \
    libwebp-dev \
    libjpeg-dev \
    libxpm-dev \
    libfreetype6-dev \
    zip \
    unzip \
    && pecl install imagick \
    && docker-php-ext-enable imagick \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Create necessary directories and set permissions
RUN mkdir -p \
    bootstrap/cache \
    storage \
    storage/framework \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache

RUN chmod -R 775 storage bootstrap/cache

# Copy existing application directory contents
COPY . /var/www/html

# Install dependencies
RUN composer install --no-scripts --no-autoloader && \
    composer dump-autoload --optimize && \
    php artisan cache:clear && \
    php artisan config:clear && \
    php artisan storage:link

# Expose port 8000
EXPOSE 8000

# Start PHP server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
