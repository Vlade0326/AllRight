#!/bin/sh
# Fase 1 de ceremonia prod: compila circuito y genera geofence_0000.zkey (sin contribuciones).
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
ARTIFACTS="$ROOT/artifacts/prod"
CIRCOMLIB="$ROOT/.circomlib"

mkdir -p "$ARTIFACTS"

if [ ! -d "$CIRCOMLIB/circuits" ]; then
  git clone --depth 1 https://github.com/iden3/circomlib.git "$CIRCOMLIB"
fi

cp "$CIRCOMLIB/circuits/comparators.circom" "$ROOT/comparators.circom"

echo "[prod-setup] Compilando circuito geofence..."
circom "$ROOT/geofence.circom" --r1cs --wasm --sym -o "$ARTIFACTS"

PTAU="$ARTIFACTS/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "[prod-setup] Descargando Powers of Tau (Hermez ptau12)..."
  curl -L -o "$ARTIFACTS/pot12_0000.ptau" \
    https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
  cp "$ARTIFACTS/pot12_0000.ptau" "$PTAU"
fi

echo "[prod-setup] Groth16 setup inicial (sin contribuciones)..."
snarkjs groth16 setup "$ARTIFACTS/geofence.r1cs" "$PTAU" "$ARTIFACTS/geofence_0000.zkey"

echo "[prod-setup] Listo: $ARTIFACTS/geofence_0000.zkey"
echo "Siguiente paso: ./ceremony/run-multi-party.sh"
