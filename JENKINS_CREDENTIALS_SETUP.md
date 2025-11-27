# 🔐 Configuration des Credentials Jenkins

Ce guide explique comment configurer les credentials nécessaires pour le pipeline CI/CD complet.

## 📋 Prérequis

- Jenkins installé et configuré (http://localhost:8080)
- Compte Docker Hub OU GitHub Container Registry (GHCR)
- Accès administrateur à Jenkins

---

## 1️⃣ Créer un Token Docker Hub (Option A)

### Étape 1: Créer un Access Token

1. Connectez-vous à [Docker Hub](https://hub.docker.com)
2. Allez dans **Account Settings** → **Security**
3. Cliquez sur **New Access Token**
4. Nommez le token: `jenkins-ci-push`
5. Permissions: **Read, Write, Delete**
6. Cliquez **Generate**
7. **COPIEZ LE TOKEN IMMÉDIATEMENT** (il ne sera plus affiché)

### Étape 2: Configuration dans Jenkinsfile

Modifiez `Jenkinsfile` ligne 23-24:

```groovy
DOCKER_REGISTRY = 'docker.io'
DOCKER_USERNAME = 'votre-username-dockerhub'  // Remplacez ici
```

---

## 2️⃣ Utiliser GitHub Container Registry (Option B)

### Étape 1: Créer un Personal Access Token (PAT)

1. Allez sur [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Cliquez **Generate new token (classic)**
3. Nommez le token: `jenkins-ghcr-push`
4. Permissions requises:
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
   - ✅ `delete:packages` (Delete packages from GitHub Package Registry)
5. Cliquez **Generate token**
6. **COPIEZ LE TOKEN** (il ne sera plus affiché)

### Étape 2: Configuration dans Jenkinsfile

Modifiez `Jenkinsfile` ligne 23-24:

```groovy
DOCKER_REGISTRY = 'ghcr.io'
DOCKER_USERNAME = 'azaziop'  // Votre nom d'utilisateur GitHub (minuscules)
```

---

## 3️⃣ Ajouter les Credentials dans Jenkins

### Méthode 1: Via l'interface Web (Recommandé)

1. Ouvrez Jenkins: http://localhost:8080
2. Allez dans **Manage Jenkins** (Administrer Jenkins)
3. Cliquez sur **Credentials** (Informations d'identification)
4. Cliquez sur **(global)** domain
5. Cliquez sur **Add Credentials** (Ajouter des identifiants)

#### Configuration du formulaire:

- **Kind**: `Username with password`
- **Scope**: `Global`
- **Username**: 
  - Docker Hub: votre nom d'utilisateur Docker Hub
  - GHCR: votre nom d'utilisateur GitHub (minuscules)
- **Password**: 
  - Docker Hub: le token généré (pas votre mot de passe!)
  - GHCR: le Personal Access Token GitHub
- **ID**: `docker-registry-credentials` ⚠️ **IMPORTANT: utilisez exactement cet ID**
- **Description**: `Docker Registry Credentials (Docker Hub or GHCR)`

6. Cliquez **Create**

### Méthode 2: Via Jenkins CLI (Avancé)

```bash
# Pour Docker Hub
echo '<password>YOUR_DOCKER_TOKEN</password>' | jenkins-cli create-credentials-by-xml system::system::jenkins \
  -r '(global)' \
  --stdin

# Pour GHCR
echo '<password>YOUR_GITHUB_PAT</password>' | jenkins-cli create-credentials-by-xml system::system::jenkins \
  -r '(global)' \
  --stdin
```

---

## 4️⃣ Configurer Git Credentials pour GitOps ⚠️ OBLIGATOIRE

Pour que Jenkins puisse pousser les changements vers GitHub (mise à jour des manifests Kubernetes), vous devez configurer un credential GitHub.

### Étape 1: Créer un Personal Access Token (PAT) GitHub

1. Allez sur [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Cliquez **Generate new token (classic)**
3. Nommez le token: `jenkins-gitops-push`
4. Permissions **REQUISES**:
   - ✅ `repo` (Full control of private repositories)
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ security_events
5. **Expiration**: Choisissez 90 days ou No expiration
6. Cliquez **Generate token**
7. **COPIEZ LE TOKEN** immédiatement (il ne sera plus visible)

### Étape 2: Ajouter le Credential dans Jenkins

1. Ouvrez Jenkins: http://localhost:8080
2. Allez dans **Manage Jenkins** → **Credentials**
3. Cliquez sur **(global)** domain
4. Cliquez sur **Add Credentials**
5. Configuration:
   - **Kind**: `Username with password`
   - **Scope**: `Global`
   - **Username**: `Azaziop` (votre nom d'utilisateur GitHub)
   - **Password**: Collez le PAT GitHub que vous venez de créer
   - **ID**: `github-credentials` ⚠️ **IMPORTANT: utilisez exactement cet ID**
   - **Description**: `GitHub Push Credentials for GitOps`
6. Cliquez **Create**

---

## ✅ Récapitulatif des Credentials Jenkins

Vous devez avoir **2 credentials** configurés dans Jenkins :

| Credential ID | Type | Usage | Username | Password/Token |
|---------------|------|-------|----------|----------------|
| `docker-registry-credentials` | Username with password | Push images Docker | `azaziop` | Token Docker Hub |
| `github-credentials` | Username with password | Push GitOps updates | `Azaziop` | PAT GitHub (repo) |

```bash
# Générer une clé SSH
ssh-keygen -t ed25519 -C "jenkins@ci.local" -f ~/.ssh/jenkins_github

# Ajouter la clé publique à GitHub
cat ~/.ssh/jenkins_github.pub
# Copiez et ajoutez dans GitHub Settings → SSH keys

# Ajouter la clé privée à Jenkins
# Jenkins → Credentials → Add Credentials
# Kind: SSH Username with private key
```

### Modifier le stage GitOps dans Jenkinsfile

Si vous utilisez des credentials Git différents, modifiez le stage `Update Kubernetes Manifests`:

```groovy
stage('Update Kubernetes Manifests') {
    steps {
        script {
            withCredentials([usernamePassword(
                credentialsId: 'github-credentials',
                usernameVariable: 'GIT_USER',
                passwordVariable: 'GIT_PASS'
            )]) {
                bat """
                    git config user.email "jenkins@ci.local"
                    git config user.name "Jenkins CI"
                    git remote set-url origin https://%GIT_USER%:%GIT_PASS%@github.com/Azaziop/reservationRepo.git
                    git push origin HEAD:master
                """
            }
        }
    }
}
```

---

## 5️⃣ Vérifier la Configuration

### Vérification 1: Credentials présents dans Jenkins

1. Allez dans **Manage Jenkins** → **Credentials** → **(global)**
2. Vous devez voir **exactement 2 credentials** :
   - ✅ `docker-registry-credentials` - Docker Registry Credentials
   - ✅ `github-credentials` - GitHub Push Credentials for GitOps

### Vérification 2: Tester le credential Docker

Dans Jenkins → **Manage Jenkins** → **Script Console**, exécutez :

```groovy
withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
    println "Docker Username: ${USER}"
    println "Docker Password exists: ${PASS ? 'YES' : 'NO'}"
}
```

### Vérification 3: Tester le credential GitHub

Dans Jenkins → **Manage Jenkins** → **Script Console**, exécutez :

```groovy
withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
    println "GitHub Username: ${USER}"
    println "GitHub Token exists: ${PASS ? 'YES' : 'NO'}"
}
```

### Vérification 4: Test complet du pipeline

Lancez un build du pipeline et vérifiez que :
- ✅ Le stage "Build Docker Image" se termine avec succès
- ✅ Le stage "Push Docker Image" réussit à pousser l'image
- ✅ Le stage "Update Kubernetes Manifests" commit et push vers GitHub

### Test 2: Vérifier les Credentials

```groovy
// Dans Jenkins Script Console
import com.cloudbees.plugins.credentials.*

def creds = CredentialsProvider.lookupCredentials(
    com.cloudbees.plugins.credentials.common.StandardUsernamePasswordCredentials.class,
    Jenkins.instance,
    null,
    null
)

creds.each { c ->
    println("ID: ${c.id}, Description: ${c.description}")
}
```

Devrait lister `docker-registry-credentials`.

### Test 3: Build manuel

1. Allez dans votre job Jenkins
2. Cliquez **Build Now**
3. Regardez la console output
4. Vérifiez que:
   - ✅ Docker build réussit
   - ✅ Docker push réussit
   - ✅ Git push réussit

---

## 6️⃣ Variables d'Environnement à Configurer

Dans `Jenkinsfile`, vérifiez et modifiez ces valeurs (lignes 23-28):

```groovy
// Configuration Docker & Registry
DOCKER_REGISTRY = 'docker.io'         // OU 'ghcr.io'
DOCKER_USERNAME = 'yourusername'      // ⚠️ À MODIFIER
IMAGE_NAME = 'reservation-salles'     // Nom de l'image (peut être changé)
IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"  // Format du tag (OK)
```

**Exemple Docker Hub:**
```groovy
DOCKER_REGISTRY = 'docker.io'
DOCKER_USERNAME = 'johndoe'
// Résultat: docker.io/johndoe/reservation-salles:42-a1b2c3d
```

**Exemple GHCR:**
```groovy
DOCKER_REGISTRY = 'ghcr.io'
DOCKER_USERNAME = 'azaziop'
// Résultat: ghcr.io/azaziop/reservation-salles:42-a1b2c3d
```

---

## 7️⃣ Troubleshooting

### ❌ Erreur: "docker: command not found"

**Solution**: Docker n'est pas installé sur l'agent Jenkins

```powershell
# Installer Docker Desktop sur Windows
# Télécharger: https://www.docker.com/products/docker-desktop

# Vérifier installation
docker --version
```

### ❌ Erreur: "credential not found"

**Solution**: L'ID du credential ne correspond pas

Vérifiez que dans Jenkins Credentials, l'ID est **exactement**: `docker-registry-credentials`

### ❌ Erreur: "denied: access forbidden"

**Solution**: Token Docker Hub expiré ou permissions insuffisantes

1. Régénérez un nouveau token avec permissions **Read, Write, Delete**
2. Mettez à jour le credential dans Jenkins

### ❌ Erreur: "failed to push: permission denied"

**Solution GHCR**: Le PAT GitHub n'a pas les bonnes permissions

1. Vérifiez que le PAT a `write:packages`
2. Vérifiez que le nom d'utilisateur est en **minuscules**
3. Le repository doit être public OU le PAT doit avoir `repo` scope

### ❌ Erreur: "git push failed"

**Solution**: Credentials Git manquants ou incorrects

1. Ajoutez un credential GitHub avec scope `repo`
2. Modifiez le stage GitOps pour utiliser ce credential (voir section 4)

### ❌ L'image ne se construit pas

**Solution**: Vérifier le Dockerfile

```powershell
# Tester localement
cd C:\Users\zaoui\OneDrive\Documents\reservationRepo
docker build -t test-image .
```

---

## 8️⃣ Sécurité - Bonnes Pratiques

### ✅ À FAIRE

- Utiliser des Access Tokens (PAS les mots de passe)
- Limiter les permissions des tokens au strict nécessaire
- Faire expirer les tokens régulièrement (3-6 mois)
- Utiliser des credentials Jenkins (ne jamais coder en dur)
- Activer l'audit logging dans Jenkins

### ❌ NE PAS FAIRE

- ❌ Mettre les tokens dans le code source
- ❌ Utiliser votre mot de passe personnel
- ❌ Donner des permissions `admin` aux tokens
- ❌ Partager les tokens par email/Slack
- ❌ Commit les tokens dans Git

---

## 9️⃣ Checklist Finale

Avant de lancer le pipeline, vérifiez:

- [ ] Docker Desktop installé et démarré
- [ ] Token Docker Hub OU GitHub PAT créé
- [ ] Credential `docker-registry-credentials` ajouté dans Jenkins
- [ ] `DOCKER_USERNAME` modifié dans Jenkinsfile
- [ ] `DOCKER_REGISTRY` configuré (docker.io ou ghcr.io)
- [ ] Git credentials configurés (pour GitOps push)
- [ ] Test Docker: `docker --version` fonctionne
- [ ] Test build local: `docker build -t test .` fonctionne

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifiez les logs Jenkins: http://localhost:8080/job/reservation/lastBuild/console
2. Testez Docker localement: `docker build -t test .`
3. Vérifiez que les credentials sont bien configurés
4. Consultez la documentation:
   - [Docker Hub Tokens](https://docs.docker.com/docker-hub/access-tokens/)
   - [GitHub PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
   - [Jenkins Credentials](https://www.jenkins.io/doc/book/using/using-credentials/)

---

**Document créé le**: 12 Novembre 2025  
**Auteur**: DevOps Team  
**Version**: 1.0
