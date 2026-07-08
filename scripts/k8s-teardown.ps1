# Elimina cluster Kind de AllRight
$ErrorActionPreference = "Stop"
kind delete cluster --name allright
Write-Host "Cluster 'allright' eliminado." -ForegroundColor Green
