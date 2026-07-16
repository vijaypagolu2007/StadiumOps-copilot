import { describe, expect, it } from "vitest";
import { computeFanCompliance } from "@/domains/analytics/Compliance";

describe("fan compliance", () => {
  it("flags negative compliance when fans move toward the surge", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 1000,
      afterEastCount: 1120,
      southDeltaCount: 0,
      appOpenCount: 0,
      qrScanCount: 0,
    });
    expect(result.status).toBe("negative");
    expect(result.observedPercent).toBeLessThan(0);
  });

  it("verifies compliance when observed redirect meets the target", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 1000,
      afterEastCount: 850,
      southDeltaCount: 20,
      appOpenCount: 500,
      qrScanCount: 200,
    });
    expect(result.status).toBe("verified");
    expect(result.complianceRate).toBeGreaterThanOrEqual(100);
  });

  it("flags below_target when partial compliance observed", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 1000,
      afterEastCount: 960,
      southDeltaCount: 10,
      appOpenCount: 100,
      qrScanCount: 50,
    });
    expect(result.status).toBe("below_target");
    expect(result.complianceRate).toBeLessThan(100);
  });

  it("handles zero initial count without division error", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 0,
      afterEastCount: 0,
      southDeltaCount: 0,
      appOpenCount: 0,
      qrScanCount: 0,
    });
    // 0/0 → observedPercent = 0, below target
    expect(result.observedPercent).toBeGreaterThanOrEqual(0);
    expect(result.status).not.toBe("negative");
  });

  it("caps signal boost at 8", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 1000,
      afterEastCount: 980,
      southDeltaCount: 0,
      appOpenCount: 50000,
      qrScanCount: 50000,
    });
    // Large app opens and QR scans should not cause signal boost to exceed 8
    expect(result.observedPercent).toBeLessThanOrEqual(30);
  });

  it("generates evidence string with percentage", () => {
    const result = computeFanCompliance({
      targetPercent: 12,
      beforeEastCount: 1000,
      afterEastCount: 900,
      southDeltaCount: 10,
      appOpenCount: 0,
      qrScanCount: 0,
    });
    expect(result.evidence).toContain("% observed redirect");
  });

  it("sets correct nextAction for verified status", () => {
    const result = computeFanCompliance({
      targetPercent: 5,
      beforeEastCount: 1000,
      afterEastCount: 850,
      southDeltaCount: 50,
      appOpenCount: 1000,
      qrScanCount: 500,
    });
    expect(result.nextAction).toContain("re-check");
  });

  it("sets escalation nextAction for below_target", () => {
    const result = computeFanCompliance({
      targetPercent: 50,
      beforeEastCount: 1000,
      afterEastCount: 980,
      southDeltaCount: 5,
      appOpenCount: 0,
      qrScanCount: 0,
    });
    expect(result.nextAction).toContain("Escalate");
  });
});
