# Fase C — Auditoría forense RAM (5.000 sesiones)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$baseUrl = $env:BASE_URL ?? "http://127.0.0.1:3000"
$sessions = [int]($env:FORENSIC_SESSIONS ?? "5000")
$batchSize = [int]($env:FORENSIC_BATCH ?? "100")
$reportPath = Join-Path $root "Diagramas\forensic-ram-audit-report.txt"
$email = $env:FORENSIC_EMAIL ?? "usuario@allright.app"
$password = $env:FORENSIC_PASSWORD ?? "AllRight2026!Secure"

Write-Host "==> Auditoría forense: $sessions sesiones contra $baseUrl"

# 1. Generar carga de sesiones (logins concurrentes por lotes)
$tokens = [System.Collections.Generic.List[string]]::new()
$errors = 0
$start = Get-Date

for ($offset = 0; $offset -lt $sessions; $offset += $batchSize) {
  $jobs = @()
  $limit = [Math]::Min($batchSize, $sessions - $offset)
  for ($i = 0; $i -lt $limit; $i++) {
    $jobs += Start-Job -ScriptBlock {
      param($url, $em, $pw)
      try {
        $body = @{ email = $em; password = $pw } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$url/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 15
        return $r.access_token
      } catch { return $null }
    } -ArgumentList $baseUrl, $email, $password
  }
  $jobs | Wait-Job | Out-Null
  foreach ($j in $jobs) {
    $t = Receive-Job $j
    if ($t) { $tokens.Add($t) } else { $errors++ }
    Remove-Job $j
  }
  Write-Host "  $($tokens.Count) tokens obtenidos ($($offset + $limit)/$sessions)..."
}

$elapsed = (Get-Date) - $start
Write-Host "==> Sesiones: $($tokens.Count) OK, $errors errores en $($elapsed.TotalSeconds.ToString('F1'))s"

# 2. Escaneo de memoria del contenedor API (Linux/Docker)
$findings = [System.Collections.Generic.List[string]]::new()
$container = (docker ps --filter "name=allright-api" --format "{{.Names}}" 2>$null | Select-Object -First 1)

if ($container) {
  Write-Host "==> Escaneando memoria del contenedor: $container"
  $patterns = @(
    "AllRight2026",
    "JWT_SECRET",
    "ZKP_PEPPER",
    "password",
    "access_token",
    "BEGIN PRIVATE KEY"
  )
  foreach ($pat in $patterns) {
    $hits = docker exec $container sh -c "grep -a -r -l '$pat' /proc/1/ 2>/dev/null | head -5" 2>$null
    if ($hits) {
      $findings.Add("PATTERN '$pat' encontrado en: $hits")
    }
  }

  # Heap snapshot strings (muestra de /proc/1/maps + strings)
  $memSample = docker exec $container sh -c "strings /proc/1/environ 2>/dev/null | head -20" 2>$null
  if ($memSample -match "JWT_SECRET|ZKP_PEPPER|password") {
    $findings.Add("CRITICO: secretos en environ del proceso")
  }
} else {
  Write-Host "  Contenedor allright-api no encontrado; escaneo de memoria omitido."
  Write-Host "  Ejecuta con: npm run docker:prod"
}

# 3. Verificar que passwords no aparecen en respuestas API
$leakTest = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 5
if (($leakTest | ConvertTo-Json) -match $password) {
  $findings.Add("CRITICO: password en respuesta /health")
}

# 4. Reporte
$report = @"
=== AllRight — Auditoría Forense RAM ===
Fecha: $(Get-Date -Format o)
Base URL: $baseUrl
Sesiones simuladas: $sessions
Tokens obtenidos: $($tokens.Count)
Errores login: $errors
Duración: $($elapsed.TotalSeconds.ToString('F1'))s
Contenedor: $(if ($container) { $container } else { 'N/A' })

--- Hallazgos ---
$(if ($findings.Count -eq 0) { 'NINGUNO: no se detectaron fugas obvias en memoria/proceso' } else { $findings -join "`n" })

--- Recomendaciones ---
- Rotar JWT_SECRET y ZKP_PEPPER si hay hallazgos CRITICO
- Verificar que bcrypt hashes no se loguean
- Confirmar rate limiting activo (429 en brute force)
"@

$report | Out-File -FilePath $reportPath -Encoding utf8
Write-Host ""
Write-Host "Reporte guardado: $reportPath" -ForegroundColor Green
Write-Host $report
