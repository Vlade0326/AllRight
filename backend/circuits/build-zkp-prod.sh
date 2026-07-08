#!/bin/sh
# Producción — ceremonia multi-contribución (3 rondas mínimas).
# Cada contribución debe hacerse en entornos aislados; aquí se simulan 3 roles.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
ARTIFACTS="$ROOT/artifacts/prod"
CIRCOMLIB="$ROOT/.circomlib"
CONTRIBUTIONS="${ZKP_CEREMONY_ROUNDS:-3}"

mkdir -p "$ARTIFACTS"

if [ ! -d "$CIRCOMLIB/circuits" ]; then
  git clone --depth 1 https://github.com/iden3/circomlib.git "$CIRCOMLIB"
fi

echo "[prod] Compilando circuito geofence..."
circom "$ROOT/geofence.circom" --r1cs --wasm --sym -o "$ARTIFACTS" -l "$CIRCOMLIB/circuits"
cp "$ARTIFACTS/geofence_js/geofence.wasm" "$ARTIFACTS/geofence.wasm"

PTAU="$ARTIFACTS/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "[prod] Descargando Powers of Tau (Hermez ptau12)..."
  curl -L -o "$ARTIFACTS/pot12_0000.ptau" \
    https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau
  cp "$ARTIFACTS/pot12_0000.ptau" "$PTAU"
fi

echo "[prod] Fase 1: Groth16 setup inicial..."
snarkjs groth16 setup "$ARTIFACTS/geofence.r1cs" "$PTAU" "$ARTIFACTS/geofence_0000.zkey"

PREV="$ARTIFACTS/geofence_0000.zkey"
i=1
while [ "$i" -le "$CONTRIBUTIONS" ]; do
  if [ "$i" -eq "$CONTRIBUTIONS" ]; then
    NEXT="$ARTIFACTS/geofence_final.zkey"
  else
    NEXT="$ARTIFACTS/geofence_$(printf '%04d' "$i").zkey"
  fi
  ENTROPY="allright-prod-round${i}-$(date +%s)-$RANDOM-$RANDOM"
  echo "[prod] Contribución $i/$CONTRIBUTIONS..."
  snarkjs zkey contribute "$PREV" "$NEXT" \
    --name="AllRight prod contributor $i" -v -e="$ENTROPY"
  PREV="$NEXT"
  i=$((i + 1))
done

echo "[prod] Exportando verification key..."
snarkjs zkey export verificationkey "$ARTIFACTS/geofence_final.zkey" "$ARTIFACTS/verification_key.json"

echo "[prod] Verificando zkey..."
snarkjs zkey verify "$ARTIFACTS/geofence.r1cs" "$PTAU" "$ARTIFACTS/geofence_final.zkey"

echo "[prod] Ceremonia completada: $ARTIFACTS"
echo "  - geofence.wasm"
echo "  - geofence_final.zkey"
echo "  - verification_key.json"