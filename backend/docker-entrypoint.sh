#!/bin/sh
set -e

echo "Running database migrations..."
node dist/infrastructure/persistence/typeorm/run-migrations.js

echo "Starting AllRight API..."
exec node dist/main.js
