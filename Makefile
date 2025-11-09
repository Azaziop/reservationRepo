.PHONY: help build up down logs restart shell test migrate seed cache-clear

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show help commands
	@echo "$(GREEN)📚 Available Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "$(GREEN)🔨 Building Docker images...$(NC)"
	docker-compose build

up: ## Start all containers
	@echo "$(GREEN)🚀 Starting containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers started!$(NC)"
	@echo "$(YELLOW)App: http://localhost$(NC)"
	@echo "$(YELLOW)phpMyAdmin: http://localhost:8080$(NC)"
	@echo "$(YELLOW)Redis Commander: http://localhost:8081$(NC)"

down: ## Stop all containers
	@echo "$(RED)🛑 Stopping containers...$(NC)"
	docker-compose down

logs: ## Show container logs
	docker-compose logs -f app

logs-mysql: ## Show MySQL logs
	docker-compose logs -f mysql

logs-redis: ## Show Redis logs
	docker-compose logs -f redis

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting services...$(NC)"
	docker-compose restart

shell: ## Access application shell
	docker-compose exec app sh

bash: ## Access bash shell
	docker-compose exec app bash

mysql-shell: ## Access MySQL shell
	docker-compose exec mysql mysql -u reservation_user -p

artisan: ## Run artisan command (usage: make artisan CMD="migrate")
	docker-compose exec app php artisan $(CMD)

tinker: ## Access Laravel Tinker
	docker-compose exec app php artisan tinker

migrate: ## Run database migrations
	@echo "$(GREEN)📦 Running migrations...$(NC)"
	docker-compose exec app php artisan migrate

migrate-rollback: ## Rollback last migration
	docker-compose exec app php artisan migrate:rollback

seed: ## Seed the database
	docker-compose exec app php artisan db:seed

fresh: ## Refresh database (migrate:fresh + seed)
	@echo "$(YELLOW)🔄 Refreshing database...$(NC)"
	docker-compose exec app php artisan migrate:fresh --seed

test: ## Run tests
	docker-compose exec app php artisan test

test-coverage: ## Run tests with coverage
	docker-compose exec app php artisan test --coverage

cache-clear: ## Clear all caches
	@echo "$(YELLOW)🧹 Clearing caches...$(NC)"
	docker-compose exec app php artisan cache:clear
	docker-compose exec app php artisan route:clear
	docker-compose exec app php artisan config:clear
	docker-compose exec app php artisan view:clear

cache-rebuild: ## Rebuild all caches
	@echo "$(GREEN)🔨 Rebuilding caches...$(NC)"
	docker-compose exec app php artisan config:cache
	docker-compose exec app php artisan route:cache
	docker-compose exec app php artisan view:cache

composer-install: ## Install composer dependencies
	docker-compose exec app composer install

composer-update: ## Update composer dependencies
	docker-compose exec app composer update

npm-install: ## Install npm dependencies
	docker-compose exec app npm install

npm-build: ## Build assets
	docker-compose exec app npm run build

npm-watch: ## Watch assets (development)
	docker-compose exec app npm run dev

backup-db: ## Backup database
	@echo "$(GREEN)💾 Backing up database...$(NC)"
	docker-compose exec mysql mysqldump -u reservation_user -p reservation_salles_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Database backed up!$(NC)"

restore-db: ## Restore database (usage: make restore-db FILE="backup.sql")
	@echo "$(YELLOW)📥 Restoring database...$(NC)"
	docker-compose exec -T mysql mysql -u reservation_user -p reservation_salles_db < $(FILE)
	@echo "$(GREEN)✅ Database restored!$(NC)"

health-check: ## Check health of all services
	@echo "$(GREEN)🏥 Checking service health...$(NC)"
	@echo "$(YELLOW)App:$(NC)" && curl -s http://localhost/health || echo "❌ Not responding"
	@echo "$(YELLOW)Redis:$(NC)" && docker-compose exec redis redis-cli -a redis_password ping
	@echo "$(YELLOW)MySQL:$(NC)" && docker-compose exec mysql mysqladmin ping -h localhost

ps: ## Show running containers
	docker-compose ps

stats: ## Show container stats
	docker stats

clean: ## Remove unused Docker resources
	@echo "$(RED)🗑️  Cleaning Docker resources...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✅ Cleaned!$(NC)"

# Development shortcuts
dev-setup: build composer-install npm-install migrate ## Complete development setup
	@echo "$(GREEN)✅ Development setup complete!$(NC)"

dev-ready: up cache-rebuild npm-build ## Start dev environment
	@echo "$(GREEN)✅ Development environment ready!$(NC)"
