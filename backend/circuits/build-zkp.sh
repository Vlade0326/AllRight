#!/bin/sh
# Wrapper — por defecto build de desarrollo.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/build-zkp-dev.sh"
