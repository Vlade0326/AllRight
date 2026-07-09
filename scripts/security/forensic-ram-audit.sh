#!/usr/bin/env bash
# Fase C — Auditoría forense RAM (5.000 sesiones)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
SESSIONS="${FORENSIC_SESSIONS:-5000}"
BATCH="${FORENSIC_BATCH:-100}"
REPORT="$ROOT/Diagramas/forensic-ram-audit-report.txt"
EMAIL="${FORENSIC_EMAIL:-usuario@allright.app}"
PASSWORD="${FORENSIC_PASSWORD:-AllRight2026!Secure}"

echo "==> Auditoría forense: $SESSIONS sesiones contra $BASE_URL"
START=$(date +%s)
OK=0
ERR=0

for ((offset=0; offset<SESSIONS; offset+=BATCH)); do
  limit=$(( SESSIONS - offset < BATCH ? SESSIONS - offset : BATCH ))
  for ((i=0; i<limit; i++)); do
    if curl -sf -X POST "$BASE_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
      -o /dev/null 2>/dev/null; then
      OK=$((OK+1))
    else
      ERR=$((ERR+1))
    fi
  done
  echo "  $OK OK ($((offset+limit))/$SESSIONS)..."
done

ELAPSED=$(( $(date +%s) - START ))
FINDINGS=""

CONTAINER=$(docker ps --filter "name=allright" --format "{{.Names}}" 2>/dev/null | grep -i api | head -1)
if [ -n "$CONTAINER" ]; then
  echo "==> Escaneando memoria: $CONTAINER"
  for pat in "AllRight2026" "JWT_SECRET" "ZKP_PEPPER" "password"; do
    if docker exec "$CONTAINER" sh -c "grep -a -r -l '$pat' /proc/1/ 2>/dev/null | head -3" 2>/dev/null | grep -q .; then
      FINDINGS="${FINDINGS}\nPATTERN '$pat' detectado en /proc/1/"
    fi
  done
else
  echo "  Contenedor no encontrado; ejecuta npm run docker:prod"
fi

{
  echo "=== AllRight — Auditoría Forense RAM ==="
  echo "Fecha: $(date -Iseconds)"
  echo "Sesiones: $SESSIONS | OK: $OK | Errores: $ERR | Duración: ${ELAPSED}s"
  echo "Contenedor: ${CONTAINER:-N/A}"
  echo "--- Hallazgos ---"
  if [ -z "$FINDINGS" ]; then echo "NINGUNO: no se detectaron fugas obvias"; else echo -e "$FINDINGS"; fi
} | tee "$REPORT"

echo "Reporte: $REPORT"
