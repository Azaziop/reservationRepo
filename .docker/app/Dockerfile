# Production Dockerfile for Laravel + Vite built assets
# Multi-stage: node build -> composer install -> final runtime with nginx + php-fpm

# -------- ASSET BUILD STAGE --------
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY resources ./resources
COPY vite.config.js ./
COPY tailwind.config.js postcss.config.js ./
# Build assets (Vite will output to public/build)
COPY public ./public
RUN npm run build

# -------- DEPENDENCIES STAGE --------
FROM php:8.2-fpm-alpine AS backend
# Install system dependencies
RUN apk add --no-cache bash curl libpng-dev jpeg-dev oniguruma-dev libxml2-dev zip unzip git mysql-client
# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath
# Enable opcache
RUN docker-php-ext-install opcache && docker-php-ext-enable opcache
# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
# Copy app source (excluding node_modules, vendor not yet installed)
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader
COPY . ./
# Copy built assets from frontend stage
COPY --from=frontend /app/public/build ./public/build
# Optimize Laravel caches at build time (will be refreshed at runtime if needed)
RUN php artisan config:cache && php artisan route:cache && php artisan view:cache || true

# -------- FINAL RUNTIME STAGE --------
FROM nginx:1.27-alpine AS runtime
WORKDIR /var/www/html
# Copy application (PHP-FPM handled by sidecar container) or use single container? We'll embed php-fpm for simplicity.
# Switch to s6-overlay style? Simpler: use php-fpm + nginx in one container.
# Rebuild using php-fpm base instead for single container runtime.

# Rebuild final stage based on php-fpm + nginx
FROM alpine:3.20 AS final
RUN apk add --no-cache nginx php82 php82-fpm php82-opcache php82-mbstring php82-pdo php82-pdo_mysql php82-tokenizer php82-xml php82-fileinfo php82-bcmath php82-ctype php82-json php82-curl supervisor
WORKDIR /var/www/html
# Copy app from backend stage
COPY --from=backend /var/www/html .
# Nginx config
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf
# Supervisor config for nginx + php-fpm
COPY .docker/app/supervisord.conf /etc/supervisord.conf
# Ensure runtime dirs
RUN mkdir -p /run/nginx && chown -R root:root /run/nginx

ENV APP_ENV=production \
    APP_DEBUG=false

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
