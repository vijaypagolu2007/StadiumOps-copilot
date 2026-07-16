import { describe, expect, it } from "vitest";
import { checkAccessibleRoutes } from "@/domains/accessibility/SpatialRouter";
import type { TelemetryFrame } from "@/shared/types";

/** Frame with all routes blocked due to critical density */
const blockedFrame: TelemetryFrame = {
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

/** Frame with clear routes */
const clearFrame: TelemetryFrame = {
  venueId: "toronto",
  timestamp: new Date().toISOString(),
  sequence: 2,
  zones: {
    north: 30,
    south: 25,
    west: 20,
    east: 40,
    transit: 35,
    fan: 20,
    bowl: 15,
  },
  waitMinutes: 6,
  accessibleRouteCoverage: 97,
  wasteDiversion: 78,
  source: "simulation",
  quality: "clean",
};

/** Frame with null zone values simulating sensor failure */
const corruptFrame: TelemetryFrame = {
  venueId: "ny-nj",
  timestamp: new Date().toISOString(),
  sequence: 3,
  zones: {
    north: 50,
    south: 30,
    west: null as any,
    east: 40,
    transit: null as any,
    fan: 25,
    bowl: 35,
  },
  waitMinutes: 10,
  accessibleRouteCoverage: 90,
  wasteDiversion: 72,
  source: "simulation",
  quality: "degraded",
};

describe("SpatialRouter", () => {
  it("detects blocked step-free routes when zones are critical", () => {
    const result = checkAccessibleRoutes(blockedFrame);
    expect(result.accessibleAssistanceSafe).toBe(false);
    expect(result.recommendation).toContain("mobile carts");
  });

  it("returns safe when all accessible routes are clear", () => {
    const result = checkAccessibleRoutes(clearFrame);
    expect(result.accessibleAssistanceSafe).toBe(true);
    expect(result.recommendation).toContain("clear for accessible assistance");
  });

  it("handles null zone sensors gracefully without crashing", () => {
    const result = checkAccessibleRoutes(corruptFrame);
    // null zones get coerced to 0 via ?? operator → "low" band → route is still "clear"
    const transitRoute = result.routes.find((r) => r.id === "transit-west-stepfree");
    expect(transitRoute).toBeDefined();
    expect(transitRoute?.blockers).toBeDefined();
    // We verify the router handles corrupt data without throwing
    expect(result.accessibleAssistanceSafe).toBeDefined();
  });

  it("returns correct number of routes", () => {
    const result = checkAccessibleRoutes(clearFrame);
    expect(result.routes.length).toBe(3);
  });

  it("each route has required properties", () => {
    const result = checkAccessibleRoutes(clearFrame);
    for (const route of result.routes) {
      expect(route).toHaveProperty("id");
      expect(route).toHaveProperty("label");
      expect(route).toHaveProperty("zones");
      expect(route).toHaveProperty("status");
      expect(route).toHaveProperty("blockers");
    }
  });

  it("blockers include zoneId, value, and band", () => {
    const result = checkAccessibleRoutes(blockedFrame);
    const blocked = result.routes.find((r) => r.status === "blocked");
    expect(blocked).toBeDefined();
    for (const blocker of blocked!.blockers) {
      expect(blocker).toHaveProperty("zoneId");
      expect(blocker).toHaveProperty("value");
      expect(blocker).toHaveProperty("band");
    }
  });

  it("selects the first clear route for recommendation", () => {
    // Only south-west is clear: south=25, west=20
    const mixedFrame: TelemetryFrame = {
      ...blockedFrame,
      zones: { north: 60, south: 25, west: 20, east: 95, transit: 92, fan: 30, bowl: 40 },
    };
    const result = checkAccessibleRoutes(mixedFrame);
    expect(result.accessibleAssistanceSafe).toBe(true);
    expect(result.recommendation).toContain("South Gate to West Concourse");
  });
});
