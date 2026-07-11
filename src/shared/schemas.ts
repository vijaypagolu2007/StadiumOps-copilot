import { z } from "zod";

export const VenueIdSchema = z.enum([
  "ny-nj",
  "toronto",
  "boston",
  "philadelphia",
  "miami",
  "dallas",
  "kansas",
  "houston",
  "atlanta",
  "monterrey",
  "mexico-city",
  "vancouver",
  "seattle",
  "sf-bay",
  "los-angeles",
  "guadalajara",
]);

export const ScenarioIdSchema = z.enum([
  "gateSurge",
  "accessReroute",
  "stormDelay",
  "transitCrush",
  "sustainability",
  "volunteerGap",
]);

export const ZoneIdSchema = z.enum([
  "north",
  "south",
  "west",
  "east",
  "transit",
  "fan",
  "bowl",
]);
export const DensityBandSchema = z.enum([
  "low",
  "watch",
  "high",
  "critical",
  "fallback",
]);
export const PrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const DispatchChannelSchema = z.enum([
  "app",
  "led",
  "radio",
  "volunteer-tablet",
  "transit-partner",
  "facilities",
  "sustainability-team",
]);

const SafeTextSchema = z
  .string()
  .min(1)
  .max(1200)
  .refine(
    (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value),
    "control characters are not allowed",
  )
  .refine((value) => !/<\s*script/i.test(value), "script tags are not allowed")
  .refine(
    (value) => !/javascript\s*:/i.test(value),
    "javascript URLs are not allowed",
  );

export const TelemetryFrameSchema = z.object({
  venueId: VenueIdSchema,
  timestamp: z.string().datetime(),
  sequence: z.number().int().nonnegative(),
  zones: z.record(ZoneIdSchema, z.number().min(0).max(100).nullable()),
  waitMinutes: z.number().min(0).max(120),
  accessibleRouteCoverage: z.number().min(0).max(100),
  wasteDiversion: z.number().min(0).max(100),
  source: z.enum(["edge-gateway", "replay", "simulation"]),
  quality: z.enum(["clean", "degraded", "corrupt"]),
});

export const CacheFingerprintSchema = z.object({
  schemaVersion: z.literal("stadiumops.cache-key.v2"),
  venueId: VenueIdSchema,
  scenarioId: ScenarioIdSchema,
  language: z.string().min(2).max(12),
  mode: z.enum(["balanced", "safety", "fan", "sustainability"]),
  telemetryQuality: z.enum(["clean", "fallback"]),
  densityBands: z.record(ZoneIdSchema, DensityBandSchema),
  metricBands: z.object({
    risk: DensityBandSchema,
    wait: DensityBandSchema,
    access: DensityBandSchema,
    waste: DensityBandSchema,
  }),
  verification: z.object({
    status: z.enum(["awaiting", "verified", "below_target", "negative"]),
    complianceBand: z.union([DensityBandSchema, z.literal("negative")]),
  }),
  edgeAlertIds: z.array(z.string().regex(/^[a-z0-9-]+$/i)).max(30),
});

export const ActionCommandSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/i),
  priority: PrioritySchema,
  title: SafeTextSchema,
  dispatch: SafeTextSchema,
  channel: DispatchChannelSchema,
  requiresApproval: z.boolean(),
  physicalBackup: z.boolean(),
  mapOverlay: z
    .object({
      kind: z.enum(["lane", "route", "marker", "zone"]),
      label: SafeTextSchema,
      from: ZoneIdSchema.optional(),
      to: ZoneIdSchema.optional(),
      zoneId: ZoneIdSchema.optional(),
    })
    .optional(),
});

export const DecisionEnvelopeSchema = z.object({
  id: z.string().regex(/^decision-[a-z0-9-]+$/i),
  venueId: VenueIdSchema,
  scenarioId: ScenarioIdSchema,
  language: z.string().min(2).max(12),
  fanMessage: SafeTextSchema,
  multilingualMessages: z.array(
    z.object({
      language: z.string().min(2).max(12),
      label: SafeTextSchema,
      channels: z.tuple([z.literal("app"), z.literal("led")]),
      appText: SafeTextSchema,
      ledText: SafeTextSchema,
      dir: z.enum(["ltr", "rtl"]),
    }),
  ),
  verification: z.object({
    targetPercent: z.number().min(0).max(100),
    observedPercent: z.number().min(-100).max(100),
    complianceRate: z.number().min(-100).max(200),
    status: z.enum(["awaiting", "verified", "below_target", "negative"]),
    evidence: SafeTextSchema,
    nextAction: SafeTextSchema,
    lastChecked: SafeTextSchema,
  }),
  spatialChecks: z.object({
    accessibleAssistanceSafe: z.boolean(),
    recommendation: SafeTextSchema,
    routes: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/i),
        label: SafeTextSchema,
        status: z.enum(["clear", "blocked", "uncertain"]),
        zones: z.array(ZoneIdSchema),
        blockers: z.array(
          z.object({
            zoneId: ZoneIdSchema,
            band: DensityBandSchema,
            value: z.number().min(0).max(100).nullable(),
          }),
        ),
      }),
    ),
  }),
  edgeAlerts: z.array(
    z.object({
      id: z.string().regex(/^[a-z0-9-]+$/i),
      priority: PrioritySchema,
      title: SafeTextSchema,
      summary: SafeTextSchema,
      zoneId: ZoneIdSchema.optional(),
    }),
  ),
  grounding: z.array(
    z.object({
      id: z.string(),
      version: z.string(),
      tags: z.array(z.string()),
      text: SafeTextSchema,
      sourceUri: z.string(),
      score: z.number().finite(),
    }),
  ),
  guardrails: z.object({
    allowed: z.boolean(),
    score: z.number().min(0).max(100),
    issues: z.array(SafeTextSchema),
    canaryLeaked: z.boolean(),
    rateLimited: z.boolean(),
  }),
  actions: z.array(ActionCommandSchema).min(1).max(20),
  dispatchLock: z.object({
    status: z.enum(["locked", "unlocked", "rejected"]),
    requiresSignature: z.boolean(),
    keyId: z.string().optional(),
    signature: z.string().optional(),
    signedAt: z.string().datetime().optional(),
  }),
  runtime: z.object({
    schemaVersion: z.literal("stadiumops.action.v1"),
    generationMode: z.enum(["llm-tool-call", "local-rule-state-machine"]),
    fallbackState: z.enum(["not-needed", "local-rulebook"]),
    fingerprint: CacheFingerprintSchema,
    traceId: z.string(),
    generatedAt: z.string().datetime(),
  }),
});

export type DecisionEnvelopeDto = z.infer<typeof DecisionEnvelopeSchema>;
