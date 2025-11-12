# 🚀 Guide de Démarrage Rapide - CD avec Argo CD

Ce guide vous permet de déployer rapidement l'application **Reservation** sur Kubernetes avec Argo CD.

## ⚡ Démarrage en 5 Étapes

### Étape 1 : Installer Argo CD (5 min)

```bash
# Créer le namespace
kubectl create namespace argocd

# Installer Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Attendre que tous les pods soient prêts
kubectl -n argocd wait --for=condition=Ready pods --all --timeout=300s
```

### Étape 2 : Accéder à l'UI Argo CD

```bash
# Port-forward pour accéder localement
kubectl -n argocd port-forward svc/argocd-server 8080:443 &

# Récupérer le mot de passe admin
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode && echo

# Ouvrir dans le navigateur
# https://localhost:8080
# User: admin
# Password: (celui affiché ci-dessus)
```

### Étape 3 : Créer le Secret Kubernetes

```bash
# Générer APP_KEY Laravel (si pas encore fait)
php artisan key:generate --show

# Créer le secret (remplacer YOUR_APP_KEY et YOUR_DB_PASSWORD)
kubectl create secret generic app-secrets \
  --from-literal=app-key='base64:YOUR_LARAVEL_APP_KEY_HERE' \
  --from-literal=db-password='YOUR_DB_PASSWORD_HERE' \
  --namespace=reservation-salles \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Ou** créer depuis le template :
```bash
cp kubernetes/secret.yaml.example kubernetes/secret.yaml
# Éditer kubernetes/secret.yaml avec vos valeurs encodées en base64
kubectl apply -f kubernetes/secret.yaml
```

### Étape 4 : Builder et Pousser l'Image Docker

```bash
# Builder l'image (depuis la racine du projet)
docker build -t your-registry/reservation-salles:latest .

# Pousser vers votre registry
docker push your-registry/reservation-salles:latest

# Mettre à jour kubernetes/deployment.yaml avec votre image
sed -i 's|image: reservation-salles:latest|image: your-registry/reservation-salles:latest|g' kubernetes/deployment.yaml
```

### Étape 5 : Déployer avec Argo CD

```bash
# Commiter les changements (si pas encore fait)
git add kubernetes/
git commit -m "feat: Add Kubernetes manifests and Argo CD config"
git push origin main:master

# Créer l'Application Argo CD
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# Vérifier le statut
kubectl -n argocd get application reservation

# Forcer la synchronisation (optionnel)
kubectl -n argocd patch application reservation -p '{"operation": {"sync": {}}}' --type=merge
```

## ✅ Vérification

```bash
# Utiliser le script de vérification
chmod +x kubernetes/check-deployment.sh
./kubernetes/check-deployment.sh

# Ou manuellement
kubectl -n reservation-salles get pods
kubectl -n reservation-salles get svc
kubectl -n argocd get application reservation
```

## 🌐 Accéder à l'Application

### Option A : Via Ingress (si configuré)

```bash
# Vérifier l'Ingress
kubectl -n reservation-salles get ingress

# Accéder via le hostname configuré
# https://reservation.example.com
```

### Option B : Via Port-Forward

```bash
# Port-forward local
kubectl -n reservation-salles port-forward svc/laravel-service 8080:80

# Ouvrir dans le navigateur
# http://localhost:8080
```

## 🔧 Commandes Utiles

### Voir les logs

```bash
# Logs PHP-FPM
kubectl -n reservation-salles logs -l app=laravel -c php-fpm --tail=100 -f

# Logs Nginx
kubectl -n reservation-salles logs -l app=laravel -c nginx --tail=100 -f

# Tous les logs
kubectl -n reservation-salles logs -l app=laravel --all-containers=true --tail=100 -f
```

### Exécuter des commandes Laravel

```bash
# Migrations
kubectl -n reservation-salles exec deployment/laravel-app -c php-fpm -- php artisan migrate --force

# Cache clear
kubectl -n reservation-salles exec deployment/laravel-app -c php-fpm -- php artisan cache:clear

# Shell interactif
kubectl -n reservation-salles exec -it deployment/laravel-app -c php-fpm -- bash
```

### Synchroniser manuellement avec Argo CD

```bash
# Via kubectl
kubectl -n argocd patch application reservation -p '{"operation": {"sync": {}}}' --type=merge

# Via argocd CLI (si installé)
argocd app sync reservation
```

### Redémarrer l'application

```bash
# Restart rollout
kubectl -n reservation-salles rollout restart deployment/laravel-app

# Vérifier le status
kubectl -n reservation-salles rollout status deployment/laravel-app
```

## 📊 Monitoring

### Argo CD UI

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
# Ouvrir https://localhost:8080
```

### Kubernetes Dashboard (optionnel)

```bash
# Installer
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Accéder
kubectl proxy
# Ouvrir http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

## 🐛 Troubleshooting Rapide

### Pods ne démarrent pas

```bash
kubectl -n reservation-salles describe pod <pod-name>
kubectl -n reservation-salles logs <pod-name> -c php-fpm
```

### Image pull error

```bash
# Vérifier l'image
docker pull your-registry/reservation-salles:latest

# Ajouter imagePullSecrets si registry privé
kubectl create secret docker-registry regcred \
  --docker-server=your-registry \
  --docker-username=your-username \
  --docker-password=your-password \
  --namespace=reservation-salles
```

### Application "OutOfSync" dans Argo CD

```bash
# Voir les différences
kubectl -n argocd get application reservation -o yaml

# Forcer la synchronisation
kubectl -n argocd patch application reservation --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Base de données inaccessible

```bash
# Vérifier la connectivité
kubectl -n reservation-salles run mysql-test --rm -it --image=mysql:8.0 -- mysql -h mysql-service -u root -p
```

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [`kubernetes/README.md`](README.md) - Documentation complète Kubernetes
- [`kubernetes/argocd/README.md`](argocd/README.md) - Guide détaillé Argo CD
- [`docs/CI-Pipeline-Documentation.md`](../docs/CI-Pipeline-Documentation.md) - Pipeline CI/CD complet

## 🎯 Workflow Recommandé

```
1. Développement local
   ↓
2. Commit + Push (déclenche Jenkins CI)
   ↓
3. Jenkins CI valide le code (tests, build)
   ↓
4. Builder l'image Docker manuellement
   ↓
5. Pousser l'image vers le registry
   ↓
6. (Optionnel) Mettre à jour kubernetes/deployment.yaml avec le nouveau tag
   ↓
7. Commit + Push les manifests Kubernetes
   ↓
8. Argo CD détecte les changements
   ↓
9. Argo CD synchronise automatiquement
   ↓
10. Application déployée en production ✅
```

## 🔄 Automatisation Future

Pour automatiser davantage, considérez :

1. **GitHub Actions / Jenkins** pour :
   - Builder automatiquement l'image Docker après le CI
   - Pousser l'image vers le registry
   - Mettre à jour `deployment.yaml` avec le nouveau tag d'image
   - Commiter les changements (GitOps)

2. **Image Updater** pour Argo CD :
   - Détecte automatiquement les nouvelles images
   - Met à jour les manifests Git
   - https://argocd-image-updater.readthedocs.io/

3. **Sealed Secrets** pour la gestion des secrets :
   - Chiffrer les secrets dans Git
   - https://github.com/bitnami-labs/sealed-secrets

---

**Besoin d'aide ?** Consultez les README détaillés ou contactez l'équipe DevOps.
