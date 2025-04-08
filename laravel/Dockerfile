FROM php:8.0-apache

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Configure Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Create Laravel project first
RUN rm -rf /var/www/html/* && \
    composer create-project --prefer-dist laravel/laravel:^8.0 . && \
    composer install && \
    php artisan key:generate && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Configure Apache DocumentRoot
COPY apache.conf /etc/apache2/sites-available/000-default.conf