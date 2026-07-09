# Generates self-signed TLS secret for K8s Ingress (allright.local)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "k8s\.tls-temp"
$secretFile = Join-Path $root "k8s\tls-secret.yaml"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$key = Join-Path $outDir "tls.key"
$crt = Join-Path $outDir "tls.crt"

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  Write-Error "openssl no encontrado. Instala OpenSSL o Git for Windows."
}

openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout $key -out $crt `
  -subj "/CN=allright.local/O=AllRight Dev" `
  -addext "subjectAltName=DNS:allright.local,IP:127.0.0.1"

$certPem = Get-Content $crt -Raw
$keyPem = Get-Content $key -Raw

$yaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: allright-tls
type: kubernetes.io/tls
stringData:
  tls.crt: |
$($certPem -split "`n" | ForEach-Object { "    $_" } | Out-String)
  tls.key: |
$($keyPem -split "`n" | ForEach-Object { "    $_" } | Out-String)
"@

Set-Content -Path $secretFile -Value $yaml -Encoding UTF8
Remove-Item -Recurse -Force $outDir

Write-Host "TLS secret generado: k8s/tls-secret.yaml" -ForegroundColor Green
Write-Host "Agrega a hosts: 127.0.0.1 allright.local"
