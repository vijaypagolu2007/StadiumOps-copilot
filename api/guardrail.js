import {
  json,
  readJson,
  requireMethod,
  requireSameOrigin,
  traceId,
} from "./_shared.js";

const patterns = [
  /\b(ignore|disregard|override)\b.+\b(policy|rules|instructions)\b/i,
  /\b(system prompt|developer message|hidden instruction)\b/i,
  /\b(delete|erase|modify)\b.+\b(audit|log|signature)\b/i,
  /\b(skip|bypass)\b.+\b(approval|signature|supervisor)\b/i,
  /<\s*script|javascript\s*:/i,
];

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  if (!requireSameOrigin(req, res)) return;
  const body = await readJson(req, res);
  if (!body) return;
  const text = String(body.text || "");
  const issues = patterns
    .map((pattern, index) =>
      pattern.test(text) ? `pattern-${index + 1}` : null,
    )
    .filter(Boolean);

  json(res, 200, {
    traceId: traceId(req),
    allowed: issues.length === 0,
    score: Math.min(100, issues.length * 20),
    issues,
  });
}
