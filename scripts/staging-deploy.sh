#!/usr/bin/env bash
set -euo pipefail

REMOTE_PATH="$1"
COMPOSE_URL="$2"
DB_CONTAINER="$3"
DB_USER="$4"
DB_PASS="$5"
DB_NAME="$6"

echo "Working directory: ${REMOTE_PATH}"
mkdir -p "${REMOTE_PATH}"
cd "${REMOTE_PATH}"

if [ -n "${COMPOSE_URL}" ]; then
  echo "Downloading docker-compose.yml from ${COMPOSE_URL}"
  curl -fsSL "${COMPOSE_URL}" -o docker-compose.yml || echo "Warning: failed to download docker-compose.yml"
else
  echo "No COMPOSE_URL provided — assuming docker-compose.yml is present or managed otherwise."
fi

echo "Pulling images"
docker compose pull || true

echo "Starting services"
docker compose up -d

# --- Backup the database before migration ---
mkdir -p backups || true
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="backups/backup-${TIMESTAMP}.sql"

echo "Creating DB backup at ${BACKUP_FILE}"
set -o pipefail
# Use exec mysqldump inside the DB container and stream out
docker compose exec -T "${DB_CONTAINER}" sh -c "exec mysqldump -u${DB_USER} -p'${DB_PASS}' ${DB_NAME}" > "${BACKUP_FILE}"
if [ $? -ne 0 ]; then
  echo "ERROR: backup_failed"
  exit 1
fi

# Run Laravel migrations
echo "Running Laravel migrations in php-fpm container"
docker compose exec php-fpm php artisan migrate --force || { echo "ERROR: migrate_failed"; exit 1; }

# Healthcheck (checks /health)

echo "Performing application healthcheck"
SUCCESS=0
for i in 1 2 3 4 5; do
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/health || true)
  echo "Healthcheck attempt ${i}: HTTP ${HTTP_CODE}"
  if [ "${HTTP_CODE}" = "200" ]; then
    SUCCESS=1
    break
  fi
  sleep 5
done

if [ ${SUCCESS} -ne 1 ]; then
  echo "ERROR: healthcheck_failed"
  exit 1
fi

# Print the backup path so the caller (Jenkins) can fetch it
echo "${REMOTE_PATH}/${BACKUP_FILE}"
