# Genera .env.production con secrets aleatorios seguros.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/generate-production-secrets.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outFile = Join-Path $root ".env.production"

function New-Secret([int]$bytes = 32) {
    $buf = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
    return [Convert]::ToBase64String($buf) -replace '[+/=]', 'x'
}

$jwtSecret = New-Secret 48
$zkpPepper = New-Secret 48
$dbPassword = New-Secret 24
$grafanaPassword = New-Secret 20
$metricsToken = New-Secret 24

$vapidKeys = & node -e "const w=require('web-push');const k=w.generateVAPIDKeys();console.log(k.publicKey+'|'+k.privateKey);" 2>$null
if ($LASTEXITCODE -ne 0 -or -not $vapidKeys) {
  $vapidPublic = New-Secret 32
  $vapidPrivate = New-Secret 32
} else {
  $parts = $vapidKeys -split '\|'
  $vapidPublic = $parts[0]
  $vapidPrivate = $parts[1]
}

$content = @"
# AUTO-GENERADO — $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# NO commitear este archivo. Guardar en gestor de secrets.

NODE_ENV=production

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$dbPassword
DB_DATABASE=postgres
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true

REDIS_HOST=redis
REDIS_PORT=6379

API_PORT=3000
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=60m

ZKP_ADAPTER=snarkjs
ZKP_ARTIFACTS_ENV=prod
ZKP_PEPPER=$zkpPepper

GEOFENCE_LAT=3.4516
GEOFENCE_LON=-76.5320
GEOFENCE_RADIUS_KM=0.5

PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_USER=admin
GRAFANA_PASSWORD=$grafanaPassword

METRICS_TOKEN=$metricsToken
METRICS_ALLOW_PRIVATE=true
APP_URL=https://localhost:3443

VAPID_PUBLIC_KEY=$vapidPublic
VAPID_PRIVATE_KEY=$vapidPrivate
VAPID_SUBJECT=mailto:admin@allright.app

# Panic SOS
# PANIC_NOTIFY_EMAIL=ops@example.com
PANIC_RATE_MAX=3
PANIC_RATE_WINDOW_SEC=3600

# SMTP (opcional — sin SMTP_HOST se usa log en consola)
# Guía completa: Diagramas/SMTP-SETUP.md
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=AllRight <noreply@allright.app>
# PANIC_NOTIFY_EMAIL=ops@example.com
# APP_URL=https://tudominio:3443
"@

Set-Content -Path $outFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Archivo generado: $outFile" -ForegroundColor Green
Write-Host "Secrets guardados en el archivo. NO los compartas ni los commitees." -ForegroundColor Yellow
Write-Host "Abre .env.production y guarda los valores en tu gestor de contrasenas." -ForegroundColor Yellow
Write-Host ""
Write-Host "Siguiente paso: npm run docker:prod"
