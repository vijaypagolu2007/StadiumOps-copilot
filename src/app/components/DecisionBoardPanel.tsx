import { Component, For, Show } from "solid-js";
import { StoreState } from "@/store/useOpsStore";

export const DecisionBoardPanel: Component<{ state: StoreState }> = (props) => {
  const d = () => props.state.decision;

  const modeCopy = (mode: string) => ({
    balanced: "balanced safety and fan-flow target",
    safety: "safety-first threshold",
    fan: "fan comfort threshold",
    sustainability: "low-carbon operating target"
  }[mode] || "balanced safety and fan-flow target");

  return (
    <article class="panel wide">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Decision Board and GenAI Architecture</h2>
          <p class="panel-subtitle">Actions are ranked by safety impact, fan experience, volunteer effort, and carbon effect.</p>
        </div>
        <span class="status-pill">
          <span class="dot"></span>
          <span id="actionCount">{d()?.actions.length || 0} actions</span>
        </span>
      </div>
      <div class="panel-body ops-grid">
        <section>
          <p class="section-label">Recommended actions</p>
          <div id="actionBoard">
            <Show when={d()} fallback={<div>No actions generated yet.</div>}>
              <For each={d()?.actions}>
                {(action) => (
                  <div class="action-row">
                    <div class="action-body">
                      <span class="action-title">{action.title}</span>
                      <span class="action-copy">
                        {action.dispatch} Optimized for {modeCopy(props.state.mode)}.
                        {action.physicalBackup ? " Physical backup dispatch required." : ""}
                      </span>
                    </div>
                    <span class={`priority ${action.priority}`}>{action.priority}</span>
                  </div>
                )}
              </For>
            </Show>
          </div>
          <p class="section-label" style="margin-top: 14px;">Signed approval audit</p>
          <div class="audit-list" id="auditLog">
            <Show when={props.state.auditLog.length > 0} fallback={<div>No signed decisions yet.</div>}>
              <For each={props.state.auditLog}>
                {(entry) => (
                  <div class="audit-row">
                    <span><strong>{entry.operator}</strong> • {entry.actionCount} actions</span>
                    <span>{entry.decisionId.substring(0, 24)}...</span>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </section>
        
        <section>
          <p class="section-label">How the GenAI loop works</p>
          <ol class="pipeline">
            <li><span class="step">1</span><span><strong>Sense at the edge</strong><span>Gate, camera, queue, transit, accessibility, and waste streams are reduced into threshold alerts before the LLM sees them.</span></span></li>
            <li><span class="step">2</span><span><strong>Ground with RAG</strong><span>Retrieve only relevant venue topology, policy, and route chunks from a pgvector-style knowledge layer instead of inflating the prompt.</span></span></li>
            <li><span class="step">3</span><span><strong>Generate JSON</strong><span>LLM output is treated as tool-call JSON and rejected unless it matches the action schema used by the Act pipeline.</span></span></li>
            <li><span class="step">4</span><span><strong>Red-team guardrail</strong><span>Adversarial checks scan operator overrides and rogue telemetry for prompt injection, unsafe instructions, and accessibility omissions.</span></span></li>
            <li><span class="step">5</span><span><strong>Act with audit</strong><span>Human-approved broadcasts and transit changes are signed and added to an immutable local audit chain.</span></span></li>
          </ol>
          
          <p class="section-label" style="margin-top: 14px;">Runtime controls</p>
          <div class="insight-grid">
            <div class="insight-box">
              <strong>RAG grounding</strong>
              <p id="ragStatus">
                <Show when={d()} fallback={<span>Waiting for retrieval.</span>}>
                  <span>{d()?.grounding.length} topology and policy chunks retrieved for {d()?.venueName}.</span>
                </Show>
              </p>
              <div class="chip-row" id="ragChips">
                <For each={d()?.grounding}>
                  {(g) => <span class="chip">{g.id}</span>}
                </For>
              </div>
            </div>
            
            <div class="insight-box">
              <strong>Schema, cache, and fallback</strong>
              <Show when={d()} fallback={<>
                <p id="schemaStatus">No structured output yet.</p>
                <p id="cacheStatus">Cache idle.</p>
                <p id="fallbackStatus">LLM path healthy.</p>
              </>}>
                <p id="schemaStatus">
                  <span>Schema and sanitizer valid: {d()?.actions.length} typed actions ready for Act.</span>
                </p>
                <p id="cacheStatus">
                  <span>
                    {d()?.runtime.cacheHit 
                      ? `Semantic cache hit (${d()?.runtime.cacheAgeSeconds}s old). LLM call skipped.` 
                      : d()?.runtime.generationMode === "local-rule-state-machine" 
                        ? "Semantic cache bypassed during local fallback." 
                        : props.state.semanticCacheEnabled 
                          ? "Fuzzy semantic cache miss. Fresh generation stored by density bands." 
                          : "Semantic cache disabled."}
                  </span>
                </p>
                <p id="fallbackStatus">
                  <span>
                    {d()?.runtime.generationMode === "local-rule-state-machine"
                      ? "API degraded: deterministic local state machine is active."
                      : "LLM tool-call path healthy; local rulebook standing by."}
                  </span>
                </p>
              </Show>
            </div>
            
            <div class="insight-box">
              <strong>Guardrail</strong>
              <Show when={d()} fallback={<p id="guardrailStatus">No adversarial issues detected.</p>}>
                <p id="guardrailStatus">
                  <span>
                    {d()?.guardrails.blocked
                      ? "Blocked: adversarial validation requires supervisor review."
                      : d()?.guardrails.issues.length 
                        ? "Passed with mitigations." 
                        : "Passed with no adversarial issues."}
                  </span>
                </p>
                <div class="chip-row" id="guardrailChips">
                  <For each={d()?.guardrails.issues.length ? d()?.guardrails.issues : ["clean"]}>
                    {(issue) => <span class={`chip ${d()?.guardrails.blocked ? "danger" : issue === "clean" ? "" : "warn"}`}>{issue}</span>}
                  </For>
                </div>
              </Show>
            </div>
          </div>
          
          <p class="section-label" style="margin-top: 14px;">Fan verification loop</p>
          <div class="insight-box">
            <strong>Compliance check</strong>
            <p id="verificationStatus">
              <Show when={d()} fallback={<span>Waiting for observed fan movement.</span>}>
                <span>{d()?.verification.statusCopy} Evidence: {d()?.verification.evidence}</span>
              </Show>
            </p>
          </div>
          
          <p class="section-label" style="margin-top: 14px;">Latest structured action JSON</p>
          <pre class="json-box" id="jsonOutput">
            {d() ? JSON.stringify(d(), null, 2) : "{}"}
          </pre>
          <p class="footer-note">Prototype note: telemetry and responses are simulated locally. In production, the RAG layer maps to Supabase/pgvector, generation uses native tool calling, and signatures are anchored in an append-only ledger.</p>
        </section>
      </div>
    </article>
  );
};
