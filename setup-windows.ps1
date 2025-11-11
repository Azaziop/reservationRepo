# Quick Setup Script for Windows Users
# Run this from PowerShell in the project root after cloning

Write-Host "=== ReservaSalle Docker Setup for Windows ===" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is installed
Write-Host "Checking WSL 2..." -ForegroundColor Yellow
$wslStatus = wsl --status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ WSL 2 is not installed" -ForegroundColor Red
    Write-Host "Install WSL 2 first: https://learn.microsoft.com/en-us/windows/wsl/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ WSL 2 found" -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerStatus = docker version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    Write-Host "Start Docker Desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Copy .env
if (!(Test-Path .env)) {
    Write-Host "Copying .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env created" -ForegroundColor Green
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

# Start containers from WSL
Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
Write-Host "This may take a minute on first run..." -ForegroundColor Gray
Write-Host ""

$setupScript = @'
#!/bin/bash
set -e

echo "Starting Sail containers..."
./vendor/bin/sail up -d

echo ""
echo "Waiting for MySQL to be ready..."
./vendor/bin/sail artisan db:show > /dev/null 2>&1 || sleep 5

echo ""
echo "Running migrations..."
./vendor/bin/sail artisan migrate --seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open 2 new WSL terminals"
echo "2. Terminal 1: ./vendor/bin/sail npm run dev"
echo "3. Terminal 2: ./vendor/bin/sail artisan serve --host=0.0.0.0"
echo ""
echo "Then visit: http://localhost:8000"
echo ""
'@

# Save and run setup script in WSL
$setupScript | Out-File -Encoding ASCII .\setup.sh
wsl chmod +x ./setup.sh
wsl ./setup.sh

Remove-Item .\setup.sh

Write-Host ""
Write-Host "Opening WSL for next steps..." -ForegroundColor Cyan
Write-Host "Run these commands in WSL:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1: ./vendor/bin/sail npm run dev" -ForegroundColor Green
Write-Host "  Terminal 2: ./vendor/bin/sail artisan serve --host=0.0.0.0" -ForegroundColor Green
Write-Host ""
Write-Host "Then visit: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""

# Optional: Open WSL
$openWSL = Read-Host "Open WSL now? (y/n)"
if ($openWSL -eq "y") {
    wsl
}
