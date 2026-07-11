import { createStore } from "zustand/vanilla";
import type {
  ActionCommand,
  DecisionEnvelope,
  EdgeAlert,
  TelemetryFrame,
  VenueId,
} from "@/shared/types";

export interface OpsState {
  venueId: VenueId;
  telemetry?: TelemetryFrame;
  alerts: EdgeAlert[];
  decision?: DecisionEnvelope;
  actions: ActionCommand[];
  connection: "offline" | "connecting" | "connected" | "reconnecting";
  setVenue: (venueId: VenueId) => void;
  setTelemetry: (frame: TelemetryFrame, alerts: EdgeAlert[]) => void;
  setDecision: (decision: DecisionEnvelope) => void;
  setConnection: (connection: OpsState["connection"]) => void;
}

export const opsStore = createStore<OpsState>((set) => ({
  venueId: "ny-nj",
  alerts: [],
  actions: [],
  connection: "offline",
  setVenue: (venueId) => set({ venueId }),
  setTelemetry: (telemetry, alerts) => set({ telemetry, alerts }),
  setDecision: (decision) => set({ decision, actions: decision.actions }),
  setConnection: (connection) => set({ connection }),
}));
