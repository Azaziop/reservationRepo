# 🚀 Guide de Déploiement en Production - Quick Start

## ✅ Prérequis
- Windows Server ou Windows 10/11 Pro
- IIS installé
- PHP 8.2+ avec extensions (voir IIS_CONFIGURATION.md)
- MySQL 8.0+
- Jenkins configuré (déjà fait ✓)

## 📋 Étapes de Déploiement

### 1. Configuration de la Base de Données (5 min)

```powershell
# Ouvrir MySQL en tant qu'administrateur
mysql -u root -p

# Dans MySQL, exécutez:
source C:\Users\zaoui\OneDrive\Documents\reservationRepo\setup-database.sql
```

Ou manuellement:
```sql
CREATE DATABASE reservation_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON reservation_prod.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configuration IIS (10 min)

**Option A: Script Automatique (Recommandé)**

Ouvrez PowerShell en tant qu'**Administrateur**:

```powershell
cd C:\Users\zaoui\OneDrive\Documents\reservationRepo
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-iis.ps1
```

**Option B: Configuration Manuelle**

Suivez le guide détaillé: [IIS_CONFIGURATION.md](IIS_CONFIGURATION.md)

### 3. Déclencher le Déploiement Jenkins

Jenkins déploie automatiquement après chaque commit sur `main`.

**Pour forcer un déploiement:**
1. Ouvrez: http://localhost:8080/job/reservation/
2. Cliquez sur **"Build Now"**
3. Attendez que le build soit **SUCCESS** (~5 min)

### 4. Vérification

```powershell
# Vérifier que l'application est déployée
Test-Path C:\inetpub\wwwroot\reservation\public\index.php

# Vérifier le fichier .env
Get-Content C:\inetpub\wwwroot\reservation\.env | Select-String "APP_ENV"

# Vérifier les logs
Get-Content C:\inetpub\wwwroot\reservation\storage\logs\laravel.log -Tail 20
```

Ouvrez votre navigateur: **http://localhost**

## 🎯 Workflow Complet

```
┌─────────────────────┐
│  1. Commit Code     │
│     (Git Push)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Jenkins Build   │
│  - Tests            │
│  - Linting          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Auto Deploy     │
│  - Copy Files       │
│  - Install Deps     │
│  - Migrate DB       │
│  - Cache Config     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. IIS Serve       │
│  http://localhost   │
└─────────────────────┘
```

## 🔧 Configuration Post-Déploiement

### Créer un Compte Admin

```powershell
cd C:\inetpub\wwwroot\reservation
php artisan tinker
```

Dans tinker:
```php
$user = new App\Models\User();
$user->name = 'Admin';
$user->email = 'admin@reservation.local';
$user->password = bcrypt('password123');
$user->role = 'admin';
$user->save();
```

### Configurer l'URL de Production

Si vous utilisez un domaine personnalisé, mettez à jour `.env.production`:

```env
APP_URL=http://votre-domaine.com
```

Puis re-déployez via Jenkins.

## 📊 Monitoring et Maintenance

### Voir les Logs en Temps Réel

```powershell
# Logs Laravel
Get-Content C:\inetpub\wwwroot\reservation\storage\logs\laravel.log -Wait

# Logs IIS
Get-Content C:\inetpub\logs\LogFiles\W3SVC1\*.log -Wait -Tail 10
```

### Vider les Caches

```powershell
cd C:\inetpub\wwwroot\reservation
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Redéployer Manuellement

Si Jenkins échoue, déploiement manuel:

```powershell
cd C:\inetpub\wwwroot\reservation

# Backup
$date = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "C:\inetpub\wwwroot\reservation" "C:\Backups\reservation_$date" -Recurse

# Update
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🐛 Dépannage Rapide

### Site ne charge pas (Erreur 500)
```powershell
# Vérifier permissions
icacls C:\inetpub\wwwroot\reservation\storage
icacls C:\inetpub\wwwroot\reservation\bootstrap\cache

# Vérifier logs
Get-Content C:\inetpub\wwwroot\reservation\storage\logs\laravel.log -Tail 50
```

### Assets CSS/JS ne chargent pas
```powershell
# Vérifier web.config
Test-Path C:\inetpub\wwwroot\reservation\public\web.config

# Reconstruire les assets
cd C:\Users\zaoui\OneDrive\Documents\reservationRepo
npm run build
git add public/build
git commit -m "chore: rebuild assets"
git push
```

### Base de données non accessible
```powershell
# Tester la connexion MySQL
mysql -u root -p -e "SHOW DATABASES;" | Select-String "reservation_prod"

# Vérifier .env
Get-Content C:\inetpub\wwwroot\reservation\.env | Select-String "DB_"
```

## 📞 Support

- **Documentation détaillée**: [IIS_CONFIGURATION.md](IIS_CONFIGURATION.md)
- **Logs Laravel**: `C:\inetpub\wwwroot\reservation\storage\logs\`
- **Logs Jenkins**: http://localhost:8080/job/reservation/lastBuild/console
- **Logs IIS**: `C:\inetpub\logs\LogFiles\`

## 🎉 Prêt!

Une fois tout configuré:
- ✅ Jenkins déploie automatiquement
- ✅ IIS sert l'application
- ✅ Base de données configurée
- ✅ Logs disponibles

**Accédez à votre application**: http://localhost
