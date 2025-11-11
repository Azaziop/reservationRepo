# 🚀 Docker Commands Cheat Sheet

## Starting & Stopping

```bash
# Start all containers in background
./vendor/bin/sail up -d

# Stop all containers
./vendor/bin/sail down

# Restart containers
./vendor/bin/sail restart

# View status of all containers
./vendor/bin/sail ps
```

## Development

```bash
# Frontend - Vite dev server (hot reload)
./vendor/bin/sail npm run dev

# Backend - Laravel dev server
./vendor/bin/sail artisan serve --host=0.0.0.0

# Production build - creates public/build/manifest.json
./vendor/bin/sail npm run build
```

## Database

```bash
# Run migrations
./vendor/bin/sail artisan migrate

# Run migrations with seed data
./vendor/bin/sail artisan migrate --seed

# Reset database (WARNING: deletes all data)
./vendor/bin/sail artisan migrate:reset

# Access MySQL CLI
./vendor/bin/sail mysql

# Show database info
./vendor/bin/sail artisan db:show
```

## Artisan Commands

```bash
# Laravel interactive shell
./vendor/bin/sail artisan tinker

# Create migration
./vendor/bin/sail artisan make:migration create_table_name

# Create model
./vendor/bin/sail artisan make:model ModelName

# Create controller
./vendor/bin/sail artisan make:controller ControllerName

# Run tests
./vendor/bin/sail artisan test

# Clear cache
./vendor/bin/sail artisan cache:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan route:clear
```

## NPM/Frontend

```bash
# Install dependencies
./vendor/bin/sail npm install

# Add a package
./vendor/bin/sail npm install package-name

# Run dev server
./vendor/bin/sail npm run dev

# Build for production
./vendor/bin/sail npm run build
```

## Logs & Debugging

```bash
# View all logs (live)
./vendor/bin/sail logs -f

# View specific service logs
./vendor/bin/sail logs -f laravel.test
./vendor/bin/sail logs -f mysql

# View logs without following
./vendor/bin/sail logs
```

## Container Management

```bash
# Build images (if Dockerfile changed)
./vendor/bin/sail build

# Rebuild everything from scratch
./vendor/bin/sail build --no-cache

# Shell into app container
./vendor/bin/sail shell

# Execute command in container
./vendor/bin/sail exec laravel.test php artisan tinker
```

## Useful One-Liners

```bash
# Check if containers are healthy
docker compose ps

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a

# Backup database
./vendor/bin/sail mysql -u sail -ppassword reservation_db | gzip > backup.sql.gz

# Restore database
zcat backup.sql.gz | ./vendor/bin/sail mysql -u sail -ppassword reservation_db
```

## Environment Variables

Edit `.env` to change:
- `APP_PORT` - Laravel port (default: 80)
- `VITE_PORT` - Frontend port (default: 5173)
- `DB_DATABASE` - Database name
- `DB_USERNAME` - MySQL user
- `DB_PASSWORD` - MySQL password

Then restart: `./vendor/bin/sail restart`

## Ports

| Service | Port | URL |
|---------|------|-----|
| Laravel | 80 | http://localhost |
| Vite | 5173 | http://localhost:5173 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |

## Troubleshooting

```bash
# Check Docker status
docker version

# Check containers
docker compose ps

# View container logs
docker compose logs laravel.test

# Rebuild and restart
./vendor/bin/sail down -v
./vendor/bin/sail up -d

# Reset database
./vendor/bin/sail artisan migrate:reset
./vendor/bin/sail artisan migrate --seed
```
