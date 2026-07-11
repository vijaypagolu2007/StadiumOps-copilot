import { json, requireMethod, traceId } from "./_shared.js";

export default function handler(req, res) {
  if (!requireMethod(req, res, "GET")) return;
  json(res, 200, {
    traceId: traceId(req),
    job: "audit-reconcile",
    reconciled: true,
    checkedAt: new Date().toISOString(),
  });
}
