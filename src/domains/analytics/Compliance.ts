import type { FanVerification } from "@/shared/types";

export function computeFanCompliance(input: {
  targetPercent: number;
  beforeEastCount: number;
  afterEastCount: number;
  southDeltaCount: number;
  appOpenCount: number;
  qrScanCount: number;
}): FanVerification {
  const movedAway = input.beforeEastCount - input.afterEastCount;
  const observedPercent =
    input.beforeEastCount === 0
      ? 0
      : Math.round(
          ((movedAway + input.southDeltaCount) / input.beforeEastCount) * 100,
        );
  const signalBoost = Math.min(
    8,
    Math.round((input.appOpenCount + input.qrScanCount) / 500),
  );
  const adjustedObserved = observedPercent + signalBoost;
  const complianceRate = Math.round(
    (adjustedObserved / input.targetPercent) * 100,
  );
  const status =
    adjustedObserved < 0
      ? "negative"
      : adjustedObserved >= input.targetPercent
        ? "verified"
        : "below_target";

  return {
    targetPercent: input.targetPercent,
    observedPercent: adjustedObserved,
    complianceRate,
    status,
    evidence: `${adjustedObserved}% observed redirect from gate deltas, app opens, and LED QR scans.`,
    nextAction:
      status === "verified"
        ? "Maintain cadence and re-check in 10 minutes."
        : "Escalate LED cadence, radio staff, and physical intercept teams.",
    lastChecked: new Date().toISOString(),
  };
}
