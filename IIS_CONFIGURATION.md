# Guide de Configuration IIS pour l'Application de Réservation

## Étape 1: Installer les Prérequis IIS

### 1.1 Activer IIS et les fonctionnalités nécessaires
Ouvrez PowerShell en tant qu'Administrateur et exécutez:

```powershell
# Installer IIS avec les fonctionnalités nécessaires
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CGI
Enable-WindowsOptionalFeature -Online -FeatureName IIS-ASPNET45
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLRewrite
```

### 1.2 Installer URL Rewrite Module
Si ce n'est pas déjà fait, téléchargez et installez le module URL Rewrite:
https://www.iis.net/downloads/microsoft/url-rewrite

## Étape 2: Configurer le Site IIS

### 2.1 Créer un nouveau site dans IIS Manager

1. Ouvrez **IIS Manager** (tapez `inetmgr` dans le menu Démarrer)
2. Clic droit sur **Sites** → **Add Website**
3. Configurez:
   - **Site name**: ReservationApp
   - **Physical path**: `C:\inetpub\wwwroot\reservation\public`
   - **Binding**: 
     - Type: http
     - IP address: All Unassigned
     - Port: 80
     - Host name: (vide ou votre nom de domaine)

### 2.2 Configurer le Pool d'Application

1. Dans IIS Manager, allez dans **Application Pools**
2. Trouvez le pool **ReservationApp**
3. Clic droit → **Advanced Settings**
4. Configurez:
   - **.NET CLR Version**: No Managed Code
   - **Enable 32-Bit Applications**: False
   - **Identity**: ApplicationPoolIdentity ou un compte spécifique

### 2.3 Configurer FastCGI pour PHP

1. Ouvrez **IIS Manager**
2. Sélectionnez le serveur (niveau racine)
3. Double-cliquez sur **Handler Mappings**
4. Cliquez **Add Module Mapping**:
   - **Request path**: `*.php`
   - **Module**: FastCgiModule
   - **Executable**: `C:\path\to\php\php-cgi.exe` (chemin vers PHP)
   - **Name**: PHP via FastCGI

## Étape 3: Configurer les Permissions

### 3.1 Permissions sur les dossiers

Exécutez dans PowerShell (Admin):

```powershell
# Donner les permissions au pool d'application IIS
$path = "C:\inetpub\wwwroot\reservation"

# Permissions pour IIS_IUSRS (lecture/exécution)
icacls "$path" /grant "IIS_IUSRS:(OI)(CI)RX" /T

# Permissions d'écriture pour storage et bootstrap/cache
icacls "$path\storage" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "$path\bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

## Étape 4: Créer la Base de Données de Production

### 4.1 Créer la base MySQL

Ouvrez MySQL et exécutez:

```sql
CREATE DATABASE IF NOT EXISTS reservation_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON reservation_prod.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 4.2 Exécuter les migrations (si pas fait par Jenkins)

```powershell
cd C:\inetpub\wwwroot\reservation
php artisan migrate --force --env=production
```

## Étape 5: Vérification et Tests

### 5.1 Vérifier la configuration

```powershell
cd C:\inetpub\wwwroot\reservation

# Vérifier que .env existe
Get-Content .env | Select-String "APP_ENV"

# Tester la configuration
php artisan config:show app
```

### 5.2 Tester l'accès

1. Ouvrez un navigateur
2. Allez à: `http://localhost`
3. Vous devriez voir l'application de réservation

### 5.3 Vérifier les logs

Les logs se trouvent dans:
- Application Laravel: `C:\inetpub\wwwroot\reservation\storage\logs\laravel.log`
- IIS: `C:\inetpub\logs\LogFiles`

## Étape 6: Optimisations Production

### 6.1 Optimiser Laravel

Ces commandes sont déjà exécutées par Jenkins, mais pour référence:

```powershell
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 6.2 Configurer le Cache OPcache PHP

Dans votre `php.ini`:

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

## Étape 7: Sécurité

### 7.1 Masquer les informations PHP

Dans `php.ini`:

```ini
expose_php = Off
display_errors = Off
log_errors = On
error_log = C:\logs\php_errors.log
```

### 7.2 Configurer HTTPS (Recommandé)

1. Obtenir un certificat SSL
2. Dans IIS Manager, ajoutez un binding HTTPS:
   - Type: https
   - Port: 443
   - SSL certificate: votre certificat

3. Mettre à jour `.env.production`:
```
APP_URL=https://votre-domaine.com
```

## Dépannage

### Erreur 500
- Vérifier les permissions sur `storage` et `bootstrap/cache`
- Vérifier les logs: `storage/logs/laravel.log`
- Vérifier que `.env` existe avec `APP_KEY` défini

### Page blanche
- Activer les erreurs temporairement dans `.env`: `APP_DEBUG=true`
- Vérifier les logs IIS dans `C:\inetpub\logs\LogFiles`

### Assets (CSS/JS) non chargés
- Vérifier que le répertoire physique pointe vers `public`
- Vérifier que `web.config` est dans `public`
- Exécuter: `php artisan storage:link`

## Maintenance

### Mettre à jour l'application

Laissez Jenkins gérer automatiquement via le pipeline ou:

```powershell
cd C:\inetpub\wwwroot\reservation
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## URLs Utiles

- Application: http://localhost
- IIS Manager: Tapez `inetmgr` dans le menu Démarrer
- Logs Laravel: `C:\inetpub\wwwroot\reservation\storage\logs`
- Logs IIS: `C:\inetpub\logs\LogFiles`
