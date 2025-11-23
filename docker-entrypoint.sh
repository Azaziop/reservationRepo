#!/bin/sh
set -e
# Ensure storage and bootstrap/cache are writable by www-data
if [ -d "/var/www/html/storage" ]; then
	chown -R www-data:www-data /var/www/html/storage || true
	chmod -R 775 /var/www/html/storage || true
fi
if [ -d "/var/www/html/bootstrap/cache" ]; then
	chown -R www-data:www-data /var/www/html/bootstrap/cache || true
	chmod -R 775 /var/www/html/bootstrap/cache || true
fi
# Fix permissions for Laravel view cache directory specifically
mkdir -p /var/www/html/storage/framework/views
chown -R www-data:www-data /var/www/html/storage/framework/views || true
chmod -R 775 /var/www/html/storage/framework/views || true
# Run any passed command (supervisord CMD will be appended)
exec "$@"
