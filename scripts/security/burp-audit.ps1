# Fase C — Burp Suite audit (automatizado + guía GUI)
# Equivalente Intruder/Repeater cuando Burp Community no está instalado.
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location $root

$baseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://127.0.0.1:3000" }
$reportTxt = Join-Path $root "Diagramas\burp-audit-report.txt"
$reportHtml = Join-Path $root "Diagramas\burp-report.html"
$email = "usuario@allright.app"
$password = "AllRight2026!Secure"

$passed = 0
$failed = 0
$info = 0
$rows = [System.Collections.Generic.List[object]]::new()

function Add-Result($area, $name, $status, $detail) {
  $script:rows.Add([pscustomobject]@{ Area = $area; Name = $name; Status = $status; Detail = $detail })
  if ($status -eq "PASS") { $script:passed++ }
  elseif ($status -eq "FAIL") { $script:failed++ }
  else { $script:info++ }
  $color = if ($status -eq "PASS") { "Green" } elseif ($status -eq "FAIL") { "Red" } else { "Yellow" }
  Write-Host "[$status] $name" -ForegroundColor $color
}

function Get-HttpResult($scriptBlock) {
  try {
    $r = & $scriptBlock
    $ct = ""
    try { $ct = [string]$r.Headers["Content-Type"] } catch {}
    $body = ""
    try { $body = [string]$r.Content } catch {}
    return @{
      Status = [int]$r.StatusCode
      ContentType = $ct
      IsHtml = ($ct -match "text/html" -or $body -match "<!DOCTYPE html>")
      Body = $body
    }
  } catch {
    if ($_.Exception.Response) {
      return @{
        Status = [int]$_.Exception.Response.StatusCode.value__
        ContentType = ""
        IsHtml = $false
        Body = ""
      }
    }
    throw
  }
}

function Get-HttpStatus($scriptBlock) {
  return (Get-HttpResult $scriptBlock).Status
}

function Assert-ApiJson($label, $area, $scriptBlock, $expectedStatuses) {
  try {
    $res = Get-HttpResult $scriptBlock
    if ($res.IsHtml) {
      Add-Result $area $label "FAIL" "HTTP $($res.Status) HTML SPA (API desactualizada o ruta inexistente)"
      return $null
    }
    $ok = $expectedStatuses -contains $res.Status
    Add-Result $area $label $(if ($ok) { "PASS" } else { "FAIL" }) "HTTP $($res.Status)"
    return $res
  } catch {
    Add-Result $area $label "FAIL" $_.Exception.Message
    return $null
  }
}

Write-Host "==> Burp-equivalent audit: $baseUrl"

# --- Auth / JWT ---
$token = ""
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json -Compress
try {
  $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -TimeoutSec 15
  $token = $login.access_token
  if ($token) { Add-Result "Auth" "Login demo OK" "PASS" "JWT obtenido" }
  else { Add-Result "Auth" "Login demo OK" "FAIL" "Sin access_token" }
} catch {
  $msg = $_.Exception.Message
  $detail = ""
  try { $detail = $_.ErrorDetails.Message } catch {}
  if ($detail -match "429" -or $msg -match "429") {
    Add-Result "Auth" "Login demo OK" "INFO" "IP rate-limited (429); creando usuario efimero"
  } else {
    Add-Result "Auth" "Login demo OK" "INFO" "Demo falló ($msg); creando usuario efimero"
  }
}

if (-not $token) {
  $ephemeral = "burp_$([guid]::NewGuid().ToString('N').Substring(0,10))@test.com"
  $reg = @{ email = $ephemeral; password = $password; role = "user" } | ConvertTo-Json -Compress
  try {
    Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -ContentType "application/json" -Body $reg -TimeoutSec 15 | Out-Null
  } catch { }
  try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" `
      -Body (@{ email = $ephemeral; password = $password } | ConvertTo-Json -Compress) -TimeoutSec 15
    $token = $login.access_token
    if ($token) { Add-Result "Auth" "Login efimero OK" "PASS" $ephemeral }
    else { Add-Result "Auth" "Login efimero OK" "FAIL" "Sin token" }
  } catch {
    Add-Result "Auth" "Login efimero OK" "FAIL" $_.Exception.Message
  }
}

$authHeaders = @{ Authorization = "Bearer $token" }

# JWT alg none
$noneTok = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0."
Assert-ApiJson "Algoritmo none rechazado" "JWT" {
  Invoke-WebRequest -Uri "$baseUrl/security/panic/active" -Headers @{ Authorization = "Bearer $noneTok" } -UseBasicParsing -TimeoutSec 10
} @(401) | Out-Null

# JWT firma alterada
if ($token -and $token.Contains(".")) {
  $parts = $token.Split(".")
  $tampered = $parts[0] + "." + $parts[1] + ".AAAAAAAAAAAAAAAAAAAAAA"
  Assert-ApiJson "Firma alterada rechazada" "JWT" {
    Invoke-WebRequest -Uri "$baseUrl/security/panic/active" -Headers @{ Authorization = "Bearer $tampered" } -UseBasicParsing -TimeoutSec 10
  } @(401) | Out-Null
} else {
  Add-Result "JWT" "Firma alterada rechazada" "FAIL" "Sin token base"
}

# Sin Authorization
Assert-ApiJson "GET /proximity/zones sin JWT" "AuthZ" {
  Invoke-WebRequest -Uri "$baseUrl/proximity/zones" -Headers @{ Accept = "application/json" } -UseBasicParsing -TimeoutSec 10
} @(401) | Out-Null

Assert-ApiJson "POST /security/panic sin JWT" "AuthZ" {
  Invoke-WebRequest -Uri "$baseUrl/security/panic" -Method POST -ContentType "application/json" -Body "{}" -UseBasicParsing -TimeoutSec 10
} @(401) | Out-Null

Assert-ApiJson "GET /location/history sin JWT" "AuthZ" {
  Invoke-WebRequest -Uri "$baseUrl/location/history" -Headers @{ Accept = "application/json" } -UseBasicParsing -TimeoutSec 10
} @(401) | Out-Null

# SQLi Intruder-like
$sqliOk = $true
foreach ($p in @("' OR '1'='1", "admin'--", "1; DROP TABLE users--")) {
  $b = @{ email = $p; password = $p } | ConvertTo-Json -Compress
  $c = Get-HttpStatus {
    Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $b -UseBasicParsing -TimeoutSec 10
  }
  if ($c -ge 500) { $sqliOk = $false }
}
Add-Result "Intruder" "SQLi login no causa 500" $(if ($sqliOk) { "PASS" } else { "FAIL" }) "payloads Intruder"

# XSS registration
$xssEmail = "xss_$([guid]::NewGuid().ToString('N').Substring(0,8))@test.com"
$xssBody = @{ email = $xssEmail; password = "Test1234!"; role = "<script>alert(1)</script>" } | ConvertTo-Json -Compress
$code = Get-HttpStatus {
  Invoke-WebRequest -Uri "$baseUrl/users" -Method POST -ContentType "application/json" -Body $xssBody -UseBasicParsing -TimeoutSec 10
}
Add-Result "XSS" "POST /users con role XSS" $(if ($code -lt 500) { "PASS" } else { "FAIL" }) "HTTP $code (revisar mass assignment)"

# forgot enumeration
$m1 = (Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" -Method POST -ContentType "application/json" -Body '{"email":"noexiste999@test.com"}' -TimeoutSec 10).message
$m2 = (Invoke-RestMethod -Uri "$baseUrl/auth/forgot-password" -Method POST -ContentType "application/json" -Body (@{ email = $email } | ConvertTo-Json -Compress) -TimeoutSec 10).message
Add-Result "Auth" "forgot-password sin enumeracion" $(if ($m1 -eq $m2) { "PASS" } else { "FAIL" }) "$m1"

# reset invalid
$code = Get-HttpStatus {
  Invoke-WebRequest -Uri "$baseUrl/auth/reset-password" -Method POST -ContentType "application/json" `
    -Body '{"token":"INVALID","newPassword":"NewPass2026!"}' -UseBasicParsing -TimeoutSec 10
}
Add-Result "Auth" "reset token invalido" $(if ($code -eq 401) { "PASS" } else { "FAIL" }) "HTTP $code"

# ZKP tampering
if ($token) {
  Assert-ApiJson "verify proof vacio rechazado" "ZKP" {
    Invoke-WebRequest -Uri "$baseUrl/location/verify" -Method POST -Headers $authHeaders `
      -ContentType "application/json" -Body '{"proof":{},"payload":{}}' -UseBasicParsing -TimeoutSec 10
  } @(400, 422) | Out-Null
  # Proof malformado debe ser 400 (no 500)

  $resProx = Get-HttpResult {
    Invoke-WebRequest -Uri "$baseUrl/proximity/report" -Method POST -Headers $authHeaders `
      -ContentType "application/json" -Body '{"uuid":"00000000-0000-0000-0000-000000000000","major":0,"minor":0,"rssi":-40}' -UseBasicParsing -TimeoutSec 10
  }
  if ($resProx.IsHtml) {
    Add-Result "Proximity" "report beacon desconocido" "FAIL" "HTML SPA"
  } else {
    Add-Result "Proximity" "report beacon desconocido" $(if ($resProx.Status -ge 200 -and $resProx.Status -lt 500) { "PASS" } else { "FAIL" }) "HTTP $($resProx.Status)"
  }

  $resGeo = Get-HttpResult {
    Invoke-WebRequest -Uri "$baseUrl/security/check-location" -Method POST -Headers $authHeaders `
      -ContentType "application/json" -Body '{"lat":0,"lon":0}' -UseBasicParsing -TimeoutSec 15
  }
  if ($resGeo.IsHtml) {
    Add-Result "Geofence" "check fuera de zona (0,0)" "FAIL" "HTML SPA"
  } else {
    Add-Result "Geofence" "check fuera de zona (0,0)" $(if ($resGeo.Status -ge 200 -and $resGeo.Status -lt 500) { "PASS" } else { "FAIL" }) "HTTP $($resGeo.Status)"
  }
}

# Rate limit AL FINAL (bloqueo por IP)
$got429 = $false
for ($i = 1; $i -le 15; $i++) {
  $c = Get-HttpStatus {
    Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" `
      -Body '{"email":"burp-brute@test.com","password":"wrong"}' -UseBasicParsing -TimeoutSec 5
  }
  if ($c -eq 429) { $got429 = $true; break }
}
Add-Result "Intruder" "Rate limit login 429" $(if ($got429) { "PASS" } else { "FAIL" }) "15 intentos fallidos"

# Headers /metrics /health
try {
  $h = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 10
  $hdr = $h.Headers
  $secNotes = @()
  if (-not $hdr["Content-Security-Policy"]) { $secNotes += "sin CSP" }
  if (-not $hdr["X-Content-Type-Options"]) { $secNotes += "sin X-Content-Type-Options" }
  if (-not $hdr["Strict-Transport-Security"]) { $secNotes += "sin HSTS (esperado en HTTP)" }
  Add-Result "Passive" "Headers seguridad /health" "INFO" ($(if ($secNotes.Count) { $secNotes -join "; " } else { "OK" }))
} catch {
  Add-Result "Passive" "Headers seguridad /health" "FAIL" $_.Exception.Message
}

$code = Get-HttpStatus {
  Invoke-WebRequest -Uri "$baseUrl/metrics" -UseBasicParsing -TimeoutSec 10
}
if ($code -eq 200) {
  Add-Result "Disclosure" "GET /metrics" "INFO" "publico (dev OK; prod debe usar METRICS_TOKEN)"
} elseif ($code -eq 401) {
  Add-Result "Disclosure" "GET /metrics" "PASS" "restringido"
} else {
  Add-Result "Disclosure" "GET /metrics" "INFO" "HTTP $code"
}

# --- Report ---
$date = Get-Date -Format o
$txt = @"
=== AllRight — Burp-equivalent audit ===
Fecha: $date
Base URL: $baseUrl
PASS: $passed  FAIL: $failed  INFO: $info

$($rows | ForEach-Object { "[$($_.Status)] $($_.Area) | $($_.Name) | $($_.Detail)" } | Out-String)

--- Nota ---
Burp Suite Community no detectado en este host.
Esta corrida cubre Intruder/Repeater del flujo en BURP-SUITE.md.
Para escaneo GUI: instalar Burp, proxy :8080, importar burp-targets.json.
"@
$txt | Out-File -FilePath $reportTxt -Encoding utf8

$rowHtml = ($rows | ForEach-Object {
  $cls = $_.Status.ToLower()
  "<tr class='$cls'><td>$($_.Area)</td><td>$($_.Name)</td><td><strong>$($_.Status)</strong></td><td>$($_.Detail)</td></tr>"
}) -join "`n"

$html = @"
<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/><title>AllRight Burp Audit</title>
<style>
body{font-family:Segoe UI,system-ui,sans-serif;margin:2rem;background:#0f1419;color:#e7ecf3}
h1{color:#7dd3fc} table{border-collapse:collapse;width:100%} th,td{border:1px solid #334;padding:.5rem;text-align:left}
th{background:#1a2332} .pass{background:#0f2a1a} .fail{background:#2a0f0f} .info{background:#1a1a0f}
.meta{color:#9aa} a{color:#7dd3fc}
</style></head><body>
<h1>AllRight — Burp-equivalent audit</h1>
<p class="meta">$date · $baseUrl · PASS $passed · FAIL $failed · INFO $info</p>
<table><thead><tr><th>Área</th><th>Prueba</th><th>Estado</th><th>Detalle</th></tr></thead>
<tbody>
$rowHtml
</tbody></table>
<p class="meta">Guía GUI: <code>scripts/security/BURP-SUITE.md</code> · Targets: <code>burp-targets.json</code></p>
</body></html>
"@
$html | Out-File -FilePath $reportHtml -Encoding utf8

Write-Host ""
Write-Host "TXT:  $reportTxt" -ForegroundColor Cyan
Write-Host "HTML: $reportHtml" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 } else { exit 0 }
