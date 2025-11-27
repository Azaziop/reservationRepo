Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "=== SonarQube Analysis Runner ===" -ForegroundColor Cyan

# Check if SonarQube is running
Write-Host "Checking if SonarQube is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/api/system/status" -UseBasicParsing -ErrorAction Stop
    $status = ($response.Content | ConvertFrom-Json).status
    if ($status -ne "UP") {
        Write-Error "SonarQube is not ready. Status: $status"
        exit 1
    }
    Write-Host "Success: SonarQube is UP and ready" -ForegroundColor Green
} catch {
    Write-Error "SonarQube is not running. Start it with: docker-compose up -d sonarqube"
    exit 1
}

# Run the analysis
Write-Host "`nStarting code analysis..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

$scannerCmd = "docker run --rm --network reservationrepo_sail -v ${PWD}:/usr/src -e SONAR_HOST_URL=http://sonarqube:9000 -e SONAR_LOGIN=admin -e SONAR_PASSWORD=admin sonarsource/sonar-scanner-cli -Dsonar.projectKey=reservation-laravel -Dsonar.projectName=`"Reservation Laravel`" -Dsonar.sources=app,config,database,public,resources,routes -Dsonar.tests=tests -Dsonar.exclusions=`"vendor/**,node_modules/**,storage/**,bootstrap/cache/**,public/build/**`" -Dsonar.sourceEncoding=UTF-8"

Invoke-Expression $scannerCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess: Analysis completed!" -ForegroundColor Green
    Write-Host "`nView results at: http://localhost:9090" -ForegroundColor Cyan
    Write-Host "Project: reservation-laravel" -ForegroundColor Gray
} else {
    Write-Error "Analysis failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
