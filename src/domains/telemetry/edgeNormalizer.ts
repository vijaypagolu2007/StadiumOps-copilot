import type { EdgeAlert, TelemetryFrame } from "@/shared/types";
import { densityBand } from "@/domains/crowd/density";

export function normalizeTelemetry(frame: TelemetryFrame): {
  frame: TelemetryFrame;
  alerts: EdgeAlert[];
} {
  const alerts: EdgeAlert[] = [];
  for (const [zoneId, value] of Object.entries(frame.zones)) {
    const band = densityBand(value);
    if (band === "critical") {
      alerts.push({
        id: `density-${zoneId}`,
        priority: "critical",
        title: `${zoneId} density above threshold`,
        summary: "Edge threshold fired before LLM orchestration.",
        zoneId: zoneId as EdgeAlert["zoneId"],
      });
    }
    if (band === "fallback") {
      alerts.push({
        id: `fallback-${zoneId}`,
        priority: "high",
        title: `${zoneId} telemetry fallback`,
        summary:
          "Malformed or missing sensor value; route graph fallback is active.",
        zoneId: zoneId as EdgeAlert["zoneId"],
      });
    }
  }
  if (frame.accessibleRouteCoverage < 90) {
    alerts.push({
      id: "accessible-route-coverage",
      priority: "critical",
      title: "Accessible route coverage below SLA",
      summary: "Physical backup dispatch is mandatory.",
    });
  }
  return { frame, alerts };
}
