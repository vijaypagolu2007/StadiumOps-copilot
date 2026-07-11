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
      qrScanCount: 0
    });
    expect(result.status).toBe("negative");
  });
});
