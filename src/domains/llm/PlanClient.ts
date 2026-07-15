import type { ActionCommand, DispatchChannel, Priority, ScenarioId, TelemetryFrame, VenueId, ZoneId } from "@/shared/types";

export interface PlanRequest {
  venueId: VenueId;
  scenarioId: ScenarioId;
  language: string;
  operatorOverride: string;
  frame: TelemetryFrame;
}

export interface GeneratedPlan {
  traceId: string;
  source: "openai" | "safety-fallback";
  reason: string | null;
  summary: string;
  fanMessage: string;
  actions: Array<Omit<ActionCommand, "id" | "requiresApproval" | "physicalBackup" | "mapOverlay"> & { zoneId: ZoneId }>;
}

export async function requestPlan(input: PlanRequest): Promise<GeneratedPlan> {
  const response = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.error || "Unable to generate a plan.");
  return result as GeneratedPlan;
}

export function planActions(plan: GeneratedPlan): ActionCommand[] {
  return plan.actions.map((action, index) => ({
    id: `generated-${index + 1}`,
    title: action.title,
    dispatch: action.dispatch,
    priority: action.priority as Priority,
    channel: action.channel as DispatchChannel,
    requiresApproval: true,
    physicalBackup: action.zoneId === "transit" || action.zoneId === "west",
    mapOverlay: { kind: "zone", label: action.title, zoneId: action.zoneId },
  }));
}
