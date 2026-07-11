import { describe, expect, it } from "vitest";
import { checkAccessibleRoutes } from "@/domains/accessibility/SpatialRouter";
import type { TelemetryFrame } from "@/shared/types";

const frame: TelemetryFrame = {
  venueId: "ny-nj",
  timestamp: new Date().toISOString(),
  sequence: 1,
  zones: {
    north: 60,
    south: 40,
    west: 95,
    east: 95,
    transit: 92,
    fan: 30,
    bowl: 40,
  },
  waitMinutes: 12,
  accessibleRouteCoverage: 88,
  wasteDiversion: 70,
  source: "simulation",
  quality: "clean",
};

describe("SpatialRouter", () => {
  it("detects blocked step-free routes", () => {
    const result = checkAccessibleRoutes(frame);
    expect(result.accessibleAssistanceSafe).toBe(false);
    expect(result.recommendation).toContain("mobile carts");
  });
});
