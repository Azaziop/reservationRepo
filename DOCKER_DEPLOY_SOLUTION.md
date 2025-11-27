# 🚀 Solution: Jenkins CI/CD + Docker Deploy (Sans Kubernetes)

Cette solution permet de déployer l'application Laravel directement sur un serveur Docker en utilisant Jenkins pour le CI/CD et un système de déploiement automatique.

## 📊 Architecture Simplifiée

```
Developer commits
    ↓
Jenkins CI/CD Pipeline
 ├─ Run tests
 ├─ Build Docker image
 ├─ Push to registry
 ├─ Update docker-compose.prod.yaml
 └─ Push to Git
    ↓
GitHub webhook OU Cron job
    ↓
Serveur Docker
 └─ docker-compose up -d (auto-deploy)
```

## 📁 Fichier 1: docker-compose.prod.yaml

Créons ce fichier pour le déploiement production:

```yaml
version: '3.8'

services:
  app:
    image: ${DOCKER_REGISTRY:-docker.io}/${DOCKER_USERNAME:-yourusername}/reservation-salles:latest
    container_name: reservation-app
    restart: unless-stopped
    environment:
      APP_NAME: "Reservation System"
      APP_ENV: production
      APP_DEBUG: "false"
      APP_KEY: ${APP_KEY}
      APP_URL: ${APP_URL:-http://localhost}
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: reservation_prod
      DB_USERNAME: root
      DB_PASSWORD: ${DB_PASSWORD}
      CACHE_DRIVER: redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
      SESSION_DRIVER: redis
      QUEUE_CONNECTION: redis
    volumes:
      - ./storage:/var/www/html/storage
      - ./bootstrap/cache:/var/www/html/bootstrap/cache
    networks:
      - app-network
    depends_on:
      - mysql
      - redis
    command: ["php-fpm"]

  nginx:
    image: ${DOCKER_REGISTRY:-docker.io}/${DOCKER_USERNAME:-yourusername}/reservation-salles:latest
    container_name: reservation-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./storage:/var/www/html/storage
    networks:
      - app-network
    depends_on:
      - app
    command: ["nginx", "-g", "daemon off;"]

  mysql:
    image: mysql:8.0
    container_name: reservation-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: reservation_prod
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - app-network
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    container_name: reservation-redis
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql-data:
    driver: local
```

## 📁 Fichier 2: .env.production

Variables d'environnement pour production:

```bash
# À copier en .env sur le serveur

APP_KEY=base64:VOTRE_CLE_GENEREE_ICI
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com

DB_PASSWORD=votre_password_securise

DOCKER_REGISTRY=docker.io
DOCKER_USERNAME=yourusername
```

## 📁 Fichier 3: auto-deploy.sh

Script de déploiement automatique:

```bash
#!/bin/bash
# auto-deploy.sh - À placer sur le serveur

REPO_DIR="/var/www/reservation-app"
BRANCH="master"
LOG_FILE="/var/log/reservation-deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🔄 Checking for updates..."
cd $REPO_DIR

# Pull latest changes
git fetch origin $BRANCH
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$BRANCH)

if [ "$LOCAL" != "$REMOTE" ]; then
    log "📥 New version detected! Deploying..."
    
    # Pull code
    git pull origin $BRANCH
    
    # Load environment variables
    source .env
    
    # Pull new Docker images
    docker-compose -f docker-compose.prod.yaml pull
    
    # Stop old containers
    docker-compose -f docker-compose.prod.yaml down
    
    # Start new containers
    docker-compose -f docker-compose.prod.yaml up -d
    
    # Wait for containers to be ready
    sleep 10
    
    # Run migrations
    docker-compose -f docker-compose.prod.yaml exec -T app php artisan migrate --force
    
    # Clear and cache config
    docker-compose -f docker-compose.prod.yaml exec -T app php artisan config:cache
    docker-compose -f docker-compose.prod.yaml exec -T app php artisan route:cache
    docker-compose -f docker-compose.prod.yaml exec -T app php artisan view:cache
    
    log "✅ Deployment complete! Version: $REMOTE"
else
    log "✅ Already up to date"
fi
```

## 🔧 Modification du Jenkinsfile

Remplacer le stage Kubernetes par Docker Compose:

```groovy
stage('Update Docker Compose Manifest') {
    steps {
        echo 'Mise à jour de docker-compose.prod.yaml (GitOps)...'
        script {
            def newImageTag = "${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
            
            bat """
                echo Mise à jour de docker-compose.prod.yaml avec la nouvelle image...
                
                powershell -Command "(Get-Content docker-compose.prod.yaml) -replace 'reservation-salles:.*', 'reservation-salles:${IMAGE_TAG}' | Set-Content docker-compose.prod.yaml"
                
                echo Configuration Git...
                git config user.email "jenkins@ci.local"
                git config user.name "Jenkins CI"
                
                echo Ajout des changements...
                git add docker-compose.prod.yaml
                
                echo Commit des changements...
                git commit -m "chore: Update Docker image to ${IMAGE_TAG} [skip ci]" || echo "Aucun changement"
                
                echo Push vers GitHub...
                git push origin HEAD:master
            """
            echo "✅ Manifest mis à jour: ${newImageTag}"
        }
    }
}
```

## 🚀 Installation sur le serveur

### Étape 1: Préparer le serveur

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Étape 2: Cloner et configurer

```bash
# Cloner le repository
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/Azaziop/reservationRepo.git reservation-app
cd reservation-app

# Configurer .env
sudo cp .env.example .env
sudo nano .env
# Éditer: APP_KEY, DB_PASSWORD, APP_URL

# Créer le script de déploiement
sudo nano auto-deploy.sh
# (copier le contenu du script ci-dessus)

sudo chmod +x auto-deploy.sh
```

### Étape 3: Premier déploiement

```bash
# Lancer les services
docker-compose -f docker-compose.prod.yaml up -d

# Générer APP_KEY
docker-compose -f docker-compose.prod.yaml exec app php artisan key:generate

# Migrations
docker-compose -f docker-compose.prod.yaml exec app php artisan migrate --seed --force

# Vérifier
docker-compose -f docker-compose.prod.yaml ps
curl http://localhost
```

### Étape 4: Auto-déploiement (Cron)

```bash
# Configurer cron pour vérifier toutes les minutes
sudo crontab -e

# Ajouter cette ligne:
* * * * * /var/www/reservation-app/auto-deploy.sh >> /var/log/reservation-deploy.log 2>&1
```

## 🔗 Alternative: Webhook GitHub

Si vous préférez un déploiement immédiat via webhook:

```bash
# Créer endpoint webhook
sudo mkdir -p /var/www/webhook
sudo nano /var/www/webhook/deploy.php
```

```php
<?php
// deploy.php
$secret = 'YOUR_WEBHOOK_SECRET';
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');
$expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);

if (hash_equals($expected, $signature)) {
    $data = json_decode($payload, true);
    if ($data['ref'] === 'refs/heads/master') {
        exec('/var/www/reservation-app/auto-deploy.sh 2>&1', $output);
        echo implode("\n", $output);
    }
}
?>
```

Configurer GitHub webhook:
- URL: `http://your-server.com:8080/deploy.php`
- Secret: `YOUR_WEBHOOK_SECRET`
- Events: Push events

## ✅ Workflow Complet

```
1. Developer: git push
   ↓
2. Jenkins:
   - Run tests ✅
   - Build Docker image ✅
   - Push to Docker Hub ✅
   - Update docker-compose.prod.yaml ✅
   - Git push ✅
   ↓
3. Serveur (auto):
   - Cron/Webhook détecte ✅
   - git pull ✅
   - docker-compose pull ✅
   - docker-compose up -d ✅
   - Migrations ✅
   ↓
4. Application deployed! 🎉
```

**Temps total**: 2-3 minutes

## 📞 Support

Consultez:
- `JENKINS_CREDENTIALS_SETUP.md` - Configuration credentials
- `DOCKER_SETUP.md` - Installation Docker
- `INTEGRATION_README.md` - Vue d'ensemble

---

**Version**: 1.0  
**Date**: 12 Novembre 2025
