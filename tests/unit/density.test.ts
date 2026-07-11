import { describe, expect, it } from "vitest";
import {
  averageKnown,
  buildDensityBands,
  densityBand,
} from "@/domains/crowd/density";

describe("density utilities", () => {
  it("bands critical density", () => {
    expect(densityBand(91)).toBe("critical");
  });

  it("falls back for corrupt telemetry", () => {
    expect(densityBand(null)).toBe("fallback");
  });

  it("averages only valid sensor values", () => {
    expect(averageKnown([10, null, 20])).toBe(15);
  });

  it("builds strict zone band objects", () => {
    expect(
      buildDensityBands({
        north: 91,
        south: 42,
        west: 61,
        east: 80,
        transit: null,
        fan: 20,
        bowl: 50,
      }).transit,
    ).toBe("fallback");
  });
});
