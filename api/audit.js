import { createHmac, timingSafeEqual } from "node:crypto";
import {
  json,
  readJson,
  requireEnv,
  requireMethod,
  traceId,
} from "./_shared.js";

function sign(payload, secret) {
  return createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  const env = requireEnv(["AUDIT_SIGNING_PRIVATE_KEY"]);
  if (!env.ok) {
    json(res, 503, { error: "missing_env", missing: env.missing });
    return;
  }

  const body = await readJson(req);
  const expected = sign(
    body.payload || {},
    process.env.AUDIT_SIGNING_PRIVATE_KEY,
  );
  const provided = String(body.signature || "");
  const verified =
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));

  json(res, verified ? 200 : 401, {
    traceId: traceId(req),
    accepted: verified,
    reason: verified ? "accepted_signed_payload" : "invalid_signature",
  });
}
