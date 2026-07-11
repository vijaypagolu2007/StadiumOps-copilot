#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${VERCEL_PROJECT_NAME:-stadiumops-copilot}"
VERCEL_SCOPE_ARGS=()
if [[ -n "${VERCEL_TEAM:-}" ]]; then
  VERCEL_SCOPE_ARGS=(--scope "$VERCEL_TEAM")
fi

required_commands=(node pnpm vercel)
for command_name in "${required_commands[@]}"; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    exit 1
  fi
done

if [[ ! -f "vercel.json" ]]; then
  echo "Run this script from outputs/stadium-copilot-production, where vercel.json lives." >&2
  exit 1
fi

echo "==> Installing locked dependencies"
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install --frozen-lockfile

echo "==> Running local production checks"
pnpm build
pnpm test

echo "==> Linking Vercel project: ${PROJECT_NAME}"
vercel link --yes --project "$PROJECT_NAME" "${VERCEL_SCOPE_ARGS[@]}"

cat <<'ENV_HELP'

==> Required production secrets
Create these as Sensitive variables in Vercel Project Settings, or use the Vercel REST API with type="sensitive":
  OPENAI_API_KEY
  DATABASE_URL
  REDIS_URL
  AUDIT_SIGNING_PRIVATE_KEY
  ABLY_API_KEY or PUSHER_APP_KEY (optional realtime demo)

The Vercel CLI prompts cannot mark variables sensitive in every workflow, so verify the Sensitive tag in the dashboard before a public demo.
ENV_HELP

read -r -p "Have the required production env vars been added as Sensitive? [y/N] " env_ready
if [[ ! "$env_ready" =~ ^[Yy]$ ]]; then
  echo "Stopping before deploy so secrets can be configured safely." >&2
  exit 1
fi

echo "==> Deploying production"
vercel --prod "${VERCEL_SCOPE_ARGS[@]}"

cat <<'DONE'

Deployment requested. Useful follow-ups:
  vercel inspect --prod
  vercel logs --prod
  vercel rollback
DONE
