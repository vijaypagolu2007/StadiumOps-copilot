# Operations Runbooks

## 1. Gate Surge

Trigger: any gate or concourse zone reaches `critical` density.

1. Confirm edge alert and sensor quality.
2. Generate decision with RAG topology chunks.
3. Verify spatial overlay for temporary lanes and redirect route.
4. Approve signed public message.
5. Re-check fan compliance within 10 minutes.
6. If compliance is below target, escalate to physical intercept teams.

## 2. Accessibility Reroute

Trigger: elevator outage or accessible route coverage below 90%.

1. Run `SpatialRouter` route check.
2. Require physical backup action in `DecisionEnvelope`.
3. Dispatch mobility carts before digital-only route guidance.
4. Publish app and LED guidance in all active venue languages.
5. Log signed approval and facilities ticket.

## 3. LLM Latency Spike

Trigger: model call exceeds 3 seconds.

1. Abort provider request.
2. Execute local deterministic rulebook.
3. Keep Ed25519 approval lock active.
4. Mark runtime `fallbackState=local-rulebook`.
5. Notify observability channel with trace ID and provider latency.

## 4. Telemetry Corruption

Trigger: malformed, missing, or out-of-range zone values.

1. Reject frame via `TelemetryFrameSchema` or mark fallback zone band.
2. Use route graph and adjacent camera counts.
3. Block raw corrupt telemetry from prompt context.
4. Require operator note before public dispatch.

## 5. Network Partition During Approval

Trigger: dispatch API or audit archive unreachable.

1. Keep decision locked.
2. Store local signed entry in IndexedDB pending queue.
3. Use CRDT merge when connectivity resumes.
4. Do not publish approval-required actions until signature verification succeeds.

## Operational Metrics

- `decisions_total`
- `cache_hits_total`
- `guardrail_blocks_total`
- `approval_latency_ms`
- `llm_fallback_total`
- `fan_compliance_negative_total`

## Disaster Recovery

- Primary: US-East
- Secondary: US-West
- Tertiary: EU-West
- Route 53 health checks fail over in under 30 seconds.
- Audit archive: 7-day hot retention, 1-year Glacier retention.
