# Ejecuta prueba k6 de 500 VUs dentro del cluster Kind
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

kubectl delete job k6-load-test-500 --ignore-not-found
kubectl apply -f k8s/k6-job-500.yaml

Write-Host "==> Esperando job k6-load-test-500 (hasta 8 min)..."
kubectl wait --for=condition=complete job/k6-load-test-500 --timeout=480s

Write-Host ""
Write-Host "==> Resultados:" -ForegroundColor Green
kubectl logs job/k6-load-test-500
