export type VenueId =
  | "ny-nj"
  | "toronto"
  | "boston"
  | "philadelphia"
  | "miami"
  | "dallas"
  | "kansas"
  | "houston"
  | "atlanta"
  | "monterrey"
  | "mexico-city"
  | "vancouver"
  | "seattle"
  | "sf-bay"
  | "los-angeles"
  | "guadalajara";

export type ScenarioId =
  | "gateSurge"
  | "accessReroute"
  | "stormDelay"
  | "transitCrush"
  | "sustainability"
  | "volunteerGap";

export type ZoneId = "north" | "south" | "west" | "east" | "transit" | "fan" | "bowl";
export type DensityBand = "low" | "watch" | "high" | "critical" | "fallback";
export type Priority = "low" | "medium" | "high" | "critical";
export type DispatchChannel =
  | "app"
  | "led"
  | "radio"
  | "volunteer-tablet"
  | "transit-partner"
  | "facilities"
  | "sustainability-team";

export interface Venue {
  id: VenueId;
  city: string;
  stadium: string;
  region: "East" | "Central" | "West";
  capacity: number;
  transitProfile: string;
  baseRisk: number;
}

export interface TelemetryFrame {
  venueId: VenueId;
  timestamp: string;
  sequence: number;
  zones: Record<ZoneId, number | null>;
  waitMinutes: number;
  accessibleRouteCoverage: number;
  wasteDiversion: number;
  source: "edge-gateway" | "replay" | "simulation";
  quality: "clean" | "degraded" | "corrupt";
}

export interface EdgeAlert {
  id: string;
  priority: Priority;
  title: string;
  summary: string;
  zoneId?: ZoneId;
}

export interface RetrievalChunk {
  id: string;
  version: string;
  tags: string[];
  text: string;
  sourceUri: string;
  score: number;
}

export interface GuardrailResult {
  allowed: boolean;
  score: number;
  issues: string[];
  canaryLeaked: boolean;
  rateLimited: boolean;
}

export interface MultilingualMessage {
  language: string;
  label: string;
  channels: Array<"app" | "led">;
  appText: string;
  ledText: string;
  dir: "ltr" | "rtl";
}

export interface SpatialRouteCheck {
  id: string;
  label: string;
  status: "clear" | "blocked" | "uncertain";
  zones: ZoneId[];
  blockers: Array<{ zoneId: ZoneId; band: DensityBand; value: number | null }>;
}

export interface FanVerification {
  targetPercent: number;
  observedPercent: number;
  complianceRate: number;
  status: "awaiting" | "verified" | "below_target" | "negative";
  evidence: string;
  nextAction: string;
  lastChecked: string;
}

export interface ActionCommand {
  id: string;
  priority: Priority;
  title: string;
  dispatch: string;
  channel: DispatchChannel;
  requiresApproval: boolean;
  physicalBackup: boolean;
  mapOverlay?: {
    kind: "lane" | "route" | "marker" | "zone";
    label: string;
    from?: ZoneId;
    to?: ZoneId;
    zoneId?: ZoneId;
  };
}

export interface CacheFingerprint {
  schemaVersion: "stadiumops.cache-key.v2";
  venueId: VenueId;
  scenarioId: ScenarioId;
  language: string;
  mode: "balanced" | "safety" | "fan" | "sustainability";
  telemetryQuality: "clean" | "fallback";
  densityBands: Record<ZoneId, DensityBand>;
  metricBands: {
    risk: DensityBand;
    wait: DensityBand;
    access: DensityBand;
    waste: DensityBand;
  };
  verification: {
    status: FanVerification["status"];
    complianceBand: DensityBand | "negative";
  };
  edgeAlertIds: string[];
}

export interface DispatchLock {
  status: "locked" | "unlocked" | "rejected";
  requiresSignature: boolean;
  keyId?: string;
  signature?: string;
  signedAt?: string;
}

export interface DecisionEnvelope {
  id: string;
  venueId: VenueId;
  scenarioId: ScenarioId;
  language: string;
  fanMessage: string;
  multilingualMessages: MultilingualMessage[];
  verification: FanVerification;
  spatialChecks: {
    accessibleAssistanceSafe: boolean;
    recommendation: string;
    routes: SpatialRouteCheck[];
  };
  edgeAlerts: EdgeAlert[];
  grounding: RetrievalChunk[];
  guardrails: GuardrailResult;
  actions: ActionCommand[];
  dispatchLock: DispatchLock;
  runtime: {
    schemaVersion: "stadiumops.action.v1";
    generationMode: "llm-tool-call" | "local-rule-state-machine";
    fallbackState: "not-needed" | "local-rulebook";
    fingerprint: CacheFingerprint;
    traceId: string;
    generatedAt: string;
  };
}
