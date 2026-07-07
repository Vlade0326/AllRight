#!/bin/sh
# Contribución externa a la ceremonia de producción.
# Uso: ./contribute.sh <zkey_entrada> <zkey_salida> "Nombre del contribuidor"
set -e

if [ "$#" -lt 3 ]; then
  echo "Uso: $0 <zkey_input> <zkey_output> <contributor_name>"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
NAME="$3"
ENTROPY="${4:-$(openssl rand -hex 32 2>/dev/null || date +%s%N)}"

echo "Contribuyendo como: $NAME"
snarkjs zkey contribute "$INPUT" "$OUTPUT" --name="$NAME" -v -e="$ENTROPY"
echo "Contribución guardada en: $OUTPUT"
echo "Comparte SOLO el archivo de salida, nunca tu entropy."
