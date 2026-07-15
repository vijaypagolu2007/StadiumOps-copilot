# Deployment

StadiumOps is configured for Vercel: the Vite app is built to `dist/` and the `api/` directory is deployed as serverless functions.

## Required environment variables

Configure these in the Vercel project settings. Never expose them with a `VITE_` prefix or commit them to a `.env` file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes for AI plans | Used only by `api/plan.js` to call the Responses API. Without it, the UI deliberately uses a labelled safety fallback. |
| `OPENAI_MODEL` | No | Overrides the default `gpt-5.4` model. |
| `AUDIT_SIGNING_PRIVATE_KEY` | Yes before enabling `/api/audit` | Secret used to verify audit requests. |

## Release checklist

1. Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:integration`.
2. Set the required environment variables for Preview and Production.
3. Deploy a Preview first and test plan generation with a benign operator note and a blocked prompt-injection note.
4. Promote only after confirming the UI labels a fallback when the AI provider is unavailable and dispatch approval remains required.

The plan endpoint uses server-side OpenAI Responses API structured output, validates request bounds, blocks unsafe operator notes, and keeps model credentials out of the browser.
