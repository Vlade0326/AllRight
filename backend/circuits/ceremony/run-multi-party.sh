#!/bin/sh
# Ceremonia multi-parte local: 3 contribuciones separadas con contribute.sh
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACTS="$ROOT/artifacts/prod"
CEREMONY="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ARTIFACTS/geofence_0000.zkey" ]; then
  echo "ERROR: Ejecuta primero ./build-zkp-prod-setup.sh"
  exit 1
fi

echo "=== Contribución 1/3 ==="
"$CEREMONY/contribute.sh" \
  "$ARTIFACTS/geofence_0000.zkey" \
  "$ARTIFACTS/geofence_0001.zkey" \
  "AllRight Contributor A"

echo "=== Contribución 2/3 ==="
"$CEREMONY/contribute.sh" \
  "$ARTIFACTS/geofence_0001.zkey" \
  "$ARTIFACTS/geofence_0002.zkey" \
  "AllRight Contributor B"

echo "=== Contribución 3/3 (final) ==="
"$CEREMONY/contribute.sh" \
  "$ARTIFACTS/geofence_0002.zkey" \
  "$ARTIFACTS/geofence_final.zkey" \
  "AllRight Contributor C"

echo "=== Exportando verification key ==="
snarkjs zkey export verificationkey \
  "$ARTIFACTS/geofence_final.zkey" \
  "$ARTIFACTS/verification_key.json"

echo "=== Verificación ==="
"$CEREMONY/verify-ceremony.sh"

echo "Ceremonia multi-parte completada en $ARTIFACTS"
