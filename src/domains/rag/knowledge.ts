import type { RetrievalChunk } from "@/shared/types";

export const topologyKnowledge: RetrievalChunk[] = [
  {
    id: "topo-east-gates",
    version: "2026.1",
    tags: ["gateSurge", "east", "ingress"],
    text: "East Gate connects to temporary lanes E4-E7, South Gate relief signage, and transit-plaza LED boards.",
    sourceUri: "venue://topology/east-gates",
    score: 0,
  },
  {
    id: "policy-access-backup",
    version: "2026.1",
    tags: ["accessibility", "elevator", "physical-backup"],
    text: "Any elevator outage requires a physical backup dispatch before digital route guidance is published.",
    sourceUri: "policy://accessibility/physical-backup",
    score: 0,
  },
  {
    id: "policy-local-fallback",
    version: "2026.1",
    tags: ["fallback", "safety", "edge"],
    text: "If model latency breaches 3 seconds, execute deterministic local rulebook actions and keep audit signing active.",
    sourceUri: "policy://llm/fallback",
    score: 0,
  },
  {
    id: "policy-fan-verification",
    version: "2026.1",
    tags: ["fan", "verification", "compliance"],
    text: "Fan redirection must be verified through app opens, LED QR scans, geofenced movement, and gate-count deltas.",
    sourceUri: "policy://analytics/fan-verification",
    score: 0,
  },
];
