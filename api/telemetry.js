import { json, readJson, requireMethod, traceId } from "./_shared.js";

export default async function handler(req, res) {
  if (!requireMethod(req, res, "POST")) return;
  const body = await readJson(req);
  const zones = body.zones || {};
  const alerts = Object.entries(zones)
    .filter(([, value]) => typeof value !== "number" || value >= 90)
    .map(([zone, value]) => ({
      id: typeof value === "number" ? `density-${zone}` : `fallback-${zone}`,
      zone,
      priority: typeof value === "number" && value >= 90 ? "critical" : "high",
    }));

  json(res, 200, {
    traceId: traceId(req),
    accepted: true,
    quality: alerts.some((alert) => alert.id.startsWith("fallback"))
      ? "degraded"
      : "clean",
    alerts,
  });
}
