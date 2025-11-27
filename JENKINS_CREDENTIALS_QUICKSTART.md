# ⚡ Configuration Rapide des Credentials Jenkins

Ce guide vous permet de configurer rapidement les 2 credentials nécessaires pour le pipeline CI/CD.

---

## 📋 Vue d'ensemble

Vous avez besoin de **2 credentials** :

| # | Credential | Usage | ID Jenkins |
|---|------------|-------|------------|
| 1 | Docker Hub Token | Push des images Docker | `docker-registry-credentials` |
| 2 | GitHub PAT | Push GitOps vers repo | `github-credentials` |

---

## 🔑 Credential 1 : Docker Hub

### Étape 1 : Créer un token Docker Hub

1. Allez sur https://hub.docker.com/settings/security
2. Cliquez **New Access Token**
3. Token description : `jenkins-ci-push`
4. Access permissions : **Read, Write, Delete**
5. **Generate** → **Copiez le token** (ne sera plus visible)

### Étape 2 : Ajouter dans Jenkins

1. Jenkins → **Manage Jenkins** → **Credentials** → **(global)** → **Add Credentials**
2. Remplissez :
   ```
   Kind:        Username with password
   Scope:       Global
   Username:    azaziop
   Password:    [COLLEZ LE TOKEN DOCKER HUB]
   ID:          docker-registry-credentials
   Description: Docker Registry Credentials (Docker Hub)
   ```
3. **Create**

---

## 🔑 Credential 2 : GitHub

### Étape 1 : Créer un Personal Access Token

1. Allez sur https://github.com/settings/tokens
2. Cliquez **Generate new token** → **Generate new token (classic)**
3. Token name : `jenkins-gitops-push`
4. Expiration : **90 days** (ou No expiration)
5. Cochez les permissions :
   ```
   ✅ repo (Full control of private repositories)
      ✅ repo:status
      ✅ repo_deployment
      ✅ public_repo
      ✅ repo:invite
      ✅ security_events
   ```
6. **Generate token** → **Copiez le token** (ne sera plus visible)

### Étape 2 : Ajouter dans Jenkins

1. Jenkins → **Manage Jenkins** → **Credentials** → **(global)** → **Add Credentials**
2. Remplissez :
   ```
   Kind:        Username with password
   Scope:       Global
   Username:    Azaziop
   Password:    [COLLEZ LE PAT GITHUB]
   ID:          github-credentials
   Description: GitHub Push Credentials for GitOps
   ```
3. **Create**

---

## ✅ Vérification

### Dans Jenkins UI

1. Allez dans **Manage Jenkins** → **Credentials** → **(global)**
2. Vous devez voir :
   - ✅ `docker-registry-credentials`
   - ✅ `github-credentials`

### Test via Script Console

Dans **Manage Jenkins** → **Script Console**, testez :

```groovy
// Test Docker credential
withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'U', passwordVariable: 'P')]) {
    println "✅ Docker credential OK - User: ${U}"
}

// Test GitHub credential
withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'U', passwordVariable: 'P')]) {
    println "✅ GitHub credential OK - User: ${U}"
}
```

Vous devriez voir :
```
✅ Docker credential OK - User: azaziop
✅ GitHub credential OK - User: Azaziop
```

---

## 🚀 Lancer le Pipeline

Une fois les 2 credentials configurés :

1. Allez dans votre job Jenkins
2. Cliquez **Build Now**
3. Le pipeline devrait :
   - ✅ Build l'image Docker
   - ✅ Push vers Docker Hub
   - ✅ Commit et push vers GitHub

---

## 🆘 En cas de problème

### Erreur "credentialsId not found"

➡️ Vérifiez que les IDs sont **exactement** :
- `docker-registry-credentials`
- `github-credentials`

### Erreur "unauthorized" Docker

➡️ Vérifiez que :
1. Le token Docker Hub est valide
2. L'username est `azaziop` (lowercase)
3. Le token a les permissions Read, Write, Delete

### Erreur "push failed" GitHub

➡️ Vérifiez que :
1. Le PAT GitHub a la permission `repo`
2. Le PAT n'est pas expiré
3. L'username GitHub est correct

---

## 📝 Notes de Sécurité

⚠️ **IMPORTANT** :
- Ne commitez JAMAIS les tokens dans Git
- Stockez les tokens de backup dans un gestionnaire de mots de passe
- Régénérez les tokens si vous soupçonnez une fuite
- Utilisez des tokens avec permissions minimales

---

## ✨ C'est tout !

Votre pipeline Jenkins est maintenant configuré avec les credentials nécessaires.

**Prochaine étape** : Consultez `DEPLOYMENT_GUIDE.md` pour les instructions de déploiement (Kubernetes/Argo non inclus dans ce dépôt).
