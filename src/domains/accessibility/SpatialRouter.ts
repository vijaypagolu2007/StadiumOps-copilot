import type { DensityBand, SpatialRouteCheck, TelemetryFrame, ZoneId } from "@/shared/types";
import { densityBand } from "@/domains/crowd/density";

const routes: Array<{ id: string; label: string; zones: ZoneId[] }> = [
  { id: "transit-west-stepfree", label: "Transit Plaza to West Concourse step-free route", zones: ["transit", "west"] },
  { id: "south-west-stepfree", label: "South Gate to West Concourse step-free route", zones: ["south", "west"] },
  { id: "north-west-stepfree", label: "North Gate to West Concourse step-free route", zones: ["north", "west"] }
];

export function checkAccessibleRoutes(frame: TelemetryFrame): {
  accessibleAssistanceSafe: boolean;
  recommendation: string;
  routes: SpatialRouteCheck[];
} {
  const checks = routes.map((route): SpatialRouteCheck => {
    const blockers = route.zones
      .map((zoneId) => {
        const value = frame.zones[zoneId];
        return { zoneId, value, band: densityBand(value) as DensityBand };
      })
      .filter((zone) => zone.band === "critical" || zone.band === "fallback");

    return {
      ...route,
      status: blockers.length ? "blocked" : "clear",
      blockers
    };
  });

  const openRoute = checks.find((route) => route.status === "clear");
  return {
    accessibleAssistanceSafe: Boolean(openRoute),
    recommendation: openRoute
      ? `${openRoute.label} is clear for accessible assistance.`
      : "All step-free assistance routes are blocked or uncertain; dispatch mobile carts before publishing guidance.",
    routes: checks
  };
}
