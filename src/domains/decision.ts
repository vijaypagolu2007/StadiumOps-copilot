
import {
  venues,
  scenarios,
  topologyKnowledge,
  translations,
  zoneKeys,
  authorizedOperatorSessions
} from "@/shared/data";
import type {
  VenueId,
  ScenarioId,
  ZoneId,
  DensityBand,
  ActionCommand,
  EdgeAlert,
  RetrievalChunk,
  GuardrailResult,
  DecisionEnvelope,
  FanVerification,
  SpatialRouteCheck,
  RuntimeMetrics
} from "@/shared/types";
import { StoreState } from "@/store/useOpsStore";

/** Constrains a numeric value to a [min, max] range. */
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Type guard: returns true if value is a finite number between 0 and 100 inclusive. */
export function isValidPercent(value: any): value is number {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Safely extracts a zone percentage, returning `fallback` for invalid telemetry. */
export function zonePercent(value: any, fallback = 50) {
  return isValidPercent(value) ? clamp(value, 0, 100) : fallback;
}

/** Averages only the valid percent values in an array, ignoring corrupt/null entries. */
export function averageKnown(values: any[], fallback = 50) {
  const clean = values.filter(isValidPercent);
  if (!clean.length) return fallback;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

/** Resolves a venue configuration by ID, defaulting to the first venue if not found. */
export function getVenue(venueId: string) {
  return venues.find((venue) => venue.id === venueId) || venues[0]!;
}

/** Resolves a scenario definition by ID, defaulting to gateSurge if not found. */
export function getScenario(scenarioId: string) {
  return scenarios[scenarioId] || scenarios["gateSurge"];
}

/** Maps a percentage to a severity level: critical (≥90), high (≥76), medium (≥56), low, or unknown. */
export function levelFor(value: any) {
  if (!isValidPercent(value)) return "unknown";
  if (value >= 90) return "critical";
  if (value >= 76) return "high";
  if (value >= 56) return "medium";
  return "low";
}

export function levelText(value: any) {
  const level = levelFor(value);
  if (level === "unknown") return "Fallback";
  return level === "critical" ? "Critical" : level === "high" ? "High" : level === "medium" ? "Watch" : "Low";
}

/** Maps a zone density percentage to a DensityBand for cache fingerprinting. */
export function densityBand(value: any): DensityBand {
  if (!isValidPercent(value)) return "fallback";
  if (value >= 90) return "critical";
  if (value >= 76) return "high";
  if (value >= 56) return "watch";
  return "low";
}

export function waitBand(value: any): DensityBand {
  if (value >= 22) return "critical";
  if (value >= 15) return "high";
  if (value >= 8) return "watch";
  return "low";
}

/** Validates a string is safe from XSS, control chars, and within max length (1200). */
export function strictString(value: any) {
  return typeof value === "string"
    && value.length <= 1200
    && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
    && !/<\s*script/i.test(value)
    && !/javascript\s*:/i.test(value);
}

/** Strips control characters and neutralizes script/javascript payloads in fan-facing text. */
export function sanitizeText(value: any) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/<\s*script/gi, "blocked-script")
    .replace(/javascript\s*:/gi, "blocked-protocol")
    .trim();
}

/** Returns risk/wait/access/waste metric offsets for the selected operating mode. */
export function modeAdjustment(mode: string) {
  return {
    balanced: { risk: 0, wait: 0, access: 0, waste: 0 },
    safety: { risk: -4, wait: 2, access: 3, waste: 0 },
    fan: { risk: 2, wait: -3, access: 1, waste: -1 },
    sustainability: { risk: 1, wait: 1, access: 0, waste: 5 }
  }[mode as "balanced" | "safety" | "fan" | "sustainability"] || { risk: 0, wait: 0, access: 0, waste: 0 };
}

export function getMetrics(state: StoreState): RuntimeMetrics {
  const venue = getVenue(state.venueId);
  const scenario = getScenario(state.scenarioId);
  const mode = modeAdjustment(state.mode);
  const wave = (state.tick % 3) * 2;
  const feedbackRelief = Math.round((state.feedback.eastRelief + state.feedback.transitRelief + state.feedback.accessBoost) / 4);
  const corruptionPenalty = state.corruption ? 5 : 0;
  return {
    risk: clamp(venue.baseRisk + scenario.riskBoost + mode.risk + wave + corruptionPenalty - feedbackRelief, 0, 100),
    wait: clamp(venue.baseWait + scenario.waitBoost + mode.wait + Math.round(wave / 2) + (state.corruption ? 2 : 0) - Math.round(state.feedback.transitRelief / 8), 0, 45),
    access: clamp(venue.access + scenario.accessBoost + mode.access + state.feedback.accessBoost - (state.corruption ? 4 : 0), 0, 100),
    waste: clamp(venue.waste + scenario.wasteBoost + mode.waste + state.feedback.wasteBoost, 0, 100)
  };
}

export function getZones(state: StoreState) {
  const scenario = getScenario(state.scenarioId);
  const shift = state.tick % 2 === 0 ? 0 : 4;
  const values = Object.fromEntries(
    Object.entries(scenario.zones).map(([key, value]) => [key, clamp((value as number) + shift, 0, 100)])
  ) as any;
  values.east = clamp(values.east - state.feedback.eastRelief, 0, 100);
  values.transit = clamp(values.transit - state.feedback.transitRelief, 0, 100);
  values.south = clamp(values.south + state.feedback.southLoad, 0, 100);
  values.fan = clamp(values.fan + state.feedback.fanBuffer, 0, 100);
  if (state.corruption) {
    values.west = null;
    values.bowl = "offline";
  }
  return values;
}

export function computeEdgeAlerts(zoneValues: any, metric: RuntimeMetrics): EdgeAlert[] {
  const alerts: EdgeAlert[] = [];
  zoneKeys.forEach(([key, label]) => {
    const rawValue = zoneValues[key];
    if (!isValidPercent(rawValue)) {
      alerts.push({
        id: `corrupt-${key}`,
        priority: "high",
        title: `${label} telemetry fallback`,
        summary: "Sensor input is missing or malformed; using route graph and nearby counts instead of raw stream."
      });
      return;
    }
    if (rawValue >= 90) {
      alerts.push({
        id: `density-${key}`,
        priority: "critical",
        title: `${label} density above 90%`,
        summary: "Edge rule triggered before GenAI generation; dispatch should prioritize this hotspot."
      });
    }
  });
  if (metric.access < 90) {
    alerts.push({
      id: "access-coverage",
      priority: "critical",
      title: "Accessible route coverage below 90%",
      summary: "Any route guidance must include a staffed physical backup."
    });
  }
  if (metric.waste < 68) {
    alerts.push({
      id: "waste-diversion",
      priority: "medium",
      title: "Waste diversion below target",
      summary: "Route green-team volunteers before generating fan sustainability nudges."
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: "nominal",
      priority: "low",
      title: "No edge thresholds breached",
      summary: "LLM receives summarized telemetry only; raw streams remain outside prompt context."
    });
  }
  return alerts;
}

export function retrieveGrounding(state: StoreState, venue: any, scenario: any, edgeAlerts: EdgeAlert[]): RetrievalChunk[] {
  const activeTags = new Set([
    state.scenarioId,
    state.mode,
    venue.region.toLowerCase(),
    "verification",
    ...edgeAlerts.map((alert) => alert.id.split("-")[0])
  ]);
  if (state.corruption) activeTags.add("edge");
  if (state.apiDegraded) activeTags.add("fallback");
  if (scenario.label.toLowerCase().includes("access")) activeTags.add("accessibility");

  const scored = topologyKnowledge.map((chunk) => {
    const score = chunk.tags.reduce((sum, tag) => sum + (activeTags.has(tag) ? 2 : 0), 0)
      + (chunk.text.toLowerCase().includes(venue.transit.split(" ")[0].toLowerCase()) ? 1 : 0);
    return { ...chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((chunk) => ({
      id: chunk.id,
      score: chunk.score,
      text: chunk.text
    }));
}

/**
 * Runs red-team guardrail checks against operator override text.
 * Detects prompt injection, audit tampering, broadcast bypass, and context-aware safety flags.
 */
export function redTeamOverride(text: string, state: StoreState, edgeAlerts: EdgeAlert[]): GuardrailResult {
  const value = (text || "").toLowerCase();
  const issues: string[] = [];
  const patterns: [string, string][] = [
    ["ignore", "Attempts to override system or venue policy."],
    ["disregard", "Attempts to bypass approved operating procedure."],
    ["developer", "References hidden instruction hierarchy."],
    ["system prompt", "Attempts to extract or alter hidden prompts."],
    ["delete audit", "Attempts to tamper with approval logs."],
    ["broadcast immediately", "Attempts to skip human approval for public messaging."],
    ["open all gates", "Unsafe blanket gate instruction detected."]
  ];

  patterns.forEach(([needle, copy]) => {
    if (value.includes(needle)) issues.push(copy);
  });

  if (state.corruption) {
    issues.push("Telemetry corruption is active; recommendations must cite fallback data quality.");
  }

  if (edgeAlerts.some((alert) => alert.id === "access-coverage") && !value.includes("cart")) {
    issues.push("Accessible route risk requires explicit physical backup dispatch.");
  }

  return {
    blocked: issues.some((issue) => issue.includes("skip human approval") || issue.includes("tamper") || issue.includes("hidden")),
    issues,
    passed: issues.length === 0
  };
}

export function channelForAction(title: string): any {
  const value = title.toLowerCase();
  if (value.includes("transit") || value.includes("rail") || value.includes("shuttle")) return "transit-partner";
  if (value.includes("vendor") || value.includes("green") || value.includes("waste") || value.includes("refill")) return "sustainability-team";
  if (value.includes("repair") || value.includes("facilities")) return "facilities";
  if (value.includes("script") || value.includes("radio")) return "radio";
  if (value.includes("volunteer") || value.includes("cart") || value.includes("mobility")) return "volunteer-tablet";
  if (value.includes("led") || value.includes("sign")) return "led";
  return "app";
}

export function scenarioActionsToObjects(scenario: any, scenarioId: string): ActionCommand[] {
  return scenario.actions.map(([priority = "", title = "", copy = ""]: string[], index: number) => ({
    id: `${scenarioId}-${index + 1}`,
    priority,
    title,
    dispatch: copy,
    channel: channelForAction(title + " " + copy),
    requiresApproval: ["critical", "high"].includes(priority),
    physicalBackup: /cart|mobility|medical|volunteer|corridor|shuttle|stage/i.test(title + " " + copy)
  }));
}

export function enforceMultimodalBackups(actions: ActionCommand[], scenarioId: string): ActionCommand[] {
  const needsBackup = scenarioId === "accessReroute" || actions.some((action) => /elevator|lift|step-free|accessible/i.test(action.title + " " + action.dispatch));
  if (!needsBackup) return actions;

  const hasPhysicalBackup = actions.some((action) => action.physicalBackup && /cart|mobility|volunteer|shuttle|corridor/i.test(action.title + " " + action.dispatch));
  if (hasPhysicalBackup) {
    return actions.map((action) => /cart|mobility|volunteer|shuttle|corridor/i.test(action.title + " " + action.dispatch)
      ? { ...action, physicalBackup: true }
      : action);
  }

  return [
    ...actions,
    {
      id: `${scenarioId}-physical-backup`,
      priority: "critical",
      title: "Dispatch physical accessibility backup",
      dispatch: "Send a mobile cart and two trained volunteers to the affected elevator corridor before publishing route guidance.",
      channel: "volunteer-tablet",
      requiresApproval: true,
      physicalBackup: true
    }
  ];
}

export function buildMultilingualMessages(scenarioId: string) {
  return Object.entries(translations).map(([language, bundle]) => {
    const appText = bundle[scenarioId] || translations["en"][scenarioId];
    return {
      language,
      label: bundle.label,
      channels: ["app", "led"] as ("app" | "led")[],
      appText,
      ledText: appText
    };
  });
}

/**
 * Checks step-free accessibility routes against current zone density.
 * Returns which routes are clear vs blocked, and a recommendation for operators.
 */
export function checkSpatialAccessibility(zoneValues: any, scenarioId: string) {
  const routes = [
    {
      id: "transit-to-west-access",
      label: "Transit Plaza to West Concourse step-free route",
      zones: ["transit", "west"],
      targetZones: ["Transit Plaza", "West Concourse"]
    },
    {
      id: "south-to-west-access",
      label: "South Gate to West Concourse step-free route",
      zones: ["south", "west"],
      targetZones: ["South Gate", "West Concourse"]
    }
  ];

  const checkedRoutes = routes.map((route) => {
    const blockers = route.zones
      .map((zone) => ({ zoneId: zone as ZoneId, value: zoneValues[zone] ?? null, band: densityBand(zoneValues[zone] ?? 0) }))
      .filter((zone) => zone.band === "critical" || zone.band === "fallback");
    return {
      ...route,
      status: blockers.length ? "blocked_or_uncertain" : "clear",
      blockers
    };
  });

  const primary = checkedRoutes[0]!;
  const fallback = checkedRoutes.find((route) => route.status === "clear");
  return {
    checkedAt: new Date().toISOString(),
    activeScenario: scenarioId,
    routes: checkedRoutes as SpatialRouteCheck[],
    accessibleAssistanceSafe: Boolean(fallback),
    selectedRouteId: fallback?.id || primary.id,
    recommendation: fallback
      ? `${fallback.label} is clear for wheelchair-accessible assistance.`
      : "All checked step-free assistance routes are blocked or uncertain; dispatch mobile carts before publishing route guidance."
  };
}

/** Appends an accessibility cart dispatch notice to fan messages when step-free routes are blocked. */
export function applySpatialMessageGuard(fanMessage: string, spatialChecks: any) {
  if (spatialChecks.accessibleAssistanceSafe) return fanMessage;
  return `${fanMessage} Staff are dispatching mobile accessibility carts because one or more step-free paths are blocked or uncertain.`;
}

export function addMultilingualDispatch(actions: ActionCommand[], multilingualMessages: any[], scenarioId: string): ActionCommand[] {
  const languages = multilingualMessages.map((message) => message.label).join(", ");
  return [
    ...actions,
    {
      id: `${scenarioId}-multilingual-dispatch`,
      priority: scenarioId === "volunteerGap" ? "high" : "medium",
      title: "Dispatch dynamic multilingual app and LED variants",
      dispatch: `Send generated app and LED text variants for ${languages}; QR help remains active if translation desks are overloaded.`,
      channel: "led",
      requiresApproval: true,
      physicalBackup: false
    }
  ];
}

export function localFallbackActions(scenario: any, scenarioId: string, _edgeAlerts: EdgeAlert[]): ActionCommand[] {
  const fallbackActions = scenarioActionsToObjects(scenario, scenarioId).map((action) => ({
    ...action,
    id: `${action.id}-local`,
    dispatch: `LOCAL FALLBACK: ${action.dispatch}`,
    requiresApproval: true
  }));

  fallbackActions.unshift({
    id: `${scenarioId}-local-critical-state`,
    priority: "critical",
    title: "Execute local critical-incident playbook",
    dispatch: "API degraded mode: use edge threshold alerts, printed route maps, radio scripts, and supervisor approval without waiting for LLM generation.",
    channel: "radio",
    requiresApproval: true,
    physicalBackup: false
  });

  return fallbackActions;
}

export function buildVerificationPlan(state: StoreState, _zoneValues: any, _metric: RuntimeMetrics): FanVerification {
  const base = state.fanVerification;
  const statusCopy = base.status === "below_target"
    ? "Compliance below target; increase physical signage, LED frequency, and volunteer intercepts."
    : base.status === "verified"
      ? "Compliance verified; continue monitoring for another 10 minute cycle."
      : "Awaiting first post-action compliance read.";

  return {
    ...base,
    statusCopy,
    nextAction: base.status === "below_target" ? "Escalate to physical intercept teams and regenerate stronger LED copy." : base.nextAction
  };
}

export function addVerificationActions(actions: ActionCommand[], verification: FanVerification, scenarioId: string): ActionCommand[] {
  if (verification.status !== "below_target") return actions;
  return [
    {
      id: `${scenarioId}-verification-escalation`,
      priority: "high",
      title: "Escalate fan redirection verification",
      dispatch: `Observed compliance is ${verification.observedPercent}% against target ${verification.targetPercent}%. Increase LED cadence, send two volunteer intercept teams, and re-check gate-count deltas in 5 minutes.`,
      channel: "led",
      requiresApproval: true,
      physicalBackup: true
    },
    ...actions
  ];
}

/**
 * Orchestrates the complete decision generation pipeline:
 * telemetry → edge alerts → RAG grounding → guardrails → spatial checks → actions → envelope.
 */
export function buildDecision(state: StoreState, source: string): DecisionEnvelope {
  const venue = getVenue(state.venueId);
  const scenario = getScenario(state.scenarioId);
  const metric = getMetrics(state);
  const zoneValues = getZones(state);
  const edgeAlerts = computeEdgeAlerts(zoneValues, metric);
  const grounding = retrieveGrounding(state, venue, scenario, edgeAlerts);
  const overrideText = state.operatorOverride.trim();
  const guardrail = redTeamOverride(overrideText, state, edgeAlerts);
  const lang = translations[state.language] || translations["en"];
  const spatialChecks = checkSpatialAccessibility(zoneValues, state.scenarioId);
  const fanMessage = applySpatialMessageGuard(lang[state.scenarioId] || translations["en"][state.scenarioId], spatialChecks);
  const multilingualMessages = buildMultilingualMessages(state.scenarioId);
  const verification = buildVerificationPlan(state, zoneValues, metric);
  const latencyTriggeredFallback = state.llmLatencyMs > 3000;
  const effectiveApiDegraded = state.apiDegraded || latencyTriggeredFallback;
  const baseActions = effectiveApiDegraded
    ? localFallbackActions(scenario, state.scenarioId, edgeAlerts)
    : scenarioActionsToObjects(scenario, state.scenarioId);
  
  const actions = addVerificationActions(
    addMultilingualDispatch(enforceMultimodalBackups(baseActions, state.scenarioId), multilingualMessages, state.scenarioId),
    verification,
    state.scenarioId
  );
  
  const fingerprint = {
    schemaVersion: "stadiumops.cache-key.v2",
    venueId: state.venueId,
    scenarioId: state.scenarioId,
    language: state.language,
    mode: state.mode,
    telemetryQuality: (state.corruption ? "fallback" : "clean") as "fallback" | "clean",
    densityBands: Object.fromEntries(zoneKeys.map(([key]) => [key, densityBand(zoneValues[key])])) as Record<ZoneId, DensityBand>,
    metricBands: {
      risk: densityBand(metric.risk),
      wait: waitBand(metric.wait),
      access: densityBand(metric.access),
      waste: densityBand(metric.waste)
    },
    verification: {
      status: state.fanVerification.status,
      complianceBand: (state.fanVerification.observedPercent < 0
        ? "negative"
        : densityBand(Math.min(state.fanVerification.complianceRate, 100))) as DensityBand | "negative"
    },
    edgeAlertIds: edgeAlerts.map((alert) => alert.id).sort()
  };

  const now = Date.now();
  
  return {
    id: `decision-${state.scenarioId}-${now}`,
    scenarioId: state.scenarioId as ScenarioId,
    venueId: state.venueId as VenueId,
    venueName: `${venue.stadium}, ${venue.city}`,
    language: state.language,
    fanMessage,
    multilingualMessages,
    verification,
    spatialChecks,
    metrics: metric,
    edgeAlerts,
    grounding,
    guardrails: guardrail,
    actions,
    dispatchLock: {
      status: "locked",
      requiresHmac: actions.some((action) => action.requiresApproval),
      authorizedOperatorRoles: Object.keys(authorizedOperatorSessions),
      lastDispatchResult: "not_attempted"
    },
    runtime: {
      source,
      cacheHit: false,
      cacheAgeSeconds: 0,
      fingerprint,
      cacheKeySchema: "structured-band-fuzzy-v2",
      generatedAt: new Date(now).toISOString(),
      schemaVersion: "stadiumops.action.v1",
      generationMode: effectiveApiDegraded ? "local-rule-state-machine" : "llm-tool-call",
      fallbackState: effectiveApiDegraded ? "local-rulebook" : "not-needed",
      fallbackReason: latencyTriggeredFallback ? `llm-latency-${state.llmLatencyMs}ms` : state.apiDegraded ? "manual-api-degraded-toggle" : "none",
      schemaValid: true,
      schemaErrors: []
    }
  };
}

export function simpleHash(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export async function signPayload(payload: any, operator = "ops-supervisor-demo") {
  const serialized = JSON.stringify(payload);
  const secret = authorizedOperatorSessions[operator];
  if (!secret) throw new Error("Unauthorized operator session");
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && cryptoApi.subtle) {
    const key = await cryptoApi.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await cryptoApi.subtle.sign("HMAC", key, new TextEncoder().encode(serialized));
    return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return simpleHash(`fallback:${secret}:${serialized}`);
}

export async function sha256Hex(text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && cryptoApi.subtle) {
    const digest = await cryptoApi.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return simpleHash(text);
}
