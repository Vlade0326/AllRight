#!/bin/sh
# Genera .env.production con secrets aleatorios seguros.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.production"

rand() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 "$1" | tr -d '/+=' | head -c "$2"
  else
    head -c "$1" /dev/urandom | base64 | tr -d '/+=' | head -c "$2"
  fi
}

JWT_SECRET=$(rand 48 64)
ZKP_PEPPER=$(rand 48 64)
DB_PASSWORD=$(rand 24 32)
GRAFANA_PASSWORD=$(rand 20 28)

cat > "$OUT" <<EOF
# AUTO-GENERADO — $(date -Iseconds)
# NO commitear este archivo.

NODE_ENV=production

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=postgres
DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true

REDIS_HOST=redis
REDIS_PORT=6379

API_PORT=3000
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=60m

ZKP_ADAPTER=snarkjs
ZKP_ARTIFACTS_ENV=prod
ZKP_PEPPER=$ZKP_PEPPER

GEOFENCE_LAT=3.4516
GEOFENCE_LON=-76.5320
GEOFENCE_RADIUS_KM=0.5

PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
EOF

echo ""
echo "Archivo generado: $OUT"
echo ""
echo "Secrets (guarda en lugar seguro):"
echo "  DB_PASSWORD      = $DB_PASSWORD"
echo "  JWT_SECRET       = $JWT_SECRET"
echo "  ZKP_PEPPER       = $ZKP_PEPPER"
echo "  GRAFANA_PASSWORD = $GRAFANA_PASSWORD"
echo ""
echo "Despliegue: npm run docker:prod"
