#!/bin/sh
set -e

HOST=${DB_HOST:-mysql}
PORT=${DB_PORT:-3306}
MAX_RETRIES=30
SLEEP=2

echo "Waiting for MySQL at $HOST:$PORT..."
retries=0
until mysqladmin ping -h"$HOST" -P"$PORT" -uroot --silent; do
  retries=$((retries+1))
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "MySQL not available after $((MAX_RETRIES * SLEEP)) seconds"
    break
  fi
  sleep $SLEEP
done

if [ -f /var/www/html/artisan ]; then
  echo "Running migrations and seeders"
  php /var/www/html/artisan migrate --force || echo "artisan migrate failed"
  php /var/www/html/artisan db:seed --force || echo "artisan db:seed failed"
else
  echo "artisan not found; skipping migrations"
fi

echo "Starting php-fpm"
exec php-fpm
