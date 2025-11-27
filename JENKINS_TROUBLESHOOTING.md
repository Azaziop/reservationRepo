# 🔧 Jenkins Pipeline - Guide de Dépannage

## 🚨 Erreurs Courantes et Solutions

### ❌ Erreur: "Push échoué - vérifier les credentials Git"

**Symptôme:**
```
git push origin HEAD:master || echo "Push échoué - vérifier les credentials Git"
Sending interrupt signal to process
"Push échoué - vérifier les credentials Git"
```

**Cause:** Jenkins n'a pas de credentials configurés pour pousser vers GitHub.

**Solution:**

1. **Créer un Personal Access Token GitHub:**
   - Allez sur https://github.com/settings/tokens
   - Cliquez "Generate new token (classic)"
   - Cochez `repo` (full control)
   - Générez et copiez le token

2. **Ajouter dans Jenkins:**
   - Jenkins → Manage Jenkins → Credentials → (global)
   - Add Credentials:
     - Kind: `Username with password`
     - Username: `Azaziop`
     - Password: votre PAT GitHub
     - ID: `github-credentials`
   - Create

3. **Relancer le pipeline**

---

### ❌ Erreur: "docker login failed"

**Symptôme:**
```
Error response from daemon: Get "https://registry-1.docker.io/v2/": unauthorized
```

**Cause:** Token Docker Hub invalide ou credential manquant.

**Solution:**

1. **Vérifier le token Docker Hub:**
   - Connectez-vous sur https://hub.docker.com
   - Account Settings → Security → Access Tokens
   - Vérifiez que le token existe et n'a pas expiré
   - Si nécessaire, générez un nouveau token

2. **Mettre à jour le credential Jenkins:**
   - Jenkins → Credentials → docker-registry-credentials → Update
   - Mettez à jour le password avec le nouveau token
   - Save

---

### ❌ Erreur: "credentialsId not found"

**Symptôme:**
```
hudson.AbortException: No credentials specified
```

**Cause:** Le credential ID dans le Jenkinsfile ne correspond pas à celui configuré dans Jenkins.

**Solution:**

Vérifiez que vos credentials ont les **IDs exacts** :
- `docker-registry-credentials` pour Docker Hub
- `github-credentials` pour GitHub

---

### ❌ Erreur: HEAD detached

**Symptôme:**
```
HEAD detached at 1b28c84
no changes added to commit
```

**Cause:** Jenkins checkout en mode detached HEAD (normal pour les builds).

**Solution:** Cette erreur est **normale** et n'empêche pas le pipeline de fonctionner. Le commit est créé mais sur une branche détachée. Le push pousse directement sur `master`.

---

### ❌ Erreur: "npm install failed"

**Symptôme:**
```
npm ERR! code ENOENT
npm ERR! syscall open
```

**Cause:** Node.js ou npm non installé sur l'agent Jenkins.

**Solution:**

1. **Installer Node.js sur Windows:**
   ```powershell
   # Téléchargez et installez depuis https://nodejs.org
   # Ou utilisez Chocolatey:
   choco install nodejs-lts -y
   ```

2. **Redémarrer Jenkins:**
   ```powershell
   Restart-Service Jenkins
   ```

---

### ❌ Erreur: "php command not found"

**Cause:** PHP non installé ou pas dans le PATH.

**Solution:**

1. **Vérifier PHP:**
   ```powershell
   php -v
   ```

2. **Ajouter PHP au PATH:**
   ```powershell
   # Éditer variables d'environnement système
   # Ajouter C:\php à la variable PATH
   ```

---

## 🛠️ Commandes de Diagnostic

### Vérifier les credentials Jenkins

Dans **Jenkins → Manage Jenkins → Script Console** :

```groovy
// Lister tous les credentials
import com.cloudbees.plugins.credentials.CredentialsProvider
import jenkins.model.Jenkins

def creds = CredentialsProvider.lookupCredentials(
    com.cloudbees.plugins.credentials.common.StandardCredentials.class,
    Jenkins.instance,
    null,
    null
)

creds.each { c ->
    println("${c.id} - ${c.description}")
}
```

### Tester la connexion Docker Hub

```powershell
docker login docker.io -u azaziop -p YOUR_TOKEN
docker push docker.io/azaziop/reservation-salles:test
```

### Tester la connexion GitHub

```powershell
git clone https://YOUR_USERNAME:YOUR_PAT@github.com/Azaziop/reservationRepo.git test-clone
cd test-clone
echo "test" > test.txt
git add test.txt
git commit -m "test"
git push origin master
```

---

## 📞 Checklist avant de relancer le pipeline

- [ ] Docker Desktop est démarré
- [ ] Le credential `docker-registry-credentials` existe dans Jenkins
- [ ] Le credential `github-credentials` existe dans Jenkins
- [ ] PHP est installé et accessible (`php -v`)
- [ ] Node.js est installé et accessible (`node -v`)
- [ ] Composer est installé (`composer --version`)
- [ ] MySQL est démarré

---

## 🔍 Logs détaillés

### Activer les logs Jenkins

1. **Manage Jenkins** → **System Log** → **Add new log recorder**
2. Nom: `Pipeline Debug`
3. Loggers:
   - `org.jenkinsci.plugins.workflow` → `ALL`
   - `hudson.plugins.git` → `ALL`

### Voir les logs en temps réel

Dans le build, cliquez sur **Console Output** pour voir les logs complets.

---

## 📚 Ressources

- [Jenkins Credentials Plugin](https://plugins.jenkins.io/credentials/)
- [Docker Hub Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
