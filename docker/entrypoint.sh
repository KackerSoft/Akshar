#!/bin/sh
set -e

echo "Applying database migrations..."
pnpm exec prisma migrate deploy

exec "$@"
