# 🚀 Solution Complète: Jenkins + Argo CD + Docker

Ce guide vous donne **DEUX options** de déploiement avec votre pipeline Jenkins actuel.

---

## 🎯 Option 1: Argo CD avec Kubernetes (Solution Complète)

### Architecture

```
Developer commits
    ↓
Jenkins CI/CD
 ├─ Tests
 ├─ Build Docker image
 ├─ Push to Docker Hub/GHCR
 └─ Update kubernetes/deployment.yaml (GitOps)
    ↓
Git repository updated
    ↓
Argo CD (Auto-sync)
 └─ Deploy to Kubernetes cluster
    ↓
Application running in K8s! 🎉
```

### ✅ Ce dont vous avez besoin

#### 1. Un cluster Kubernetes

**Options:**

**a) Kubernetes local (pour tester):**
```powershell
# Option A: Docker Desktop Kubernetes
# Docker Desktop → Settings → Kubernetes → Enable Kubernetes

# Option B: Minikube
choco install minikube
minikube start --driver=docker

# Option C: kind (Kubernetes in Docker)
choco install kind
kind create cluster --name reservation-cluster
```

**b) Kubernetes cloud (pour production):**
- Google GKE (gratuit $300 crédits)
- Azure AKS (gratuit 12 mois)
- AWS EKS
- DigitalOcean Kubernetes

#### 2. Installer Argo CD

```bash
# Créer namespace
kubectl create namespace argocd

# Installer Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que tout démarre
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Obtenir le mot de passe initial
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Accéder à l'UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Ouvrir: https://localhost:8080
# Username: admin
# Password: (celui obtenu ci-dessus)
```

#### 3. Configurer Argo CD Application

```bash
# Appliquer votre Application Argo CD
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# Vérifier le statut
kubectl -n argocd get application reservation

# Synchroniser manuellement (première fois)
kubectl -n argocd patch application reservation -p '{"operation": {"sync": {}}}' --type=merge
```

#### 4. Créer les Secrets Kubernetes

```bash
# Générer APP_KEY Laravel
php artisan key:generate --show
# Copier le résultat

# Créer le secret
kubectl create secret generic app-secrets \
  --from-literal=app-key='base64:VotreCleGeneree' \
  --from-literal=db-password='VotrePasswordMySQL' \
  --namespace=reservation-salles

# Vérifier
kubectl -n reservation-salles get secrets
```

#### 5. Configurer Jenkins pour pousser l'image

**Étape A: Configurer Docker Hub credentials** (voir `JENKINS_CREDENTIALS_SETUP.md`)

**Étape B: Modifier le Jenkinsfile (ligne 24):**
```groovy
DOCKER_USERNAME = 'votre-username-dockerhub'  // MODIFIER ICI
```

**Étape C: Premier build Jenkins**
```
Jenkins → job reservation → Build Now
```

Le pipeline va:
1. ✅ Exécuter les tests
2. ✅ Build l'image Docker
3. ✅ Push vers Docker Hub
4. ✅ Mettre à jour kubernetes/deployment.yaml
5. ✅ Push vers GitHub

**Étape D: Argo CD détecte automatiquement**
- Argo CD va voir le changement dans Git
- Synchroniser automatiquement
- Déployer la nouvelle version!

#### 6. Vérifier le déploiement

```bash
# Voir les pods
kubectl -n reservation-salles get pods

# Voir les logs
kubectl -n reservation-salles logs -f deployment/laravel-app -c php-fpm

# Tester l'application
kubectl -n reservation-salles port-forward svc/laravel-service 8000:80
# Ouvrir: http://localhost:8000
```

### ✅ Workflow Complet (Option 1)

```
1. git push main
   ↓
2. Jenkins build #43
   ├─ Tests pass ✅
   ├─ Docker build ✅
   ├─ Docker push docker.io/username/reservation-salles:43-a1b2c3d ✅
   └─ Update kubernetes/deployment.yaml → Git push ✅
   ↓
3. Argo CD (automatic)
   ├─ Detect Git change ✅
   ├─ Pull new manifest ✅
   └─ Apply to cluster ✅
   ↓
4. Kubernetes
   ├─ Pull new Docker image ✅
   ├─ Rolling update (zero downtime) ✅
   └─ Pods running with new version! 🎉
```

**Temps total**: 3-5 minutes

---

## 🎯 Option 2: Argo CD avec Docker Compose (Sans Kubernetes)

Si vous ne voulez **PAS** gérer Kubernetes, vous pouvez utiliser Argo CD pour déployer sur **Docker Compose** directement!

### Architecture

```
Developer commits
    ↓
Jenkins CI/CD
 ├─ Tests
 ├─ Build Docker image
 ├─ Push to Docker Hub
 └─ Update docker-compose.prod.yaml (GitOps)
    ↓
Git repository updated
    ↓
Argo CD (custom sync hook)
 └─ Execute: docker-compose up -d
    ↓
Application running in Docker! 🎉
```

### ✅ Configuration

#### 1. Créer docker-compose.prod.yaml

```yaml
version: '3.8'

services:
  app:
    image: docker.io/yourusername/reservation-salles:latest
    container_name: reservation-app
    restart: unless-stopped
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      APP_KEY: ${APP_KEY}
      APP_URL: ${APP_URL}
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_DATABASE: reservation_prod
      DB_USERNAME: root
      DB_PASSWORD: ${DB_PASSWORD}
    volumes:
      - app-storage:/var/www/html/storage
    networks:
      - app-network
    depends_on:
      - mysql

  nginx:
    image: docker.io/yourusername/reservation-salles:latest
    container_name: reservation-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - app-network
    depends_on:
      - app

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

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:

volumes:
  mysql-data:
  app-storage:
```

#### 2. Installer Argo CD Events (pour déclencher Docker Compose)

```bash
# Sur votre serveur Docker
kubectl create namespace argo-events
kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-events/stable/manifests/install.yaml

# Configurer un sensor pour docker-compose
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Sensor
metadata:
  name: docker-compose-deploy
spec:
  triggers:
    - template:
        name: deploy-trigger
        script:
          command: ["/bin/sh"]
          args:
            - -c
            - |
              cd /var/www/reservation-app
              git pull origin master
              docker-compose -f docker-compose.prod.yaml pull
              docker-compose -f docker-compose.prod.yaml up -d
EOF
```

#### 3. Modifier le Jenkinsfile

Remplacer le stage `Update Kubernetes Manifests` par:

```groovy
stage('Update Docker Compose Manifest') {
    steps {
        echo 'Mise à jour de docker-compose.prod.yaml...'
        script {
            bat """
                powershell -Command "(Get-Content docker-compose.prod.yaml) -replace 'reservation-salles:.*', 'reservation-salles:${IMAGE_TAG}' | Set-Content docker-compose.prod.yaml"
                
                git add docker-compose.prod.yaml
                git commit -m "chore: Update image to ${IMAGE_TAG} [skip ci]"
                git push origin HEAD:master
            """
        }
    }
}
```

### ✅ Workflow Complet (Option 2)

```
1. git push
   ↓
2. Jenkins CI/CD
   ├─ Build Docker image ✅
   ├─ Push to registry ✅
   └─ Update docker-compose.prod.yaml → push Git ✅
   ↓
3. Argo CD Events (webhook)
   ├─ Detect Git change ✅
   └─ Trigger script ✅
   ↓
4. Serveur Docker
   ├─ git pull ✅
   ├─ docker-compose pull ✅
   └─ docker-compose up -d ✅
   ↓
5. Application deployed! 🎉
```

---

## 📊 Comparaison des Options

| Aspect | Option 1: Kubernetes | Option 2: Docker Compose |
|--------|---------------------|-------------------------|
| **Complexité** | Moyenne-Haute | Basse |
| **Scalabilité** | Excellente (auto-scale) | Limitée (1 serveur) |
| **High Availability** | Oui (multi-nodes) | Non (single point) |
| **Rolling Updates** | Oui (zero downtime) | Non (quelques secondes) |
| **Monitoring** | Intégré (Prometheus) | Manuel |
| **Cost** | Plus cher (cluster) | Moins cher (1 VM) |
| **Apprentissage** | Plus long | Plus court |
| **Production-ready** | ✅ Oui | ⚠️ Petit/moyen trafic |

---

## 🎯 Ma Recommandation

### Pour Débuter (Apprendre):
**Option 2: Docker Compose** 
- ✅ Plus simple
- ✅ Moins coûteux
- ✅ Suffisant pour < 1000 users
- ✅ Vous maîtrisez déjà Docker

### Pour Production (Scalable):
**Option 1: Kubernetes**
- ✅ Auto-scaling
- ✅ High availability
- ✅ Rolling updates
- ✅ Standard industrie
- ✅ Vous avez déjà les manifests!

---

## 🚀 Démarrage Rapide

### Pour Option 1 (Kubernetes):

```bash
# 1. Installer Minikube (local test)
choco install minikube
minikube start

# 2. Installer Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 3. Créer secrets
kubectl create secret generic app-secrets \
  --from-literal=app-key='base64:...' \
  --from-literal=db-password='...' \
  --namespace=reservation-salles

# 4. Déployer Application
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# 5. Accéder
kubectl port-forward svc/laravel-service -n reservation-salles 8000:80
```

### Pour Option 2 (Docker Compose):

```bash
# 1. Sur votre serveur
cd /var/www/reservation-app
cp docker-compose.prod.yaml docker-compose.yml

# 2. Configurer .env
nano .env
# APP_KEY=...
# DB_PASSWORD=...

# 3. Lancer
docker-compose up -d

# 4. Migrations
docker-compose exec app php artisan migrate --force

# 5. Configurer auto-deploy (cron)
*/5 * * * * cd /var/www/reservation-app && git pull && docker-compose pull && docker-compose up -d
```

---

## 📞 Prochaines Étapes

1. **Choisir votre option** (1 ou 2)
2. **Configurer Jenkins credentials** (`JENKINS_CREDENTIALS_SETUP.md`)
3. **Modifier DOCKER_USERNAME** dans Jenkinsfile
4. **Lancer premier build** Jenkins
5. **Vérifier le déploiement**

---

## 💡 Questions Fréquentes

**Q: Puis-je commencer avec Option 2 et migrer vers Option 1 plus tard?**  
R: ✅ Oui! Vos images Docker sont les mêmes. Il suffit de déployer avec Kubernetes au lieu de docker-compose.

**Q: Argo CD fonctionne sans Kubernetes?**  
R: ⚠️ Argo CD est fait pour Kubernetes. Pour Docker Compose, on utilise des scripts + webhooks (plus simple).

**Q: Quelle option coûte moins cher?**  
R: Option 2 (Docker Compose) = 1 VM ($5-10/mois). Option 1 (Kubernetes) = cluster (~$20-50/mois).

**Q: Combien de temps pour setup?**  
R: Option 2 = 30 minutes. Option 1 = 2-3 heures (première fois).

---

**Document créé le**: 12 Novembre 2025  
**Auteur**: DevOps Team
