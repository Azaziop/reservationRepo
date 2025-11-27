# Script de Configuration IIS pour l'Application de Réservation
# À exécuter en tant qu'Administrateur

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Configuration IIS - Reservation App" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Variables
$siteName = "ReservationApp"
$appPoolName = "ReservationAppPool"
$physicalPath = "C:\inetpub\wwwroot\reservation\public"
$port = 80

# Importer le module IIS
Import-Module WebAdministration

Write-Host "`n[1/7] Vérification des prérequis..." -ForegroundColor Yellow

# Vérifier si IIS est installé
if (!(Get-WindowsFeature -Name Web-Server).Installed) {
    Write-Host "Installation d'IIS..." -ForegroundColor Green
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
}

# Vérifier si le répertoire existe
if (!(Test-Path $physicalPath)) {
    Write-Host "ERREUR: Le répertoire $physicalPath n'existe pas!" -ForegroundColor Red
    Write-Host "Assurez-vous que Jenkins a déployé l'application." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Prérequis vérifiés" -ForegroundColor Green

Write-Host "`n[2/7] Configuration du Pool d'Application..." -ForegroundColor Yellow

# Supprimer le pool s'il existe déjà
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "Suppression de l'ancien pool..." -ForegroundColor Gray
    Remove-WebAppPool -Name $appPoolName
}

# Créer le pool d'application
New-WebAppPool -Name $appPoolName
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name "enable32BitAppOnWin64" -Value $false

Write-Host "[OK] Pool d'application créé: $appPoolName" -ForegroundColor Green

Write-Host "`n[3/7] Configuration du Site Web..." -ForegroundColor Yellow

# Supprimer le site s'il existe déjà
if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "Suppression de l'ancien site..." -ForegroundColor Gray
    Remove-Website -Name $siteName
}

# Créer le site
New-Website -Name $siteName `
    -PhysicalPath $physicalPath `
    -ApplicationPool $appPoolName `
    -Port $port

Write-Host "[OK] Site web créé: $siteName" -ForegroundColor Green

Write-Host "`n[4/7] Configuration des permissions..." -ForegroundColor Yellow

$basePath = "C:\inetpub\wwwroot\reservation"

# Permissions pour IIS_IUSRS
Write-Host "Attribution des permissions IIS_IUSRS..." -ForegroundColor Gray
icacls $basePath /grant "IIS_IUSRS:(OI)(CI)RX" /T /Q

# Permissions d'écriture pour storage
Write-Host "Attribution des permissions d'écriture pour storage..." -ForegroundColor Gray
icacls "$basePath\storage" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q

# Permissions d'écriture pour bootstrap/cache
Write-Host "Attribution des permissions d'écriture pour bootstrap/cache..." -ForegroundColor Gray
icacls "$basePath\bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F" /T /Q

Write-Host "[OK] Permissions configurées" -ForegroundColor Green

Write-Host "`n[5/7] Vérification de web.config..." -ForegroundColor Yellow

$webConfigPath = Join-Path $physicalPath "web.config"
if (Test-Path $webConfigPath) {
    Write-Host "[OK] web.config trouvé" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: web.config non trouvé dans $physicalPath" -ForegroundColor Red
    Write-Host "Le site pourrait ne pas fonctionner correctement." -ForegroundColor Red
}

Write-Host "`n[6/7] Vérification de la configuration Laravel..." -ForegroundColor Yellow

$envPath = Join-Path $basePath ".env"
if (Test-Path $envPath) {
    Write-Host "[OK] Fichier .env trouvé" -ForegroundColor Green

    # Vérifier APP_KEY
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "APP_KEY=base64:") {
        Write-Host "[OK] APP_KEY est défini" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION: APP_KEY n'est pas défini!" -ForegroundColor Red
    }
} else {
    Write-Host "ATTENTION: Fichier .env non trouvé!" -ForegroundColor Red
}

Write-Host "`n[7/7] Démarrage du site..." -ForegroundColor Yellow

# Démarrer le site
Start-Website -Name $siteName

# Obtenir l'état du site
$siteState = (Get-Website -Name $siteName).State

if ($siteState -eq "Started") {
    Write-Host "[OK] Site démarré avec succès" -ForegroundColor Green
} else {
    Write-Host "ERREUR: Le site n'a pas pu démarrer (État: $siteState)" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "Configuration terminée!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "`nInformations du site:" -ForegroundColor Yellow
Write-Host "  Nom: $siteName" -ForegroundColor White
Write-Host "  URL: http://localhost:$port" -ForegroundColor White
Write-Host "  Chemin: $physicalPath" -ForegroundColor White
Write-Host "  Pool: $appPoolName" -ForegroundColor White
Write-Host "  État: $siteState" -ForegroundColor White

Write-Host "`nProchaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Créer la base de données 'reservation_prod' dans MySQL" -ForegroundColor White
Write-Host "  2. Ouvrir http://localhost dans votre navigateur" -ForegroundColor White
Write-Host "  3. Vérifier les logs si nécessaire: $basePath\storage\logs\laravel.log" -ForegroundColor White

Write-Host "`nPour plus d'informations, consultez: IIS_CONFIGURATION.md" -ForegroundColor Gray
