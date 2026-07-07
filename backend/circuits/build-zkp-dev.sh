#!/bin/sh
# Dev ceremony — single contributor. NO usar en producción.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
ARTIFACTS="$ROOT/artifacts/dev"
CIRCOMLIB="$ROOT/.circomlib"

mkdir -p "$ARTIFACTS"

if [ ! -d "$CIRCOMLIB/circuits" ]; then
  git clone --depth 1 https://github.com/iden3/circomlib.git "$CIRCOMLIB"
fi

cp "$CIRCOMLIB/circuits/comparators.circom" "$ROOT/comparators.circom"

echo "[dev] Compilando circuito..."
circom "$ROOT/geofence.circom" --r1cs --wasm --sym -o "$ARTIFACTS"

PTAU="$ARTIFACTS/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  echo "[dev] Descargando Powers of Tau (Hermez ptau12)..."
  curl -L -o "$ARTIFACTS/pot12_0000.ptau" \
    https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
  cp "$ARTIFACTS/pot12_0000.ptau" "$PTAU"
fi

echo "[dev] Setup Groth16 (1 contribución)..."
snarkjs groth16 setup "$ARTIFACTS/geofence.r1cs" "$PTAU" "$ARTIFACTS/geofence_0000.zkey"
snarkjs zkey contribute "$ARTIFACTS/geofence_0000.zkey" "$ARTIFACTS/geofence_final.zkey" \
  --name="AllRight DEV only" -v -e="dev-$(date +%s)"
snarkjs zkey export verificationkey "$ARTIFACTS/geofence_final.zkey" "$ARTIFACTS/verification_key.json"

echo "[dev] Artefactos listos en $ARTIFACTS"
echo "WARNING: Estos artefactos son solo para desarrollo."
