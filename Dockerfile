# Multi-stage Dockerfile for Laravel Production
# Stage 1: Composer Dependencies
FROM composer:2.7 AS composer-builder

WORKDIR /app

# Copy composer files first for layer caching
COPY composer.json composer.lock ./
# Install production dependencies only (no app code copied here)
# Skip running Composer scripts here because the application code (artisan) is not yet present.
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

# Generate optimized autoloader (produces vendor and autoload files)
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative


# Stage 2: Node.js Assets Build
FROM node:20-alpine AS node-builder

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./

# Install dependencies (install dev deps too so we can build assets)
RUN npm ci

# Copy application code (needed for Vite build)
COPY . .
# Use vendor produced by composer-builder for any server-side dependencies
COPY --from=composer-builder /app/vendor ./vendor

# Build production assets with Vite
RUN npm run build


# Stage 3: PHP-FPM Runtime
FROM php:8.2-fpm-alpine AS php-runtime

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    mysql-client \
    bash \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mysqli \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        opcache

# Install Redis extension via PECL
RUN apk add --no-cache $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS

# Configure PHP-FPM
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.fast_shutdown=1" >> /usr/local/etc/php/conf.d/opcache.ini

# PHP production settings
RUN echo "expose_php=Off" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "memory_limit=512M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/production.ini \
    && echo "upload_max_filesize=10M" >> /usr/local/etc/php/conf.d/production.ini

# Set working directory
WORKDIR /var/www/html

# Copy vendor from composer stage and then copy application source
# This keeps the composer stage focused on dependencies and improves layer caching
COPY --from=composer-builder /app/vendor /var/www/html/vendor

# Copy application source (context) into runtime image
COPY . /var/www/html

# Copy built assets from node stage
COPY --from=node-builder /app/public/build /var/www/html/public/build

# Copy .env.example as template (actual env vars from Kubernetes ConfigMap/Secret)
# Note: .env.example is already included in the COPY from composer-builder

# Create required directories and set permissions
RUN mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/bootstrap/cache \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Create health check endpoint file
RUN echo "<?php echo 'OK';" > /var/www/html/public/health.php

# Run framework discovery scripts now that application files are present
RUN if [ -f /var/www/html/artisan ]; then \
            cd /var/www/html && php artisan package:discover --ansi || true; \
        fi

# Expose PHP-FPM port
EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD php-fpm-healthcheck || exit 1

# Run PHP-FPM
CMD ["php-fpm"]


# Stage 4: Nginx Web Server
FROM nginx:1.25-alpine AS nginx-runtime

# Copy custom Nginx configuration
COPY --chmod=644 <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /var/www/html/public;

    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_min_length 1000;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "OK\n";
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;

        # FastCGI timeouts
        fastcgi_read_timeout 300s;
        fastcgi_send_timeout 300s;
        fastcgi_connect_timeout 60s;

        # Buffer sizes
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF

# Copy application files (public directory only)
COPY --from=php-runtime --chown=nginx:nginx /var/www/html/public /var/www/html/public
COPY --from=node-builder --chown=nginx:nginx /app/public/build /var/www/html/public/build

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
