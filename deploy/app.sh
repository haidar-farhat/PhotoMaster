#!/bin/bash
set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <db_username> <db_password>"
    exit 1
fi

DB_USERNAME=$1
DB_PASSWORD=$2

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting application setup"

# Create necessary directories
sudo mkdir -p /var/www/photomaster/laravel/storage
sudo mkdir -p /var/www/photomaster/laravel/bootstrap/cache
sudo mkdir -p /var/www/photomaster/electron-react/build

# Set permissions
sudo chown -R www-data:www-data /var/www/photomaster
sudo chmod -R 775 /var/www/photomaster/laravel/storage
sudo chmod -R 775 /var/www/photomaster/laravel/bootstrap/cache

# Create .env file for Laravel
cat > /var/www/photomaster/laravel/.env << EOF
APP_NAME=PhotoMaster
APP_ENV=production
APP_KEY=base64:$(openssl rand -base64 32)
APP_DEBUG=false
APP_URL=http://13.39.161.145

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=photomaster
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
EOF

# Create .env file for React
cat > /var/www/photomaster/electron-react/.env << EOF
REACT_APP_API_URL=http://13.39.161.145/api
REACT_APP_APP_NAME=PhotoMaster
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application setup completed successfully" 