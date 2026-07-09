# AllRight — despliegue en Kind (3 nodos)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$clusterName = "allright"
$secretFile = Join-Path $root "k8s\secret.yaml"

Write-Host "==> Verificando cluster Kind '$clusterName'..."
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$clusters = @(kind get clusters 2>&1 | Where-Object { $_ -is [string] -and $_ -notmatch 'No kind clusters' })
$ErrorActionPreference = $prevEap
if ($clusters -notcontains $clusterName) {
  Write-Host "==> Creando cluster Kind (control-plane + 2 workers)..."
  kind create cluster --name $clusterName --config kind-cluster-config.yaml
} else {
  Write-Host "    Cluster ya existe."
}

Write-Host "==> Construyendo imagen allright-api:latest (Dockerfile.prod)..."
docker build -f Dockerfile.prod -t allright-api:latest .
if ($LASTEXITCODE -ne 0) { throw "Fallo build de imagen" }

Write-Host "==> Cargando imagen en Kind..."
kind load docker-image allright-api:latest --name $clusterName

if (-not (Test-Path $secretFile)) {
  Write-Error "No existe k8s/secret.yaml. Copia k8s/secret.yaml.example y completa los valores."
}

Write-Host "==> Aplicando manifiestos K8s..."
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/api.yaml

$tlsSecret = Join-Path $root "k8s\tls-secret.yaml"
if (Test-Path $tlsSecret) {
  Write-Host "==> Aplicando Ingress TLS..."
  kubectl apply -f $tlsSecret
  kubectl apply -f k8s/ingress.yaml
} else {
  Write-Host "    (Opcional) TLS: npm run k8s:tls para HTTPS en Kind"
}

Write-Host "==> Esperando pods..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis --timeout=120s
kubectl wait --for=condition=ready pod -l app=allright-api --timeout=180s

Write-Host ""
Write-Host "Despliegue completado." -ForegroundColor Green
Write-Host "  API (NodePort): http://127.0.0.1:30080"
if (Test-Path $tlsSecret) {
  Write-Host "  API (HTTPS Ingress): https://allright.local (hosts: 127.0.0.1 allright.local)"
}
Write-Host "  Pods:"
kubectl get pods -o wide
Write-Host "  Nodos:"
kubectl get nodes
