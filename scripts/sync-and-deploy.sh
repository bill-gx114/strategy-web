#!/bin/zsh
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node/bin:$PATH"

cd "$project_root"

npm run sync-content
npm run verify:sync
npm run typecheck
vercel build --prod

if [[ "${DEPLOY:-1}" == "0" ]]; then
  echo "DEPLOY=0, skipped Vercel production deployment"
  exit 0
fi

vercel deploy --prebuilt --prod
