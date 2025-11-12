# Argo CD - Reservation Application

Ce dossier contient les manifests et les instructions pour déployer l'application `reservation` via Argo CD.

Fichiers :

- `application-reservation.yaml` : Argo CD Application qui pointe sur `https://github.com/Azaziop/reservationRepo.git`, `path: kubernetes`, `targetRevision: master`.

Assumptions (à vérifier) :

- Le cluster Kubernetes contient Argo CD dans le namespace `argocd`.
- Vous souhaitez déployer dans le namespace `reservation-prod` (le manifeste Application crée ce namespace automatiquement via `CreateNamespace=true`).
- Le répertoire `kubernetes/` à la racine du repo contient les manifests Kubernetes (déploiement, services, ingress, etc.).

Installation rapide d'Argo CD (exemples) :

1. Installer Argo CD (kubectl) :

```bash
# Créer le namespace argocd
kubectl create namespace argocd

# Installer Argo CD (manifests officiels)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

2. Récupérer le mot de passe initial et se connecter (Argocd server exposé via port-forward) :

```bash
# Port-forward l'UI Argo CD (local)
kubectl -n argocd port-forward svc/argocd-server 8080:443

# Mot de passe initial (admin) :
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 --decode

# Ensuite, ouvrez https://localhost:8080 et authentifiez-vous (user: admin)
```

3. Créer l'Application Argo CD :

```bash
# Appliquer le manifeste Application
kubectl apply -f kubernetes/argocd/application-reservation.yaml

# Ou avec l'CLI argocd :
argocd login <ARGOCD_SERVER> --username admin --password <PWD>
argocd app create reservation \
  --repo https://github.com/Azaziop/reservationRepo.git \
  --path kubernetes \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace reservation-prod \
  --sync-policy automated --self-heal --prune

# Syncer / vérifier :
kubectl -n argocd get applications.argoproj.io reservation -o yaml
argocd app get reservation
argocd app sync reservation
```

Notes et prochaines étapes recommandées :

- Vérifier et ajuster `destination.namespace` dans `application-reservation.yaml` si vous préférez un autre namespace.
- Protéger les credentials GitHub/cluster si nécessaires (utiliser `argocd repo add` pour référencer un repo privé, ou Jenkins secrets pour push automatique de manifests).
- Ajouter un processus CI → Git (push manifests sous `kubernetes/`) pour que Argo CD déploie automatiquement.
- Envisager un `app-of-apps` si vous voulez regrouper plusieurs environnements (staging, production).

Si vous voulez, je peux :

- Modifier `application-reservation.yaml` pour pointer vers `main` au lieu de `master` (si vous préférez),
- Créer un `kustomization` dans `kubernetes/` pour gérer overlays (staging/prod),
- Fournir le manifeste d'un `AppProject` ArgoCD pour restreindre les destinations.

---

Document généré automatiquement. Vérifiez les assumptions avant d'appliquer en production.
