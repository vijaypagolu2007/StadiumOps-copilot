import { createStore } from "zustand/vanilla";
import type {
  DecisionEnvelope,
  EdgeAlert,
  VenueId,
  ScenarioId,
  FanVerification,
  AuditEntry,
  RuntimeMetrics
} from "@/shared/types";
import { buildDecision, getMetrics, getZones, computeEdgeAlerts } from "@/domains/decision";

export interface StoreFeedback {
  eastRelief: number;
  transitRelief: number;
  southLoad: number;
  fanBuffer: number;
  accessBoost: number;
  wasteBoost: number;
}

export interface StoreState {
  venueId: VenueId;
  scenarioId: ScenarioId;
  language: string;
  mode: "balanced" | "safety" | "fan" | "sustainability";
  tick: number;
  prompt: string;
  operatorOverride: string;
  corruption: boolean;
  apiDegraded: boolean;
  lowCompliance: boolean;
  semanticCacheEnabled: boolean;
  
  llmLatencyMs: number;
  decision: DecisionEnvelope | null;
  edgeAlerts: EdgeAlert[];
  feedback: StoreFeedback;
  fanVerification: FanVerification;
  auditLog: AuditEntry[];
  
  // Computed values that the UI might need quickly
  currentMetrics: RuntimeMetrics | null;
  currentZones: any;
}

export interface OpsStoreActions {
  setField: <K extends keyof StoreState>(key: K, value: StoreState[K]) => void;
  setFields: (fields: Partial<StoreState>) => void;
  simulateTick: () => void;
  generateDecision: () => void;
  approveDecision: () => void;
}

export type OpsState = StoreState & OpsStoreActions;

const defaultFeedback = (): StoreFeedback => ({
  eastRelief: 0,
  transitRelief: 0,
  southLoad: 0,
  fanBuffer: 0,
  accessBoost: 0,
  wasteBoost: 0
});

const defaultFanVerification = (): FanVerification => ({
  targetPercent: 12,
  observedPercent: 0,
  complianceRate: 0,
  status: "awaiting",
  evidence: "Waiting for gate counting cycle.",
  nextAction: "Observe next tick.",
  lastChecked: new Date().toISOString()
});

export const opsStore = createStore<OpsState>((set, get) => ({
  venueId: "ny-nj",
  scenarioId: "gateSurge",
  language: "en",
  mode: "balanced",
  tick: 0,
  prompt: "",
  operatorOverride: "",
  corruption: false,
  apiDegraded: false,
  lowCompliance: false,
  semanticCacheEnabled: true,

  llmLatencyMs: 0,
  decision: null,
  edgeAlerts: [],
  feedback: defaultFeedback(),
  fanVerification: defaultFanVerification(),
  auditLog: [],
  
  currentMetrics: null,
  currentZones: null,

  setField: (key, value) => set({ [key]: value }),
  setFields: (fields) => set(fields),

  simulateTick: () => {
    const state = get();
    const newTick = state.tick + 1;
    let newFeedback = { ...state.feedback };
    let newVerification = { ...state.fanVerification };

    if (state.decision && state.decision.dispatchLock.status === "unlocked") {
      newFeedback.eastRelief = Math.min(newFeedback.eastRelief + 6, 25);
      newFeedback.southLoad = Math.min(newFeedback.southLoad + 4, 15);
      newFeedback.fanBuffer = Math.min(newFeedback.fanBuffer + 5, 20);
      newFeedback.transitRelief = Math.min(newFeedback.transitRelief + 3, 18);
      newFeedback.accessBoost = Math.min(newFeedback.accessBoost + 8, 20);
      newFeedback.wasteBoost = Math.min(newFeedback.wasteBoost + 5, 15);

      newVerification.observedPercent = Math.min(newVerification.observedPercent + (state.lowCompliance ? 1 : 4), 22);
      newVerification.complianceRate = Math.round((newVerification.observedPercent / newVerification.targetPercent) * 100);
      newVerification.lastChecked = new Date().toISOString();
      newVerification.evidence = `Turnstile delta confirms ${newVerification.observedPercent}% shift since dispatch.`;

      if (newVerification.observedPercent >= newVerification.targetPercent) {
        newVerification.status = "verified";
      } else {
        newVerification.status = "below_target";
      }
    } else {
      newFeedback.eastRelief = Math.max(newFeedback.eastRelief - 2, 0);
      newFeedback.southLoad = Math.max(newFeedback.southLoad - 1, 0);
      newFeedback.fanBuffer = Math.max(newFeedback.fanBuffer - 2, 0);
      newFeedback.transitRelief = Math.max(newFeedback.transitRelief - 1, 0);
      newFeedback.accessBoost = Math.max(newFeedback.accessBoost - 3, 0);
      newFeedback.wasteBoost = Math.max(newFeedback.wasteBoost - 2, 0);
    }

    set({ tick: newTick, feedback: newFeedback, fanVerification: newVerification });
    
    // Update derived values
    const updatedState = get();
    const metrics = getMetrics(updatedState);
    const zones = getZones(updatedState);
    const alerts = computeEdgeAlerts(zones, metrics);
    set({ currentMetrics: metrics, currentZones: zones, edgeAlerts: alerts });
  },

  generateDecision: () => {
    const state = get();
    // Simulate generation
    const start = performance.now();
    
    // Update metrics and zones first based on current tick
    const metrics = getMetrics(state);
    const zones = getZones(state);
    
    const decision = buildDecision(state, "Manual Gen");
    const latency = Math.round(performance.now() - start);
    
    set({
      decision,
      llmLatencyMs: latency,
      currentMetrics: metrics,
      currentZones: zones,
      edgeAlerts: decision.edgeAlerts,
    });
  },

  approveDecision: () => {
    const state = get();
    if (!state.decision || state.decision.dispatchLock.status !== "locked") return;

    const approvedDecision = {
      ...state.decision,
      dispatchLock: {
        ...state.decision.dispatchLock,
        status: "unlocked",
        lastDispatchResult: "accepted",
        operator: "ops-supervisor-demo",
        signedAt: new Date().toISOString()
      }
    };
    
    // Simple audit log entry
    const entry: AuditEntry = {
      decisionId: approvedDecision.id,
      operator: "ops-supervisor-demo",
      timestamp: approvedDecision.dispatchLock.signedAt!,
      venueId: approvedDecision.venueId,
      scenarioId: approvedDecision.scenarioId,
      fanMessage: approvedDecision.fanMessage,
      approvedActions: approvedDecision.actions.map(a => ({ id: a.id, title: a.title, channel: a.channel })),
      previousHash: "root",
      payload: approvedDecision,
      signature: "simulated_signature",
      entryHash: "simulated_hash",
      actionCount: approvedDecision.actions.length,
      dispatchResult: {
        accepted: true,
        reason: "Valid signature",
        acceptedAt: approvedDecision.dispatchLock.signedAt!
      }
    };

    set({
      decision: approvedDecision as DecisionEnvelope,
      auditLog: [entry, ...state.auditLog],
      fanVerification: {
        ...state.fanVerification,
        status: "awaiting",
        observedPercent: 0,
        complianceRate: 0,
        evidence: "Awaiting first post-action compliance read."
      }
    });
  }
}));

// Initialize derived values on load
const initialState = opsStore.getState();
opsStore.setState({
  currentMetrics: getMetrics(initialState),
  currentZones: getZones(initialState),
  edgeAlerts: computeEdgeAlerts(getZones(initialState), getMetrics(initialState))
});
