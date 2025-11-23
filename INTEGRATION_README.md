# 🚀 Branche d'Intégration: Jenkins + Docker + Kubernetes

Cette branche **`integration/jenkins-docker-k8s`** combine tous les éléments nécessaires pour le pipeline CI/CD complet.

## 📦 Contenu de la branche

### ✅ Depuis `main` (Jenkins)
- **`Jenkinsfile`** - Pipeline CI complet (tests, build, qualité code, sécurité)
- **`.env.production`** - Configuration production Laravel

> Remarque: Les manifests et la documentation Kubernetes/ArgoCD ont été retirés du dépôt. Ce document conserve une trace historique mais ne reflète plus l'état actuel du dépôt pour la partie Kubernetes/GitOps.

### ✅ Depuis `DockerBranch` (Docker)
- **`compose.yaml`** - Laravel Sail pour développement local
- **`DOCKER_SETUP.md`** - Guide installation Docker/Sail
- **`DOCKER_CHEATSHEET.md`** - Aide-mémoire commandes Docker

### ✅ Nouvellement ajouté
- **`Dockerfile`** - Multi-stage build pour production (PHP-FPM + Nginx)
- **`.dockerignore`** - Optimisation builds Docker

## 🎯 Architecture Complète

```
┌─────────────────────────────────────────────────────────┐
│                    DÉVELOPPEMENT                         │
├─────────────────────────────────────────────────────────┤
│  compose.yaml (Laravel Sail)                            │
│  → MySQL + PHP 8.4 + Vite                               │
│  → http://localhost                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               CONTINUOUS INTEGRATION (CI)                │
├─────────────────────────────────────────────────────────┤
│  Jenkinsfile                                             │
│  1. Install Dependencies (PHP + Node)                    │
│  2. Setup Environment                                    │
│  3. Database Setup                                       │
│  4. Build Assets (Vite)                                  │
│  5. Code Quality (PHP + JS)                              │
│  6. Run Tests (25 tests)                                 │
│  7. Security Check                                       │
│  8. ⏸️  CI Validation Complete                          │
│                                                          │
│  🔜 TODO: Add Docker build stages                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          CONTINUOUS DEPLOYMENT (CD) - À VENIR            │
├─────────────────────────────────────────────────────────┤
│  Jenkinsfile (nouveaux stages à ajouter)                 │
│  9. Docker Build (Dockerfile multi-stage)                │
│  10. Docker Push (vers registry)                         │
│  11. (Optionnel) Mettre à jour les manifests de déploiement
│  12. Git Commit & Push                                   │
│                                                         
│  Note: Les instructions GitOps/Kubernetes ont été retirées
│  du dépôt. Pour une stratégie GitOps, fournissez un dépôt
│  séparé contenant les manifests et la configuration CD.
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      PRODUCTION                          │
├─────────────────────────────────────────────────────────┤
│  NOTE: This repository no longer contains Kubernetes     │
│  manifests nor Argo CD configuration. For production     │
│  deployments, keep manifests and deployment tooling in   │
│  a separate GitOps repository or a dedicated deployment  │
│  pipeline (Helm charts, Terraform, or similar).          │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prochaines Étapes (TODO List)

### 1. ⏳ Modifier Jenkinsfile
Ajouter 3 nouveaux stages après `Build Assets`:

```groovy
stage('Build Docker Image') {
    steps {
        bat """
            docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
            docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
        """
    }
}

stage('Push Docker Image') {
    steps {
        withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', ...]) {
            bat """
                docker login -u %DOCKER_USER% -p %DOCKER_PASS% ${DOCKER_REGISTRY}
                docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
            """
        }
    }
}

stage('Update Kubernetes Manifests') {
    steps {
        bat """
            powershell -Command "(Get-Content kubernetes/deployment.yaml) -replace 'image: .*', 'image: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}' | Set-Content kubernetes/deployment.yaml"
            git add kubernetes/deployment.yaml
            git commit -m "chore: Update image tag to ${BUILD_NUMBER} [skip ci]"
            git push origin HEAD:master
        """
    }
}
```

### 2. ⏳ Configurer Jenkins
- Ajouter credentials `docker-registry-credentials` (Docker Hub ou GHCR)
- Ajouter variables d'environnement:
  ```groovy
  environment {
      DOCKER_REGISTRY = 'docker.io/yourusername'  // ou ghcr.io/azaziop
      IMAGE_NAME = 'reservation-salles'
  }
  ```

### 3. ⏳ (Kubernetes/ArgoCD retiré)
Les instructions d'installation d'Argo CD et les manifests associés ont été supprimés du dépôt. Si vous avez besoin d'un workflow GitOps, préparez un dépôt séparé contenant les manifests et les instructions de synchronisation.

### 4. ⏳ Configurer Secrets Kubernetes
```bash
kubectl create secret generic app-secrets \
  --from-literal=app-key='base64:YOUR_LARAVEL_APP_KEY' \
  --from-literal=db-password='YOUR_DB_PASSWORD' \
  --namespace=reservation-salles
```

## 🔧 Utilisation

### Développement Local (Docker Sail)
```bash
# Démarrer l'environnement de dev
./vendor/bin/sail up -d
./vendor/bin/sail npm run dev
./vendor/bin/sail artisan serve

# Accéder à l'application
http://localhost
```

### CI/CD (Jenkins)
```bash
# Déclencher le build
git push origin integration/jenkins-docker-k8s

# Jenkins va automatiquement:
# 1. Exécuter les tests
# 2. (À VENIR) Builder l'image Docker
# 3. (À VENIR) Pousser vers le registry
# 4. (À VENIR) Mettre à jour les manifests K8s
```

### Production (Kubernetes + Argo CD)
```bash
# Déployer manuellement (première fois)
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# Argo CD va automatiquement:
# 1. Détecter les changements dans kubernetes/
# 2. Synchroniser avec le cluster
# 3. Déployer la nouvelle version
```

## 📚 Documentation

- **DOCKER_SETUP.md** - Installation Docker Desktop + Laravel Sail
- **DOCKER_CHEATSHEET.md** - Commandes Docker essentielles
 - **kubernetes/README.md** - (supprimé)
 - **kubernetes/QUICKSTART.md** - (supprimé)
 - **kubernetes/argocd/README.md** - (supprimé)

## 🎉 Workflow Complet (Une fois terminé)

```
1. Developer commits code
    ↓
2. Jenkins CI runs (tests, build)
    ↓
3. Jenkins builds Docker image
    ↓
4. Jenkins pushes to registry
    ↓
5. (Optional) Jenkins updates deployment manifests in a separate repo
    ↓
6. Jenkins commits & pushes the manifest changes (if applicable)
    ↓
7. A deployment system (GitOps, CI pipeline or manual deploy) applies manifests to production
    ↓
8. ✅ Application deployed to production!
```

## 🔗 Liens Utiles

- Repository: https://github.com/Azaziop/reservationRepo
- Branch: `integration/jenkins-docker-k8s`
- Pull Request: (à créer)
- Jenkins: http://localhost:8080/job/reservation
- Docker Hub: https://hub.docker.com (à configurer)
- Argo CD: (à installer sur cluster K8s)

---

**Statut**: ✅ Structure complète | ⏳ Pipeline CI/CD à finaliser
**Date**: 12 Novembre 2025
**Auteur**: Équipe DevOps
