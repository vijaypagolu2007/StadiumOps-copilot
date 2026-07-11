# World Cup 2026 StadiumOps Copilot - Production Scaffold

This folder is a production-readiness scaffold for the prototype command center. It keeps the original product behavior but moves it to strict TypeScript, Solid.js, domain modules, workerized computation, signed dispatch, CI, infrastructure, and operations documentation.

## Refactored Codebase Structure

```text
stadium-copilot-production/
  src/
    app/
      App.tsx
    domains/
      telemetry/
        TelemetryService.ts
        edgeNormalizer.ts
      crowd/
        DigitalTwin.tsx
        density.ts
      rag/
        RagClient.ts
        knowledge.ts
      guardrails/
        AdversarialScanner.ts
      llm/
        LLMPipeline.ts
      dispatch/
        AuditChain.ts
        DispatchApi.ts
      i18n/
        Translator.ts
      accessibility/
        SpatialRouter.ts
      analytics/
        Compliance.ts
    shared/
      types.ts
      schemas.ts
    store/
      useOpsStore.ts
    workers/
      telemetry.worker.ts
      rag.worker.ts
  tests/
    unit/
    integration/
  infra/
    k8s/
    terraform/
    nginx/
  docs/
    ARCHITECTURE.md
    OPERATIONS.md
    SECURITY.md
```

## Production Readiness Decisions

- Solid.js is used for a small reactive surface area and predictable rendering.
- Zustand vanilla store keeps state updates outside component context and avoids re-render storms.
- The SVG digital twin is isolated as a component and exportable as a Web Component library.
- RAG scoring and telemetry normalization are workerized to protect the operator UI thread.
- Zod schemas are the contract boundary for telemetry, cache keys, decisions, actions, and dispatch.
- Ed25519 signatures replace HMAC for non-repudiable approval audit records.
- Fallback rulebook execution is automatic when model latency exceeds the 3 second SLA.

## Local Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm test
pnpm test:integration
```

The dependency versions are exact in `package.json`. Generate `pnpm-lock.yaml` in the deployment repo with `pnpm install --lockfile-only` before CI enforcement.
