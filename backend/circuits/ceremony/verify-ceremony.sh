#!/bin/sh
# Verifica integridad de la ceremonia de producción.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARTIFACTS="$ROOT/artifacts/prod"

R1CS="$ARTIFACTS/geofence.r1cs"
PTAU="$ARTIFACTS/pot12_final.ptau"
ZKEY="$ARTIFACTS/geofence_final.zkey"

if [ ! -f "$ZKEY" ]; then
  echo "ERROR: No existe $ZKEY"
  exit 1
fi

echo "Verificando zkey contra r1cs y ptau..."
snarkjs zkey verify "$R1CS" "$PTAU" "$ZKEY"

echo "Verificando verification key..."
snarkjs zkey export verificationkey "$ZKEY" "$ARTIFACTS/verification_key.check.json"
diff -q "$ARTIFACTS/verification_key.json" "$ARTIFACTS/verification_key.check.json" \
  && echo "OK: verification_key.json coincide"

echo "Ceremonia de producción VERIFICADA."
