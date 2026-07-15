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

export async function readJson(req, res, maxBytes = 16_384) {
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBytes) {
        json(res, 413, { error: "payload_too_large" });
        return undefined;
      }
      chunks.push(chunk);
    }
    if (chunks.length === 0) return {};
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      json(res, 400, { error: "json_object_required" });
      return undefined;
    }
    return parsed;
  } catch {
    json(res, 400, { error: "invalid_json" });
    return undefined;
  }
}

export function requireSameOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = String(
      req.headers["x-forwarded-host"] || req.headers.host || "",
    ).split(",")[0];
    if (originHost === requestHost) return true;
  } catch {
    // Fall through to the rejection below.
  }
  json(res, 403, { error: "cross_origin_request_blocked" });
  return false;
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
