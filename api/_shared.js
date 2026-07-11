export function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function requireMethod(req, res, method) {
  if (req.method !== method) {
    json(res, 405, { error: "method_not_allowed", expected: method });
    return false;
  }
  return true;
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function requireEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, missing: [] };
}

export function traceId(req) {
  return req.headers["x-vercel-id"] || `local-${Date.now()}`;
}
