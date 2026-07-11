# Architecture

## Goals

StadiumOps Copilot is a real-time operational intelligence system for FIFA World Cup 2026 venues. It prioritizes safety, accessibility, observability, and human-approved public action.

## C4 Context

```mermaid
C4Context
  title StadiumOps Copilot Context
  Person(operator, "Venue Operator", "Approves public broadcasts and dispatches")
  Person(volunteer, "Volunteer", "Receives localized instructions")
  Person(fan, "Fan", "Receives app and LED guidance")
  System(copilot, "StadiumOps Copilot", "Real-time GenAI command center")
  System_Ext(edge, "Venue Edge Gateway", "Telemetry validation and threshold alerts")
  System_Ext(transit, "Transit APIs", "Train, shuttle, and platform load")
  System_Ext(llm, "LLM Providers", "Structured decision generation")
  Rel(operator, copilot, "Uses")
  Rel(edge, copilot, "Streams normalized telemetry")
  Rel(copilot, llm, "Requests schema-constrained decisions")
  Rel(copilot, transit, "Queries status")
  Rel(copilot, fan, "Publishes signed guidance")
  Rel(copilot, volunteer, "Dispatches tasks")
```

## C4 Container

```mermaid
C4Container
  title StadiumOps Copilot Containers
  Container(web, "Dashboard", "Solid.js + TypeScript", "Operator UI and digital twin")
  Container(edge, "Edge Workers", "Cloudflare/Vercel Edge", "Telemetry validation and cache warming")
  Container(api, "Ops API", "Node.js", "RAG, LLM orchestration, dispatch, audit")
  ContainerDb(pg, "Postgres + pgvector", "RDS", "Venue topology and embeddings")
  ContainerDb(redis, "Redis", "ElastiCache", "Semantic cache and rate limits")
  ContainerDb(s3, "S3 Audit Archive", "S3 + Glacier", "Immutable audit export")
  Rel(web, api, "HTTPS/WebSocket")
  Rel(edge, api, "Normalized frames")
  Rel(api, pg, "Vector retrieval")
  Rel(api, redis, "Cache and rate limit")
  Rel(api, s3, "Replicates audit chain")
```

## C4 Component

```mermaid
C4Component
  title StadiumOps Copilot Components
  Container_Boundary(web, "Dashboard") {
    Component(ui, "App.tsx", "Solid.js", "Operator UI and command workflow")
    Component(twin, "DigitalTwin", "SVG Web Component", "Heatmap rendering and generated action overlays")
    Component(store, "useOpsStore", "Zustand", "State management without context re-render storms")
  }
  Container_Boundary(edgeClient, "Client Workers") {
    Component(telemetryWorker, "telemetry.worker.ts", "Web Worker", "Telemetry normalization and corruption handling")
    Component(ragWorker, "rag.worker.ts", "Web Worker", "Vector scoring and retrieval coalescing")
  }
  Container_Boundary(api, "Ops API") {
    Component(telemetry, "TelemetryService", "TypeScript", "Binary WebSocket ingestion and replay")
    Component(rag, "RagClient", "TypeScript", "Venue topology retrieval")
    Component(guard, "AdversarialScanner", "TypeScript", "Prompt injection, canary, rate-limit, and semantic attack checks")
    Component(llmPipeline, "LLMPipeline", "TypeScript", "Structured tool-calling and local fallback rulebook")
    Component(schema, "DecisionEnvelopeSchema", "Zod", "Runtime contract enforcement")
    Component(dispatch, "DispatchApi", "TypeScript", "Signed dispatch acceptance gate")
    Component(audit, "AuditChain", "WebCrypto Ed25519", "Hash-linked non-repudiable approvals")
    Component(spatial, "SpatialRouter", "TypeScript", "Accessible route conflict checks")
    Component(analytics, "Compliance", "TypeScript", "Closed-loop fan compliance metrics")
  }
  ContainerDb(pg, "Postgres + pgvector", "RDS", "Venue topology and embeddings")
  ContainerDb(redis, "Redis", "ElastiCache", "Semantic cache and rate limits")
  ContainerDb(s3, "S3 Audit Archive", "S3 + Glacier", "Immutable audit export")

  Rel(ui, store, "Reads/writes operational state")
  Rel(store, twin, "Supplies densities and action overlays")
  Rel(telemetry, telemetryWorker, "Offloads frame validation")
  Rel(rag, ragWorker, "Offloads vector scoring")
  Rel(llmPipeline, rag, "Retrieves grounded context")
  Rel(llmPipeline, guard, "Validates operator overrides")
  Rel(llmPipeline, schema, "Enforces structured decision JSON")
  Rel(llmPipeline, spatial, "Checks accessible routes")
  Rel(llmPipeline, analytics, "Uses compliance feedback")
  Rel(dispatch, audit, "Verifies signed approvals")
  Rel(rag, pg, "Reads topology chunks")
  Rel(llmPipeline, redis, "Uses semantic cache")
  Rel(audit, s3, "Exports audit chain")
```

## Code-Level Contracts

- `TelemetryFrameSchema` rejects malformed sensor frames before state update.
- `DecisionEnvelopeSchema` rejects unsafe strings, invalid actions, malformed cache keys, and missing dispatch locks.
- `AuditChain` fails closed if WebCrypto is unavailable.
- `LLMPipeline` falls back to local rulebook when latency exceeds 3 seconds or guardrails block generation.
- `DigitalTwin` maps generated actions onto the SVG to reduce operator cognitive load.

## Scaling Across 16 Venues

- Venue-local edge gateways normalize telemetry.
- Central Ops API keeps deterministic state machines available for degraded network modes.
- Semantic cache uses structured density bands to reuse decisions across near-identical crowd patterns.
- Audit chain exports to S3 with lifecycle retention and Glacier archival.
