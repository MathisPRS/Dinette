#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Running seed..."
npx tsx /app/backend/prisma/seed.ts || true

echo "[entrypoint] Seeding MealIngredient table if empty..."
npx tsx /app/backend/prisma/seed-ingredients.ts || true

echo "[entrypoint] Starting backend (background)..."
node /app/backend/dist/index.js &
BACKEND_PID=$!

echo "[entrypoint] Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for either process to exit
wait -n $BACKEND_PID $NGINX_PID
EXIT_CODE=$?

echo "[entrypoint] A process exited with code $EXIT_CODE"
exit $EXIT_CODE
