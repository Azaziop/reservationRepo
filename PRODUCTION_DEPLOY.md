# 🚀 Production Deployment (Docker)

This guide explains how to build and run the production image using the provided `docker-compose.prod.yaml` and multi-stage Dockerfile.

## Overview

Production uses a single container (nginx + php-fpm + built assets) plus MySQL. Assets are built at image build time; no Node/Vite runtime needed in production. Composer dependencies are installed with `--no-dev`.

## Files

- `.docker/app/Dockerfile` — multi-stage build (node → composer → final alpine with nginx + php-fpm)
- `.docker/app/supervisord.conf` — runs php-fpm and nginx in one container
- `docker/nginx/default.conf` — nginx virtual host
- `docker-compose.prod.yaml` — production service definitions

## Build & Run

```bash
# 1. Ensure .env exists (copy if needed)
cp .env.example .env

# 2. (Optional) Adjust .env for production
# APP_ENV=production
# APP_DEBUG=false
# DB_PASSWORD=strongpassword

# 3. Build image
docker compose -f docker-compose.prod.yaml build

# 4. Start services
docker compose -f docker-compose.prod.yaml up -d

# 5. Check running containers
docker compose -f docker-compose.prod.yaml ps

# 6. Run migrations
docker compose -f docker-compose.prod.yaml exec app php artisan migrate --force

# 7. (Optional) Warm caches
docker compose -f docker-compose.prod.yaml exec app php artisan optimize
```

App will be available at: `http://localhost:8080`

## Database Access

Host machine port: 3307 → container 3306.

```bash
mysql -h 127.0.0.1 -P 3307 -u sail -p
```

## Rebuilding After Code Changes

Rebuild when PHP code or frontend assets change:
```bash
docker compose -f docker-compose.prod.yaml build --no-cache
docker compose -f docker-compose.prod.yaml up -d --force-recreate
```

## Logs & Debugging

```bash
docker compose -f docker-compose.prod.yaml logs -f app
docker compose -f docker-compose.prod.yaml logs -f mysql
```

## Backups

Dump database:
```bash
docker compose -f docker-compose.prod.yaml exec mysql mysqldump -u sail -p"$DB_PASSWORD" "$DB_DATABASE" > backup.sql
```

Restore:
```bash
docker compose -f docker-compose.prod.yaml exec -T mysql mysql -u sail -p"$DB_PASSWORD" "$DB_DATABASE" < backup.sql
```

## Environment Variables

Edit `.env` before building; values are injected at runtime via `env_file:`. Avoid baking secrets into the image.

## Recommended Hardening

- Use an external managed MySQL (remove `mysql` service)
- Add a reverse proxy (Caddy / Traefik / Nginx separate)
- Configure HTTPS termination (Docker proxy or external LB)
- Set `APP_KEY` securely (already generated)
- Disable `APP_DEBUG`

## Scaling Considerations

For larger deployments split services:
- Use separate `php-fpm` & `nginx` containers
- Add `redis` service for cache / queue
- Add `queue worker` container: `php artisan queue:work`

## Cleaning Up

```bash
docker compose -f docker-compose.prod.yaml down
# Remove volumes (WARNING: deletes data)
docker compose -f docker-compose.prod.yaml down -v
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | php-fpm not running | Check `supervisord` logs: `docker compose -f docker-compose.prod.yaml logs app` |
| Assets 404 | Build missing | Rebuild: `docker compose -f docker-compose.prod.yaml build` |
| DB auth error | Wrong credentials | Verify `.env` DB_* values match compose env vars |
| Port conflict | 8080/3307 in use | Change ports in `docker-compose.prod.yaml` |

## Next Steps

- Add CI pipeline to build & push image: `reservation-app:prod`
- Tag images by commit: `reservation-app:<git-sha>`
- Integrate with a registry (GitHub Container Registry / Docker Hub)

---
**Done.** Production configuration is ready. Adjust for staging by duplicating compose file and altering ports/db.
