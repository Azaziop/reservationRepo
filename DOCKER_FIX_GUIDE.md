# Guide de correction du problème ERR_EMPTY_RESPONSE

## Diagnostic du problème

Le problème vient du fait que votre Dockerfile actuel crée deux images séparées :
1. **php-runtime** : Contient PHP-FPM (écoute sur le port 9000)
2. **nginx-runtime** : Contient Nginx (écoute sur le port 80)

Nginx a besoin de communiquer avec PHP-FPM, mais dans un seul conteneur, ils ne peuvent pas communiquer.

## Solutions disponibles

### ✅ Solution 1 : Docker Compose (RECOMMANDÉ)

Cette solution lance les deux services ensemble avec un conteneur MySQL.

#### Étapes :

1. **Arrêter tous les conteneurs existants**
```powershell
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
```

2. **Créer un fichier .env si nécessaire**
```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

3. **Lancer avec Docker Compose**
```powershell
docker-compose -f docker-compose.prod.yaml up -d
```

4. **Vérifier que tout fonctionne**
```powershell
docker-compose -f docker-compose.prod.yaml ps
docker-compose -f docker-compose.prod.yaml logs -f nginx
```

5. **Accéder à l'application**
```
http://localhost:8080
```

#### Commandes utiles :

```powershell
# Voir les logs
docker-compose -f docker-compose.prod.yaml logs -f

# Redémarrer
docker-compose -f docker-compose.prod.yaml restart

# Arrêter
docker-compose -f docker-compose.prod.yaml down

# Rebuild et restart
docker-compose -f docker-compose.prod.yaml up -d --build
```

---

### ✅ Solution 2 : Conteneur unique (Dockerfile.single)

Cette solution combine PHP-FPM et Nginx dans un seul conteneur avec Supervisor.

#### Étapes :

1. **Construire l'image**
```powershell
docker build -f Dockerfile.single -t reservation-salles:combined .
```

2. **Lancer le conteneur**
```powershell
docker run -d `
  --name reservation-app `
  -p 8080:80 `
  -v ${PWD}/.env:/var/www/html/.env:ro `
  reservation-salles:combined
```

3. **Vérifier les logs**
```powershell
docker logs -f reservation-app
```

4. **Accéder à l'application**
```
http://localhost:8080
```

---

### ✅ Solution 3 : Modifier le Dockerfile actuel

Mettre à jour le Jenkinsfile pour construire le stage `combined-runtime` au lieu de `php-runtime`.

---

## Tests de diagnostic

### Vérifier si les conteneurs sont en cours d'exécution
```powershell
docker ps
```

### Vérifier les logs d'un conteneur
```powershell
docker logs <container-id>
```

### Tester l'endpoint de santé
```powershell
Invoke-WebRequest -Uri http://localhost:8080/health
```

### Se connecter au conteneur
```powershell
docker exec -it <container-name> /bin/sh
```

### Vérifier si PHP-FPM fonctionne (dans le conteneur)
```sh
ps aux | grep php-fpm
netstat -tlnp | grep 9000
```

### Vérifier si Nginx fonctionne (dans le conteneur)
```sh
ps aux | grep nginx
netstat -tlnp | grep 80
```

---

## Quelle solution choisir ?

| Solution | Avantages | Inconvénients | Usage |
|----------|-----------|---------------|-------|
| **Docker Compose** | ✅ Meilleure pratique<br>✅ Séparation des services<br>✅ Facile à déboguer<br>✅ Inclut MySQL | ❌ Nécessite docker-compose | 🎯 **Développement & Production** |
| **Conteneur unique** | ✅ Simple à déployer<br>✅ Une seule image | ❌ Moins flexible<br>❌ Pas de MySQL inclus | Production simple |
| **Modifier Jenkinsfile** | ✅ Intégré au CI/CD | ❌ Nécessite rebuild | CI/CD production |

## Recommandation finale

**Utilisez la Solution 1 (Docker Compose)** pour le développement local et les tests.

Pour la production avec Kubernetes, vous utiliseriez déjà des Pods séparés, donc le Dockerfile actuel est correct.

---

## Problèmes courants et solutions

### Problème : Port 8080 déjà utilisé
```powershell
# Changer le port dans docker-compose.prod.yaml ou utiliser un autre port
docker run -p 8081:80 ...
```

### Problème : Permission denied sur .env
```powershell
# Donner les bonnes permissions
icacls .env /grant Everyone:R
```

### Problème : MySQL ne démarre pas
```powershell
# Vérifier les logs
docker-compose -f docker-compose.prod.yaml logs mysql

# Supprimer le volume et recommencer
docker-compose -f docker-compose.prod.yaml down -v
docker-compose -f docker-compose.prod.yaml up -d
```

### Problème : 502 Bad Gateway
Cela signifie que Nginx ne peut pas atteindre PHP-FPM.
- Vérifier que PHP-FPM est en cours d'exécution
- Vérifier la configuration Nginx (fastcgi_pass)
- Pour Docker Compose, vérifier les noms de service

---

## Pour aller plus loin

### Créer une image combinée pour production
Si vous voulez déployer le conteneur unique en production, mettez à jour le Jenkinsfile :

```groovy
stage('Build Docker Image') {
    steps {
        bat """
            docker build -f Dockerfile.single ^
                         -t ${DOCKER_REGISTRY}/${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} ^
                         .
        """
    }
}
```
