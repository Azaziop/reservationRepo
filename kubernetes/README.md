# Kubernetes Deployment - Reservation Application

Ce dossier contient les manifests Kubernetes pour déployer l'application Laravel **Reservation** en production via **Argo CD**.

## 📁 Structure des Fichiers

```
kubernetes/
├── deployment.yaml          # DEPRECATED: static deployment manifest (removed). Use Helm template at `helm/templates/deployment.yaml` (canonical)
├── secret.yaml.example      # Template pour les secrets (APP_KEY, DB_PASSWORD)
├── ingress.yaml            # Ingress pour exposition HTTP/HTTPS
├── argocd/
│   ├── application-reservation.yaml   # Argo CD Application
│   └── README.md                      # Guide Argo CD
└── README.md               # Ce fichier
```

## 🏗️ Architecture

L'application est déployée avec une architecture **sidecar** :

- **Container PHP-FPM** (`reservation-salles:latest`) :
  - Exécute Laravel (PHP 8.2)
  - Port 9000 (FastCGI)
  - Variables d'environnement depuis ConfigMap + Secret
  - Health checks (TCP socket)
  
- **Container Nginx** (`nginx:1.25-alpine`) :
  - Serveur web qui proxy vers PHP-FPM
  - Port 80 (HTTP)
  - Configuration custom via ConfigMap
  - Endpoint `/health` pour health checks

## 📋 Prérequis

### 1. Cluster Kubernetes

- Kubernetes 1.24+
- Accès `kubectl` configuré
- Namespace `reservation-salles` (créé automatiquement par Argo CD)

### 2. Dépendances du Cluster

#### Obligatoires :
- **Argo CD** : Pour le déploiement continu (voir [`argocd/README.md`](argocd/README.md))
- **Image Docker** : Votre image Laravel doit être buildée et poussée vers un registry (Docker Hub, GHCR, ECR, etc.)

#### Optionnelles mais recommandées :
- **Nginx Ingress Controller** : Pour exposer l'application via HTTP/HTTPS
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
  ```

- **cert-manager** : Pour les certificats TLS automatiques (Let's Encrypt)
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  ```

- **MySQL / MariaDB** : Base de données (peut être externe ou dans le cluster)
  ```bash
  # Exemple avec Helm
  helm install mysql bitnami/mysql \
    --set auth.rootPassword=rootpass \
    --set auth.database=reservation_prod \
    --namespace reservation-salles
  ```

- **Redis** : Pour cache et queues
  ```bash
  helm install redis bitnami/redis \
    --set auth.enabled=false \
    --namespace reservation-salles
  ```

## 🚀 Déploiement

### Étape 1 : Construire et Pousser l'Image Docker

```bash
# Depuis la racine du projet
docker build -t your-registry/reservation-salles:latest .
docker push your-registry/reservation-salles:latest
```

**Mettre à jour** `deployment.yaml` ligne 54 :
```yaml
image: your-registry/reservation-salles:latest  # Remplacer avec votre registry
```

### Étape 2 : Créer le Secret Kubernetes

```bash
# Copier le template
cp kubernetes/secret.yaml.example kubernetes/secret.yaml

# Générer APP_KEY depuis Laravel
php artisan key:generate --show
# Exemple de sortie : base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encoder en base64 pour Kubernetes
echo -n 'base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' | base64

# Encoder le mot de passe DB
echo -n 'your_db_password' | base64

# Éditer secret.yaml et remplacer les valeurs
nano kubernetes/secret.yaml
```

**Ou créer le secret directement via kubectl** :
```bash
kubectl create secret generic app-secrets \
  --from-literal=app-key='base64:YOUR_LARAVEL_APP_KEY' \
  --from-literal=db-password='YOUR_DB_PASSWORD' \
  --namespace=reservation-salles
```

⚠️ **Important** : **NE JAMAIS** commiter `secret.yaml` avec de vraies valeurs dans Git !

### Étape 3 : Adapter les ConfigMaps

Éditer `deployment.yaml` et ajuster les variables d'environnement :

```yaml
data:
  DB_HOST: mysql-service              # Nom du service MySQL
  DB_DATABASE: reservation_prod       # Nom de la base de données
  REDIS_HOST: redis-service           # Nom du service Redis
  # ... autres variables
```

### Étape 4 : Configurer l'Ingress (optionnel)

Éditer `ingress.yaml` et remplacer :
```yaml
- host: reservation.example.com  # Votre nom de domaine
```

Si vous n'utilisez pas cert-manager, supprimez l'annotation :
```yaml
cert-manager.io/cluster-issuer: letsencrypt-prod
```

### Étape 5 : Déployer via Argo CD

```bash
# Installer Argo CD (voir argocd/README.md)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Créer l'Application Argo CD
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# Vérifier le statut
kubectl -n argocd get applications
kubectl -n argocd describe application reservation

# Forcer la synchronisation (optionnel)
argocd app sync reservation
```

Argo CD va automatiquement :
1. Détecter les manifests dans `kubernetes/`
2. Créer le namespace `reservation-salles`
3. Appliquer tous les manifests (ConfigMap, Deployment, Service, Ingress)
4. Synchroniser automatiquement à chaque push sur `master`

### Étape 6 : Vérifier le Déploiement

```bash
# Vérifier les pods
kubectl -n reservation-salles get pods
kubectl -n reservation-salles logs -f deployment/laravel-app

# Vérifier le service
kubectl -n reservation-salles get svc

# Vérifier l'ingress
kubectl -n reservation-salles get ingress

# Tester en port-forward (si pas d'ingress)
kubectl -n reservation-salles port-forward svc/laravel-service 8080:80
# Ouvrir http://localhost:8080
```

### Étape 7 : Migrations et Seeders

```bash
# Exécuter les migrations dans un pod
kubectl -n reservation-salles exec -it deployment/laravel-app -c php-fpm -- php artisan migrate --force

# Ou créer un Job Kubernetes one-time
kubectl -n reservation-salles run migration-job \
  --image=your-registry/reservation-salles:latest \
  --restart=Never \
  --command -- php artisan migrate --force --seed
```

## 🔧 Configuration Production

### Variables d'Environnement

Les variables sont gérées via **ConfigMap** (non sensibles) et **Secret** (sensibles).

**ConfigMap** (`laravel-config`) :
- `APP_ENV`, `APP_DEBUG`, `LOG_CHANNEL`, `LOG_LEVEL`
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`
- `CACHE_DRIVER`, `REDIS_HOST`, `REDIS_PORT`
- `QUEUE_CONNECTION`, `SESSION_DRIVER`

**Secret** (`app-secrets`) :
- `app-key` : Laravel APP_KEY
- `db-password` : Mot de passe MySQL
- `redis-password` : Mot de passe Redis (optionnel)

### Ressources et Scaling

**Ressources par défaut** (dans `deployment.yaml`) :

| Container | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|-------------|-----------|----------------|--------------|
| PHP-FPM   | 250m        | 500m      | 256Mi          | 512Mi        |
| Nginx     | 50m         | 100m      | 64Mi           | 128Mi        |

**Replicas** : 3 (configurable)

Pour ajuster :
```yaml
spec:
  replicas: 5  # Augmenter pour plus de capacité
```

Pour activer l'autoscaling :
```bash
kubectl autoscale deployment laravel-app \
  --namespace=reservation-salles \
  --cpu-percent=70 \
  --min=3 \
  --max=10
```

### Stockage Persistant

Par défaut, le storage Laravel utilise **emptyDir** (volatile). Pour la production, utilisez un **PersistentVolumeClaim** :

```yaml
# Ajouter à deployment.yaml
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: laravel-storage
  namespace: reservation-salles
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard  # Adapter selon votre cluster

# Puis remplacer dans deployment.yaml :
volumes:
- name: storage
  persistentVolumeClaim:
    claimName: laravel-storage
```

## 🔐 Sécurité

### Secrets Management

**Option 1 : Sealed Secrets** (recommandé) :
```bash
# Installer sealed-secrets
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Créer un SealedSecret
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
kubectl apply -f sealed-secret.yaml
```

**Option 2 : External Secrets Operator** :
- Intégration avec AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, etc.
- https://external-secrets.io/

### Network Policies

Ajouter des NetworkPolicies pour restreindre le trafic :

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: laravel-netpol
  namespace: reservation-salles
spec:
  podSelector:
    matchLabels:
      app: laravel
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
```

## 🐛 Troubleshooting

### Pods ne démarrent pas

```bash
# Vérifier les événements
kubectl -n reservation-salles get events --sort-by=.metadata.creationTimestamp

# Vérifier les logs
kubectl -n reservation-salles logs -l app=laravel -c php-fpm --tail=100
kubectl -n reservation-salles logs -l app=laravel -c nginx --tail=100

# Décrire le pod
kubectl -n reservation-salles describe pod <pod-name>
```

**Causes communes** :
- Image Docker introuvable → Vérifier `image:` et imagePullSecrets
- Secret manquant → Créer `app-secrets`
- ConfigMap manquant → Appliquer `deployment.yaml`
- Probes échouent → Ajuster `initialDelaySeconds`

### Erreur "Connection refused" MySQL

```bash
# Vérifier que MySQL est accessible
kubectl -n reservation-salles run mysql-test --rm -it --image=mysql:8.0 -- mysql -h mysql-service -u root -p

# Vérifier le service MySQL
kubectl -n reservation-salles get svc mysql-service
```

### Erreur 502 Bad Gateway (Nginx)

```bash
# Vérifier que PHP-FPM écoute sur 9000
kubectl -n reservation-salles exec deployment/laravel-app -c php-fpm -- netstat -tlnp | grep 9000

# Vérifier la config Nginx
kubectl -n reservation-salles exec deployment/laravel-app -c nginx -- cat /etc/nginx/conf.d/default.conf
```

### Ingress ne fonctionne pas

```bash
# Vérifier l'Ingress Controller
kubectl -n ingress-nginx get pods

# Vérifier l'Ingress
kubectl -n reservation-salles describe ingress reservation-ingress

# Tester en port-forward direct
kubectl -n reservation-salles port-forward svc/laravel-service 8080:80
```

## 📊 Monitoring (optionnel)

### Prometheus + Grafana

```bash
# Installer kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

### Logging avec EFK Stack

```bash
# Elasticsearch, Fluentd, Kibana
kubectl apply -f https://raw.githubusercontent.com/elastic/cloud-on-k8s/main/deploy/eck-stack/all-in-one.yaml
```

## 🔄 Workflow CI/CD Complet

```
┌──────────────┐
│   Developer  │
│  git push    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  GitHub Actions  │  (ou Jenkins)
│  1. Run tests    │
│  2. Build image  │
│  3. Push to      │
│     registry     │
│  4. Update       │
│     manifests    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   GitHub Repo    │
│  kubernetes/     │
│  (updated)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│    Argo CD       │
│  1. Detect       │
│     changes      │
│  2. Sync         │
│  3. Deploy       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Kubernetes     │
│   Cluster        │
│   (Production)   │
└──────────────────┘
```

## 📚 Ressources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Argo CD Documentation](https://argo-cd.readthedocs.io/)
- [Laravel Deployment Best Practices](https://laravel.com/docs/11.x/deployment)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager](https://cert-manager.io/)

## 📞 Support

Pour toute question, consulter :
- README principal du projet
- Documentation CI dans `docs/CI-Pipeline-Documentation.md`
- Documentation Argo CD dans `kubernetes/argocd/README.md`

---

**Document généré le** : 12 Novembre 2025  
**Version** : 1.0  
**Auteur** : DevOps Team
