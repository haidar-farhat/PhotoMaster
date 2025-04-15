#!/bin/bash
set -e

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting server setup"

# Update package lists
sudo apt-get update

# Install required packages
sudo apt-get install -y \
    nginx \
    mysql-server \
    php8.1-fpm \
    php8.1-cli \
    php8.1-mysql \
    php8.1-mbstring \
    php8.1-xml \
    php8.1-zip \
    php8.1-curl \
    php8.1-gd \
    php8.1-bcmath \
    php8.1-intl \
    php8.1-redis \
    php8.1-common \
    php8.1-json \
    curl \
    git \
    unzip \
    nodejs \
    npm \
    redis-server

# Install Composer if not present
if ! command -v composer &> /dev/null; then
    echo "Installing Composer..."
    curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
fi

# Configure PHP settings
echo "Configuring PHP settings..."
sudo sed -i 's/memory_limit = .*/memory_limit = 512M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/upload_max_filesize = .*/upload_max_filesize = 64M/' /etc/php/8.1/fpm/php.ini
sudo sed -i 's/post_max_size = .*/post_max_size = 64M/' /etc/php/8.1/fpm/php.ini

# Configure Nginx
echo "Configuring Nginx..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

# Configure MySQL
echo "Configuring MySQL..."
sudo systemctl restart mysql

# Configure Redis
echo "Configuring Redis..."
sudo systemctl restart redis-server

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Setup completed successfully" 