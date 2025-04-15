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