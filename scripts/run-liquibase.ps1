<#
Run Liquibase with network diagnostics and fallbacks.

Usage: run from repository root (PowerShell)
  .\scripts\run-liquibase.ps1

What it does:
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Log($m) { Write-Host "[run-liquibase] $m" }

Write-Log "Starting Liquibase runner"

# Basic checks
try {
    docker version | Out-Null
} catch {
    Write-Error "Docker CLI not available or Docker daemon not running. Start Docker Desktop and retry."
    exit 2
}

$network = 'reservationrepo_reservation-net'
$mysqlContainer = 'reservation-mysql'

Write-Log "Inspecting Docker network '$network'..."
try {
    $netJson = docker network inspect $network | ConvertFrom-Json
    Write-Log "Network inspected."
} catch {
    Write-Error "Failed to inspect network '$network'. Ensure the compose network exists and docker compose is up."
    exit 3
}

Write-Log "Attempting DNS resolution of 'mysql' from a diagnostic container..."
$dnsOk = $false
try {
    # prefer netshoot if available, otherwise use curlimage
    docker run --rm --network $network nicolaka/netshoot:latest nslookup mysql 2>&1 | Out-Host
    if ($LASTEXITCODE -eq 0) { $dnsOk = $true } else { $dnsOk = $false }
} catch {
    Write-Log "nslookup not available or netshoot image missing; trying curl fallback"
    try {
        docker run --rm --network $network curlimages/curl:latest -sS --max-time 5 http://mysql:3306 > $null 2>&1
        if ($LASTEXITCODE -eq 0) { $dnsOk = $true } else { $dnsOk = $false }
    } catch {
        Write-Log "DNS resolution failed from diagnostic containers."
        $dnsOk = $false
    }
}

if ($dnsOk) {
    Write-Log "DNS resolution for 'mysql' succeeded. Running Liquibase attached to network."
    $addHostArg = ''
} else {
    Write-Log "Attempting to fetch MySQL container IP to add host entry."
    try {
        $ip = docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" $mysqlContainer
        if (-not $ip) { throw "No IP returned" }
        Write-Log "Found MySQL IP: $ip"
        $addHostArg = "--add-host mysql:$ip"
    } catch {
        Write-Log "Could not get MySQL container IP (container may be named differently). Will fallback to host.docker.internal approach."
        $addHostArg = ''
    }
}

# locate jar (download from Maven Central if missing)
$driversDir = "database/liquibase/drivers"
if (-not (Test-Path $driversDir)) { New-Item -ItemType Directory -Path $driversDir | Out-Null }
$driver = Get-ChildItem -Path $driversDir -Filter 'mysql-connector*-*.jar' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $driver) {
    Write-Log "No MySQL connector JAR found in $driversDir. Attempting to download mysql-connector-java:8.0.30 from Maven Central..."
    $jarUrl = 'https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar'
    $target = Join-Path $driversDir 'mysql-connector-java-8.0.30.jar'
    try {
        Invoke-WebRequest -Uri $jarUrl -OutFile $target -UseBasicParsing -ErrorAction Stop
        Write-Log "Downloaded JDBC driver to $target"
        $driver = Get-Item $target
    } catch {
        Write-Error "Failed to download MySQL connector JAR: $_. Please place a connector JAR in $driversDir and retry."
        exit 4
    }
}
$jarName = $driver.Name
Write-Log "Using JDBC driver: $jarName"

# Build the docker run command
$baseCmd = @(
    'docker','run','--rm'
)

if ($addHostArg -ne '') { $baseCmd += $addHostArg }

$classpathArg = "--classpath=/liquibase/drivers/$jarName"
$baseCmd += @('--network',$network,
    '-v',"${PWD}:/workspace",
    '-v',"${PWD}/database/liquibase/drivers:/liquibase/drivers",
    '-v',"${PWD}/database/liquibase:/liquibase/changelog",
    'liquibase/liquibase:4.30.0',
    $classpathArg,
    '--changeLogFile=changelog.xml',
    '--defaultsFile=/liquibase/changelog/liquibase.properties',
    '--searchPath=/liquibase/changelog',
    '--url=jdbc:mysql://mysql:3306/reservation_db',
    '--username=root',
    '--password=',
    'update'
)

Write-Log "Running Liquibase with network '$network'..."
try {
    $exe = $baseCmd[0]
    $args = $baseCmd[1..($baseCmd.Length - 1)]
    Write-Log ("Executing: {0} {1}" -f $exe, ($args -join ' '))
    $proc = Start-Process -FilePath $exe -ArgumentList $args -NoNewWindow -Wait -PassThru
    $rc = $proc.ExitCode
    if ($rc -eq 0) {
        Write-Log "Liquibase completed successfully."
        exit 0
    } else {
        Write-Log "Liquibase exited with code $rc."
        exit $rc
    }
} catch {
    Write-Log "Liquibase run failed: $_"
    Write-Log "Attempting fallback using host.docker.internal..."
    # Fallback: run using host.docker.internal if previous failed
    $fallbackClasspath = "--classpath=/liquibase/drivers/$jarName"
    $fallbackCmd = @('docker','run','--rm',
        '-v',"${PWD}:/workspace",
        '-v',"${PWD}/database/liquibase/drivers:/liquibase/drivers",
        '-v',"${PWD}/database/liquibase:/liquibase/changelog",
        'liquibase/liquibase:4.30.0',
        $fallbackClasspath,
        '--url=jdbc:mysql://host.docker.internal:3306/reservation_test',
        '--username=root',
        '--password=',
        '--changeLogFile=/liquibase/changelog/changelog.xml',
        'update'
    )
    try {
        $exe = $fallbackCmd[0]
        $args = $fallbackCmd[1..($fallbackCmd.Length - 1)]
        Write-Log ("Executing fallback: {0} {1}" -f $exe, ($args -join ' '))
        $proc = Start-Process -FilePath $exe -ArgumentList $args -NoNewWindow -Wait -PassThru
        $rc = $proc.ExitCode
        if ($rc -eq 0) { Write-Log "Fallback Liquibase succeeded."; exit 0 } else { Write-Log "Fallback Liquibase failed with code $rc"; exit $rc }
    } catch {
        Write-Error "Fallback Liquibase also failed: $_"
        exit 10
    }
}
