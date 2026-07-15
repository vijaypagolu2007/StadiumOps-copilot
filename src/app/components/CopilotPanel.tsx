import { Component, For, Show } from "solid-js";
import type { ScenarioId, DecisionEnvelope } from "@/shared/types";

interface CopilotPanelProps {
  decision: DecisionEnvelope | null;
  mode: string;
  onModeChange: (mode: string) => void;
  scenarioId: string;
  onScenarioChange: (scenario: ScenarioId) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  operatorOverride: string;
  onOperatorOverrideChange: (override: string) => void;
  toggles: {
    corruption: boolean;
    cache: boolean;
    apiDegraded: boolean;
    lowCompliance: boolean;
  };
  onToggleChange: (key: keyof CopilotPanelProps["toggles"], value: boolean) => void;
  onGenerate: (e: Event) => void;
  onSimulate: () => void;
  onCopy: () => void;
  onApprove: () => void;
  onRegression: () => void;
}

export const CopilotPanel: Component<CopilotPanelProps> = (props) => {
  const modes = [
    { id: "balanced", label: "Balanced" },
    { id: "safety", label: "Safety first" },
    { id: "fan", label: "Fan comfort" },
    { id: "sustainability", label: "Low carbon" }
  ];

  const scenarios = [
    { id: "gateSurge", label: "Gate surge" },
    { id: "accessReroute", label: "Accessibility reroute" },
    { id: "stormDelay", label: "Storm delay" },
    { id: "transitCrush", label: "Transit crush" },
    { id: "sustainability", label: "Waste spike" },
    { id: "volunteerGap", label: "Volunteer gap" }
  ];

  return (
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">GenAI Operations Copilot</h2>
          <p class="panel-subtitle">Generate staff plans, fan messages, and dispatch actions from live signals.</p>
        </div>
        <span class="status-pill"><span class="dot"></span>LLM ready</span>
      </div>
      <div class="panel-body">
        <p class="section-label">Select incident scenario</p>
        <div class="scenario-grid" id="scenarioGrid">
          <For each={scenarios}>
            {(scenario) => (
              <button
                type="button"
                class={`scenario-btn ${props.scenarioId === scenario.id ? "active" : ""}`}
                onClick={() => props.onScenarioChange(scenario.id as ScenarioId)}
              >
                {scenario.label}
              </button>
            )}
          </For>
        </div>

        <div class="mode-row" aria-label="Operating mode">
          <For each={modes}>
            {(mode) => (
              <button 
                class={`mode-btn ${props.mode === mode.id ? "active" : ""}`} 
                data-mode={mode.id} 
                type="button"
                onClick={() => props.onModeChange(mode.id)}
              >
                {mode.label}
              </button>
            )}
          </For>
        </div>

        <form class="assistant-form" id="assistantForm" onSubmit={props.onGenerate}>
          <label for="assistantPrompt">Ask the copilot</label>
          <textarea 
            id="assistantPrompt" 
            placeholder="Example: Write an accessible route update for wheelchair users near East Concourse and explain staff actions."
            value={props.prompt}
            onInput={(e) => props.onPromptChange(e.currentTarget.value)}
          ></textarea>
          
          <label for="operatorOverride">Operator override / rogue feed test</label>
          <textarea 
            id="operatorOverride" 
            placeholder="Optional: paste a supervisor note or simulated telemetry feed. Prompt-injection attempts are red-teamed before generation."
            value={props.operatorOverride}
            onInput={(e) => props.onOperatorOverrideChange(e.currentTarget.value)}
          ></textarea>
          
          <div class="toggle-grid" aria-label="Simulation toggles">
            <label class="check-card" for="corruptionToggle">
              <input 
                id="corruptionToggle" 
                type="checkbox" 
                checked={props.toggles.corruption}
                onChange={(e) => props.onToggleChange("corruption", e.currentTarget.checked)}
              />
              <span><strong>Telemetry corruption</strong><br/>Simulate missing Wi-Fi density and malformed lift telemetry.</span>
            </label>
            <label class="check-card" for="cacheToggle">
              <input 
                id="cacheToggle" 
                type="checkbox" 
                checked={props.toggles.cache}
                onChange={(e) => props.onToggleChange("cache", e.currentTarget.checked)}
              />
              <span><strong>Semantic cache</strong><br/>Reuse matching incident responses inside a short operating window.</span>
            </label>
            <label class="check-card" for="apiToggle">
              <input 
                id="apiToggle" 
                type="checkbox"
                checked={props.toggles.apiDegraded}
                onChange={(e) => props.onToggleChange("apiDegraded", e.currentTarget.checked)}
              />
              <span><strong>API degraded</strong><br/>Bypass LLM generation and execute a local critical-incident state machine.</span>
            </label>
            <label class="check-card" for="lowComplianceToggle">
              <input 
                id="lowComplianceToggle" 
                type="checkbox"
                checked={props.toggles.lowCompliance}
                onChange={(e) => props.onToggleChange("lowCompliance", e.currentTarget.checked)}
              />
              <span><strong>Low compliance drill</strong><br/>Simulate fans ignoring redirection so the model adapts on the next cycle.</span>
            </label>
          </div>
          
          <div class="assistant-actions">
            <button class="primary-btn" type="submit">Generate plan</button>
            <button class="ghost-btn" id="simulateBtn" type="button" onClick={props.onSimulate}>Simulate next 10 min</button>
            <button class="ghost-btn" id="copyBtn" type="button" onClick={props.onCopy}>Copy fan message</button>
            <button class="ghost-btn" id="approveBtn" type="button" onClick={props.onApprove}>Approve & sign</button>
            <button class="ghost-btn" id="regressionBtn" type="button" onClick={props.onRegression}>Run regression suite</button>
          </div>
        </form>

        <Show when={props.decision}>
          {(decision) => (
            <section class="response" id="copilotResponse" aria-live="polite">
              <p class="section-label">Generated fan message</p>
              <div class="message-card">
                <p>{decision().fanMessage}</p>
              </div>
              <Show when={decision().multilingualMessages && decision().multilingualMessages.length > 0}>
                <p class="section-label" style="margin-top:14px;">Multilingual variants sent to app/LED</p>
                <For each={decision().multilingualMessages!.filter(m => m.language !== decision().language)}>
                  {(msg) => (
                    <div class="message-card language-variant">
                      <p><strong>{msg.label}</strong>: {msg.appText}</p>
                    </div>
                  )}
                </For>
              </Show>
            </section>
          )}
        </Show>
      </div>
    </article>
  );
};
