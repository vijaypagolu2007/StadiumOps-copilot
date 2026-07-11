# Vercel Hackathon Deploy

This project is configured for a fast Vercel deploy of the StadiumOps Copilot production scaffold.

## 60-second path

```bash
cd outputs/stadium-copilot-production
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
vercel link --yes --project stadiumops-copilot
vercel --prod
```

## Required production environment variables

Create these as **Sensitive** variables in Vercel Project Settings:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `AUDIT_SIGNING_PRIVATE_KEY`

Optional for realtime demo:

- `ABLY_API_KEY`
- `PUSHER_APP_KEY`

Important: Vercel sensitive env vars are created with the dashboard Sensitive switch or the REST API `type: "sensitive"`. Do not rely on an `@` prefix in the variable name.

## Routes

- `/` serves the Vite/Solid dashboard.
- `/healthz` rewrites to `/api/health.js`.
- `/api/telemetry` normalizes telemetry frames.
- `/api/rag` returns venue grounding chunks.
- `/api/guardrail` screens operator override text.
- `/api/audit` verifies signed approval payloads.
- `/api/audit-reconcile` is scheduled every 6 hours.
- `/api/cache-warm` is scheduled every 10 minutes.

## Security headers

Configured in `vercel.json`:

- CSP with `frame-ancestors 'none'`
- HSTS preload
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Permissions Policy blocking camera, mic, geolocation, payment, USB, Bluetooth, and serial APIs

## Known platform tradeoffs

- Native WebSockets are not the right fit for Vercel Functions. Use Ably, Pusher, or a dedicated edge gateway for realtime fan/venue telemetry.
- Keep heavy RAG/vector computation in managed storage or workers; serverless functions should orchestrate and validate.
- Function timeout is capped by plan and runtime settings, so long-running workflows should move to Vercel Workflow/Queues or external workers.
