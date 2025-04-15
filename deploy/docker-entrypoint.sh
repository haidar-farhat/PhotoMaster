#!/bin/sh
set -e

# Initialize Laravel
cd /var/www/html
php artisan key:generate --force
php artisan storage:link
php artisan optimize:clear

# Start services
exec "$@"