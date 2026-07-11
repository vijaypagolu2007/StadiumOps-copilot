import type { DensityBand, ZoneId } from "@/shared/types";

export function densityBand(value: number | null | undefined): DensityBand {
  if (typeof value !== "number" || !Number.isFinite(value)) return "fallback";
  if (value >= 90) return "critical";
  if (value >= 76) return "high";
  if (value >= 56) return "watch";
  return "low";
}

export function averageKnown(
  values: Array<number | null | undefined>,
  fallback = 50,
): number {
  const clean = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );
  if (clean.length === 0) return fallback;
  return Math.round(
    clean.reduce((sum, value) => sum + value, 0) / clean.length,
  );
}

export function buildDensityBands(
  zones: Record<ZoneId, number | null>,
): Record<ZoneId, DensityBand> {
  return Object.fromEntries(
    Object.entries(zones).map(([zone, value]) => [zone, densityBand(value)]),
  ) as Record<ZoneId, DensityBand>;
}
