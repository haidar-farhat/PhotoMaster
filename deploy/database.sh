#!/bin/bash
set -e

if [ $# -ne 3 ]; then
    echo "Usage: $0 <root_password> <db_username> <db_password>"
    exit 1
fi

ROOT_PASSWORD=$1
DB_USERNAME=$2
DB_PASSWORD=$3

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database setup"

# Create database and user
mysql -u root -p"$ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS photomaster;
CREATE USER IF NOT EXISTS '$DB_USERNAME'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON photomaster.* TO '$DB_USERNAME'@'localhost';
FLUSH PRIVILEGES;
EOF

# Configure MySQL
echo "Configuring MySQL security settings..."
sudo mysql_secure_installation << EOF
$ROOT_PASSWORD
n
y
y
y
y
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database setup completed successfully"