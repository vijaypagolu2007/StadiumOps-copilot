import { json, readJson, requireMethod, traceId } from "./_shared.js";

const chunks = [
  {
    id: "topo-east-gates",
    tags: ["gateSurge", "east", "ingress"],
    text: "East Gate connects to temporary lanes E4-E7, South Gate relief signage, and transit-plaza LED boards.",
  },
  {
    id: "policy-access-backup",
    tags: ["accessibility", "elevator", "physical-backup"],
    text: "Any elevator outage requires physical backup before route guidance is published.",
  },
  {
    id: "policy-local-fallback",
    tags: ["fallback", "edge"],
    text: "If model latency breaches 3 seconds, execute deterministic local rulebook actions.",
  },
];

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  const body = await readJson(req);
  const tags = new Set([body.scenarioId, ...(body.tags || [])]);
  const results = chunks
    .map((chunk) => ({
      ...chunk,
      score: chunk.tags.reduce(
        (score, tag) => score + (tags.has(tag) ? 2 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, body.limit || 4);

  json(res, 200, { traceId: traceId(req), chunks: results });
}
