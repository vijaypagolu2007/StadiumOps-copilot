# Security

## Threat Model

| Threat | Risk | Mitigation |
| --- | --- | --- |
| Prompt injection in operator override | Unsafe public guidance | 25+ regex patterns, semantic similarity score, canary token, rate limit |
| Forged approval | Unauthorized broadcast | Ed25519 signatures, dispatch API verification, key rotation |
| Telemetry spoofing | Bad crowd decisions | Edge validation, schema rejection, fallback zone bands |
| XSS via generated text | Dashboard compromise | Zod safe text schema, Trusted Types policy plan, CSP |
| Audit tampering | Loss of accountability | Hash-linked audit chain, S3 replication, Glacier retention |
| Dependency confusion | Supply-chain compromise | Private registry scope, exact dependency versions, lockfile enforcement |

## Runtime Headers

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' wss://*.stadiumops.fifa2026.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
```

## Cryptography

- Audit approvals use Ed25519 signatures for non-repudiation.
- WebCrypto is required. If `crypto.subtle` is unavailable, dispatch fails closed.
- Signing keys rotate every 24 hours.
- Dispatch API rejects approval-required actions without a verified signature.

## Adversarial Controls

- Injection scanner detects direct and obfuscated override attempts.
- Semantic similarity hook catches paraphrased attacks.
- Canary tokens detect prompt extraction.
- Operator override rate limit is capped at 10 per minute per session.
- Output schema validation rejects malformed tool calls and unsafe text before rendering.

## Supply Chain

- Exact dependency versions in `package.json`.
- `.npmrc` pins private scope and exact saves.
- CI runs dependency audit at moderate severity or higher.
- Trivy scans filesystem and container dependencies.
