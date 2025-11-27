Set-Location 'C:\Users\zaoui\OneDrive\Documents\reservationRepo'

Write-Output '--- Docker version ---'
docker version

Write-Output '--- Remove existing reservation-mysql if present ---'
try { docker rm -f reservation-mysql 2>$null | Out-Null } catch { }

Write-Output '--- Start reservation-mysql with -P (publish all exposed ports) ---'
$id = (docker run -d --name reservation-mysql -e MYSQL_DATABASE=reservation_db -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -P mysql:8.0).Trim()
Write-Output "Container id: $id"
Start-Sleep -Seconds 2

Write-Output '--- Inspect port mapping ---'
$mapping = docker port $id 3306/tcp
Write-Output "docker port output: $mapping"
if ([string]::IsNullOrWhiteSpace($mapping)) {
    Write-Error 'Failed to determine port mapping'
    exit 1
}
$hostPort = ($mapping -split ':')[-1].Trim()
Write-Output "Resolved host port: $hostPort"

Write-Output '--- Write host port to .ci_use_compose ---'
Set-Content -Path '.ci_use_compose' -Value $hostPort -Encoding ascii
Write-Output 'Wrote .ci_use_compose content:'
Get-Content .ci_use_compose

Write-Output '--- Create small PHP script to test PDO connection ---'
# Use a literal here-string template and replace a placeholder with the resolved host port
$phpTemplate = @'
<?php
try {
    new PDO("mysql:host=127.0.0.1;port=__PORT__", "root", "");
    echo "OK";
} catch (Exception $e) {
    echo "ERR:" . $e->getMessage();
    exit(1);
}
?>
'@

$phpContent = $phpTemplate -replace '__PORT__', $hostPort
Set-Content -Path testpdo.php -Value $phpContent -Encoding ascii

Write-Output '--- Run PHP test script with retries (waiting for MySQL readiness) ---'
$max = 60
$i = 0
$success = $false
while ($i -lt $max) {
    php testpdo.php
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        break
    }
    Write-Output "Connection attempt $($i+1) failed (exit $LASTEXITCODE), sleeping 2s..."
    Start-Sleep -Seconds 2
    $i++
}
Write-Output "PHP connection final exit code: $LASTEXITCODE"

Write-Output '--- Final .ci_use_compose content ---'
Get-Content .ci_use_compose

Write-Output '--- Cleanup: remove test container ---'
docker rm -f $id | Out-Null
Write-Output 'Cleaned up reservation-mysql'
