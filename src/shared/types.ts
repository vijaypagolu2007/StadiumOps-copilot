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

export type ZoneId =
  | "north"
  | "south"
  | "west"
  | "east"
  | "transit"
  | "fan"
  | "bowl";

export type DensityBand = "low" | "watch" | "high" | "critical" | "fallback";
export type Priority = "low" | "medium" | "high" | "critical";
export type DispatchChannel =
  | "app"
  | "led"
  | "radio"
  | "volunteer-tablet"
  | "transit-partner"
  | "facilities"
  | "sustainability-team"
  | string;

export interface Venue {
  id: VenueId;
  city: string;
  stadium: string;
  region: "East" | "Central" | "West";
  capacity: number;
  transitProfile: string;
  baseRisk: number;
}

export interface EdgeAlert {
  id: string;
  priority: Priority;
  title: string;
  summary: string;
}

export interface RetrievalChunk {
  id: string;
  text: string;
  score: number;
}

export interface GuardrailResult {
  blocked: boolean;
  passed: boolean;
  issues: string[];
}

export interface MultilingualMessage {
  language: string;
  label: string;
  channels: Array<"app" | "led">;
  appText: string;
  ledText: string;
}

export interface SpatialRouteCheck {
  id: string;
  label: string;
  status: "clear" | "blocked_or_uncertain";
  zones: string[];
  blockers: Array<{ zone: string; band: DensityBand; value: number | null }>;
}

export interface FanVerification {
  targetPercent: number;
  observedPercent: number;
  complianceRate: number;
  status: "awaiting" | "verified" | "below_target" | "negative";
  evidence: string;
  nextAction: string;
  lastChecked: string;
  statusCopy?: string;
}

export interface ActionCommand {
  id: string;
  priority: Priority;
  title: string;
  dispatch: string;
  channel: DispatchChannel;
  requiresApproval: boolean;
  physicalBackup: boolean;
  mapOverlay?: { label: string };
}

export interface CacheFingerprint {
  schemaVersion: "stadiumops.cache-key.v2" | string;
  venueId: VenueId;
  scenarioId: ScenarioId;
  language: string;
  mode: "balanced" | "safety" | "fan" | "sustainability" | string;
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
  requiresHmac: boolean;
  authorizedOperatorRoles: string[];
  lastDispatchResult: string;
  operator?: string;
  signatureHash?: string;
}

export interface RuntimeMetrics {
  risk: number;
  wait: number;
  access: number;
  waste: number;
}

export interface DecisionEnvelope {
  id: string;
  scenarioId: ScenarioId;
  venueId: VenueId;
  venueName: string;
  language: string;
  fanMessage: string;
  multilingualMessages: MultilingualMessage[];
  verification: FanVerification;
  spatialChecks: {
    accessibleAssistanceSafe: boolean;
    recommendation: string;
    routes: SpatialRouteCheck[];
    selectedRouteId?: string;
  };
  metrics: RuntimeMetrics;
  edgeAlerts: EdgeAlert[];
  grounding: RetrievalChunk[];
  guardrails: GuardrailResult;
  actions: ActionCommand[];
  dispatchLock: DispatchLock;
  runtime: {
    source: string;
    cacheHit: boolean;
    cacheAgeSeconds: number;
    fingerprint: CacheFingerprint;
    cacheKeySchema: string;
    generatedAt: string;
    schemaVersion: "stadiumops.action.v1" | string;
    generationMode: string;
    fallbackState: string;
    fallbackReason: string;
    schemaValid?: boolean;
    schemaErrors?: string[];
  };
}

export interface AuditEntry {
  decisionId: string;
  operator: string;
  timestamp: string;
  venueId: VenueId;
  scenarioId: ScenarioId;
  fanMessage: string;
  approvedActions: Array<{ id: string; title: string; channel: string }>;
  previousHash: string;
  payload: any;
  signature: string;
  entryHash: string;
  actionCount: number;
  dispatchResult: {
    accepted: boolean;
    reason: string;
    acceptedAt?: string;
  };
}
