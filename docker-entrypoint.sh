#!/bin/bash

# Start Apache in background
service apache2 start

# Wait for MySQL (with proper credentials)
while ! mysqladmin ping -h"mysql" -u"photomaster" -p"photomaster" --silent; do
    sleep 1
done

# Run migrations
php /var/www/html/artisan migrate:fresh --seed
php /var/www/html/artisan storage:link

# Start frontend with correct Node options
cd /app
export NODE_OPTIONS=--openssl-legacy-provider
npm start