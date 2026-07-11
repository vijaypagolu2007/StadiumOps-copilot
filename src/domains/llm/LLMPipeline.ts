import { v4 as uuid } from "uuid";
import type {
  ActionCommand,
  DecisionEnvelope,
  EdgeAlert,
  RetrievalChunk,
  ScenarioId,
  TelemetryFrame
} from "@/shared/types";
import { DecisionEnvelopeSchema } from "@/shared/schemas";
import { buildDensityBands, densityBand } from "@/domains/crowd/density";
import { checkAccessibleRoutes } from "@/domains/accessibility/SpatialRouter";
import { buildMultilingualMessages } from "@/domains/i18n/Translator";
import { AdversarialScanner } from "@/domains/guardrails/AdversarialScanner";
import type { AuditChain } from "@/domains/dispatch/AuditChain";

export interface LLMToolCall {
  name: "queryTransit" | "lookupWeather" | "createFacilitiesTicket" | "lookupVolunteerRoster";
  arguments: Record<string, unknown>;
}

export interface ModelProvider {
  generate(input: {
    model: string;
    system: string;
    messages: Array<{ role: "user" | "assistant" | "tool"; content: string }>;
    tools: LLMToolCall[];
    schemaName: string;
    signal: AbortSignal;
  }): Promise<unknown>;
}

export interface LLMPipelineInput {
  frame: TelemetryFrame;
  scenarioId: ScenarioId;
  language: string;
  edgeAlerts: EdgeAlert[];
  grounding: RetrievalChunk[];
  operatorOverride: string;
  observedLlmLatencyMs?: number;
}

export class LLMPipeline {
  constructor(
    private readonly provider: ModelProvider,
    private readonly auditChain: AuditChain,
    private readonly scanner = new AdversarialScanner()
  ) {}

  async generateDecision(input: LLMPipelineInput): Promise<DecisionEnvelope> {
    const traceId = uuid();
    const guardrails = this.scanner.scan(input.operatorOverride, {
      operatorSessionId: "venue-ops-session",
      overrideCountLastMinute: 1
    });
    const useLocalRulebook = (input.observedLlmLatencyMs ?? 0) > 3000 || !guardrails.allowed;

    const base = this.localRulebook(input, traceId, useLocalRulebook ? "local-rule-state-machine" : "llm-tool-call");
    if (useLocalRulebook) return base;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("llm-sla-timeout"), 3000);
    try {
      const raw = await this.provider.generate({
        model: this.modelFor(input.edgeAlerts),
        system: this.systemPrompt(input.grounding),
        messages: [{ role: "user", content: JSON.stringify(input) }],
        tools: this.toolDefinitions(),
        schemaName: "DecisionEnvelope",
        signal: controller.signal
      });
      const parsed = DecisionEnvelopeSchema.safeParse(raw);
      if (!parsed.success) return base;
      return parsed.data;
    } catch {
      return base;
    } finally {
      clearTimeout(timeout);
    }
  }

  async approve(decision: DecisionEnvelope, operatorId: string): Promise<DecisionEnvelope> {
    const signature = await this.auditChain.signDecision(decision, operatorId);
    return {
      ...decision,
      dispatchLock: {
        status: "unlocked",
        requiresSignature: true,
        keyId: signature.keyId,
        signature: signature.signature,
        signedAt: signature.signedAt
      }
    };
  }

  private localRulebook(
    input: LLMPipelineInput,
    traceId: string,
    generationMode: DecisionEnvelope["runtime"]["generationMode"]
  ): DecisionEnvelope {
    const spatialChecks = checkAccessibleRoutes(input.frame);
    const multilingualMessages = buildMultilingualMessages(input.scenarioId);
    const actions: ActionCommand[] = [
      {
        id: `${input.scenarioId}-local-playbook`,
        priority: input.edgeAlerts.some((alert) => alert.priority === "critical") ? "critical" : "high",
        title: "Execute deterministic local incident playbook",
        dispatch: "Use edge alerts, venue route graph, radio scripts, and supervisor approval without waiting for model output.",
        channel: "radio",
        requiresApproval: true,
        physicalBackup: !spatialChecks.accessibleAssistanceSafe,
        mapOverlay: {
          kind: "route",
          label: "Local fallback route overlay",
          from: "east",
          to: "south"
        }
      }
    ];

    return {
      id: `decision-${uuid()}`,
      venueId: input.frame.venueId,
      scenarioId: input.scenarioId,
      language: input.language,
      fanMessage: multilingualMessages[0]?.appText ?? "Follow staff directions.",
      multilingualMessages,
      verification: {
        targetPercent: 12,
        observedPercent: 0,
        complianceRate: 0,
        status: "awaiting",
        evidence: "Awaiting fan movement verification.",
        nextAction: "Measure app opens, LED QR scans, and gate deltas in 10 minutes.",
        lastChecked: new Date().toISOString()
      },
      spatialChecks,
      edgeAlerts: input.edgeAlerts,
      grounding: input.grounding,
      guardrails: {
        allowed: true,
        score: 0,
        issues: [],
        canaryLeaked: false,
        rateLimited: false
      },
      actions,
      dispatchLock: {
        status: "locked",
        requiresSignature: true
      },
      runtime: {
        schemaVersion: "stadiumops.action.v1",
        generationMode,
        fallbackState: generationMode === "local-rule-state-machine" ? "local-rulebook" : "not-needed",
        fingerprint: {
          schemaVersion: "stadiumops.cache-key.v2",
          venueId: input.frame.venueId,
          scenarioId: input.scenarioId,
          language: input.language,
          mode: "balanced",
          telemetryQuality: input.frame.quality === "clean" ? "clean" : "fallback",
          densityBands: buildDensityBands(input.frame.zones),
          metricBands: {
            risk: densityBand(Math.max(...Object.values(input.frame.zones).map((value) => value ?? 0))),
            wait: densityBand(Math.min(100, input.frame.waitMinutes * 5)),
            access: densityBand(input.frame.accessibleRouteCoverage),
            waste: densityBand(input.frame.wasteDiversion)
          },
          verification: {
            status: "awaiting",
            complianceBand: "low"
          },
          edgeAlertIds: input.edgeAlerts.map((alert) => alert.id).sort()
        },
        traceId,
        generatedAt: new Date().toISOString()
      }
    };
  }

  private systemPrompt(chunks: RetrievalChunk[]): string {
    return [
      "You are StadiumOps Copilot. Return only JSON matching DecisionEnvelope.",
      `Canary: ${this.scanner.promptCanary()}`,
      ...chunks.map((chunk) => `[${chunk.id}] ${chunk.text}`)
    ].join("\n");
  }

  private modelFor(alerts: EdgeAlert[]): string {
    return alerts.some((alert) => alert.priority === "critical") ? "gpt-4o" : "gpt-4o-mini";
  }

  private toolDefinitions(): LLMToolCall[] {
    return [
      { name: "queryTransit", arguments: { venueId: "string" } },
      { name: "lookupWeather", arguments: { venueId: "string" } },
      { name: "createFacilitiesTicket", arguments: { title: "string", priority: "string" } },
      { name: "lookupVolunteerRoster", arguments: { language: "string", zoneId: "string" } }
    ];
  }
}
