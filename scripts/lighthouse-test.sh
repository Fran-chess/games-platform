#!/bin/bash

set -e  # Exit on error

echo "🏗️  Building apps for production..."
pnpm build --filter=@games-platform/roulette --filter=@games-platform/memotest

echo "🚀 Starting production servers..."
# Iniciar ambos en background
pnpm --filter=@games-platform/roulette start -p 3000 &
PID_ROULETTE=$!
pnpm --filter=@games-platform/memotest start -p 3001 &
PID_MEMOTEST=$!

# Healthcheck
echo "⏳ Waiting for servers to be ready..."
npx wait-on http://localhost:3000 http://localhost:3001 -t 30000

echo "📊 Running Lighthouse CI..."
pnpm lhci autorun --config=lighthouserc.js

# Cleanup
echo "🧹 Stopping servers..."
kill $PID_ROULETTE $PID_MEMOTEST

echo "✅ Lighthouse tests complete!"
echo "📁 Reports available at: .lighthouseci/"
