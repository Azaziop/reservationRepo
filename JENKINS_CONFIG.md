# Configuration Jenkins - Modifications apportées

## Changements effectués dans le Jenkinsfile

### 1. Base de données
- ✅ **DB_DATABASE** : `reservation_test` → `reservation_db`
- ✅ Création de base de données mise à jour dans le stage 'Database Setup'

### 2. Dockerfile actuel (multi-stage)
Votre Dockerfile actuel est **CORRECT** pour la production avec Kubernetes car :
- Il crée 2 images séparées : `php-runtime` et `nginx-runtime`
- Ces images sont déployées dans des pods Kubernetes séparés
- Argo CD les orchestre correctement

### 3. Pour le développement local
Utilisez `docker-compose.prod.yaml` qui :
- Lance PHP-FPM et Nginx dans des conteneurs séparés
- Configure MySQL sans mot de passe
- Utilise la base de données `reservation_db`

## Pipeline Jenkins - Aucun autre changement nécessaire

Le pipeline Jenkins actuel fonctionne correctement pour :

### ✅ Étapes de CI (Continuous Integration)
1. **Checkout** : Récupération du code
2. **Install Dependencies** : PHP (Composer) et Node.js (npm) en parallèle
3. **Environment Setup** : Configuration .env
4. **Database Setup** : Création et migration de `reservation_db`
5. **Build Assets** : Compilation Vite
6. **Code Quality** : Vérification du code
7. **Run Tests** : Exécution des tests
8. **Security Check** : Audit de sécurité

### ✅ Étapes de CD (Continuous Deployment)
1. **Build Docker Image** : Construction de l'image avec le stage `php-runtime`
   - Image taguée : `docker.io/azaziop/reservation-salles:${BUILD_NUMBER}-${GIT_COMMIT}`
   - Tags additionnels : `${BUILD_NUMBER}` et `latest`

2. **Push Docker Image** : Envoi vers Docker Hub
   - Utilise les credentials Jenkins `docker-registry-credentials`

3. **Update Kubernetes Manifests** : GitOps avec Argo CD
   - Met à jour `kubernetes/deployment.yaml`
   - Push vers GitHub avec `github-credentials`
   - Argo CD détecte les changements et déploie automatiquement

## Credentials Jenkins requis

Assurez-vous d'avoir configuré ces credentials dans Jenkins :

### 1. `docker-registry-credentials`
```groovy
usernamePassword(
    credentialsId: 'docker-registry-credentials',
    usernameVariable: 'DOCKER_USER',
    passwordVariable: 'DOCKER_PASS'
)
```
- **Username** : `azaziop`
- **Password** : Votre token Docker Hub

### 2. `github-credentials`
```groovy
usernamePassword(
    credentialsId: 'github-credentials',
    usernameVariable: 'GIT_USERNAME',
    passwordVariable: 'GIT_TOKEN'
)
```
- **Username** : `Azaziop`
- **Token** : Personal Access Token GitHub avec permissions `repo`

## Variables d'environnement Jenkins

Le Jenkinsfile utilise ces variables automatiques :
- `${BUILD_NUMBER}` : Numéro du build
- `${GIT_COMMIT}` : Hash du commit
- `${env.JOB_NAME}` : Nom du job
- `${env.BRANCH_NAME}` : Nom de la branche
- `${env.BUILD_URL}` : URL du build

## Architecture de déploiement

### Développement local (Docker Compose)
```
┌─────────────────────────────────────────┐
│  docker-compose.prod.yaml               │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Nginx   │→ │ PHP-FPM  │→ │ MySQL  ││
│  │  :8080   │  │  :9000   │  │ :3307  ││
│  └──────────┘  └──────────┘  └────────┘│
└─────────────────────────────────────────┘
```

### Production (Kubernetes via Jenkins + Argo CD)
```
┌────────────────────────────────────────────────────┐
│  Jenkins Pipeline                                  │
├────────────────────────────────────────────────────┤
│  1. Build & Test                                   │
│  2. Build Docker Image (php-runtime)               │
│  3. Push to Docker Hub                             │
│  4. Update kubernetes/deployment.yaml              │
│  5. Push to GitHub                                 │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  Argo CD (GitOps)                                  │
├────────────────────────────────────────────────────┤
│  1. Détecte changements dans deployment.yaml      │
│  2. Synchronise avec Kubernetes                    │
│  3. Déploie la nouvelle version                    │
└────────────────┬───────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                │
├────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Nginx Pod    │→ │ PHP-FPM Pod  │→ │ MySQL   │ │
│  │ (nginx img)  │  │ (php img)    │  │ Service │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└────────────────────────────────────────────────────┘
```

## Commandes utiles

### Tester le build Jenkins localement
```powershell
# Installer les dépendances
composer install
npm install

# Compiler les assets
npm run build

# Créer la base de données
php -r "try { $pdo = new PDO('mysql:host=localhost', 'root', ''); $pdo->exec('CREATE DATABASE IF NOT EXISTS reservation_db'); } catch (Exception $e) { echo $e->getMessage(); }"

# Exécuter les migrations
php artisan migrate:fresh --seed

# Exécuter les tests
php artisan test
```

### Builder l'image Docker
```powershell
# Build de l'image PHP-FPM
docker build -t azaziop/reservation-salles:test --target php-runtime .

# Build de l'image Nginx (si nécessaire)
docker build -t azaziop/reservation-salles:nginx --target nginx-runtime .
```

### Tester avec Docker Compose
```powershell
# Démarrer l'application
docker-compose -f docker-compose.prod.yaml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yaml logs -f

# Arrêter l'application
docker-compose -f docker-compose.prod.yaml down
```

## Vérifications avant de lancer Jenkins

### ✅ Checklist
- [ ] Les credentials `docker-registry-credentials` sont configurés dans Jenkins
- [ ] Les credentials `github-credentials` sont configurés dans Jenkins
- [ ] Le fichier `.env.example` existe et contient la bonne configuration
- [ ] Les migrations sont à jour
- [ ] Les seeders fonctionnent
- [ ] Les tests passent localement
- [ ] Docker est installé sur le serveur Jenkins
- [ ] Le serveur Jenkins peut accéder à Docker Hub
- [ ] Le serveur Jenkins peut accéder à GitHub

## En cas de problème

### Erreur : "docker-registry-credentials not found"
```groovy
// Vérifier dans Jenkins : Gérer Jenkins > Credentials
// Ajouter un credential de type "Username with password"
// ID: docker-registry-credentials
```

### Erreur : "github-credentials not found"
```groovy
// Vérifier dans Jenkins : Gérer Jenkins > Credentials
// Ajouter un credential de type "Username with password"
// ID: github-credentials
// Token: Créer un PAT sur GitHub avec permission 'repo'
```

### Erreur : "Database creation failed"
```powershell
# Vérifier que MySQL est installé sur le serveur Jenkins
# Vérifier que l'utilisateur root peut créer des bases de données
```

### Erreur : "npm: command not found"
```powershell
# Installer Node.js sur le serveur Jenkins
# Ou utiliser le plugin NodeJS dans Jenkins
```

## Résumé des fichiers modifiés

✅ **Jenkinsfile**
- DB_DATABASE: `reservation_test` → `reservation_db`
- Stage Database Setup mis à jour

✅ **.env**
- DB_DATABASE: `reservation_db`
- DB_HOST: `mysql` (pour Docker), `localhost` (pour Jenkins)
- APP_URL: `http://localhost:8080`

✅ **docker-compose.prod.yaml**
- Configuration MySQL sans mot de passe
- Base de données `reservation_db`

❌ **Dockerfile** - AUCUN CHANGEMENT NÉCESSAIRE
- Le Dockerfile actuel est correct pour la production
