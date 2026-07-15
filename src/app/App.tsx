import { For, Show, createSignal, onCleanup } from "solid-js";
import { DigitalTwin } from "@/domains/crowd/DigitalTwin";
import { planActions, requestPlan, type GeneratedPlan } from "@/domains/llm/PlanClient";
import { opsStore } from "@/store/useOpsStore";
import type { ScenarioId, TelemetryFrame, VenueId, ZoneId } from "@/shared/types";

const scenarioOptions: Array<{ value: ScenarioId; label: string; zone: ZoneId }> = [
  { value: "gateSurge", label: "Gate surge", zone: "east" },
  { value: "accessReroute", label: "Accessible-route disruption", zone: "west" },
  { value: "stormDelay", label: "Storm delay", zone: "north" },
  { value: "transitCrush", label: "Transit crowding", zone: "transit" },
  { value: "sustainability", label: "Waste-diversion issue", zone: "fan" },
  { value: "volunteerGap", label: "Volunteer coverage gap", zone: "south" },
];

const venues: Array<{ value: VenueId; label: string }> = [
  { value: "ny-nj", label: "New York / New Jersey" },
  { value: "toronto", label: "Toronto" },
  { value: "miami", label: "Miami" },
  { value: "dallas", label: "Dallas" },
  { value: "mexico-city", label: "Mexico City" },
  { value: "vancouver", label: "Vancouver" },
  { value: "los-angeles", label: "Los Angeles" },
];

function zonesFor(scenario: ScenarioId, density: number): Record<ZoneId, number> {
  const focus = scenarioOptions.find((option) => option.value === scenario)?.zone ?? "east";
  const zones: Record<ZoneId, number> = {
    north: 28,
    south: 28,
    west: 28,
    east: 28,
    transit: 28,
    fan: 28,
    bowl: 28,
  };
  zones[focus] = density;
  return zones;
}

export function App() {
  const [state, setState] = createSignal(opsStore.getState());
  const unsubscribe = opsStore.subscribe(setState);
  onCleanup(unsubscribe);
  const [venueId, setVenueId] = createSignal<VenueId>("ny-nj");
  const [scenarioId, setScenarioId] = createSignal<ScenarioId>("gateSurge");
  const [language, setLanguage] = createSignal("en");
  const [density, setDensity] = createSignal(82);
  const [note, setNote] = createSignal("");
  const [plan, setPlan] = createSignal<GeneratedPlan>();
  const [status, setStatus] = createSignal("Ready for a scenario assessment.");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const liveDensity = () => state().telemetry?.zones ?? zonesFor(scenarioId(), density());

  async function generate() {
    setLoading(true);
    setError("");
    const frame: TelemetryFrame = {
      venueId: venueId(),
      timestamp: new Date().toISOString(),
      sequence: Date.now(),
      zones: zonesFor(scenarioId(), density()),
      waitMinutes: Math.round(density() / 6),
      accessibleRouteCoverage: scenarioId() === "accessReroute" ? 62 : 92,
      wasteDiversion: scenarioId() === "sustainability" ? 48 : 76,
      source: "simulation",
      quality: "clean",
    };
    try {
      const nextPlan = await requestPlan({
        venueId: venueId(),
        scenarioId: scenarioId(),
        language: language(),
        operatorOverride: note(),
        frame,
      });
      const actions = planActions(nextPlan);
      opsStore.setVenue(venueId());
      opsStore.setTelemetry(frame, actions.map((action) => ({
        id: action.id,
        priority: action.priority,
        title: action.title,
        summary: action.dispatch,
        zoneId: action.mapOverlay?.zoneId,
      })));
      setPlan(nextPlan);
      setStatus(nextPlan.source === "openai" ? "AI plan generated; supervisor approval remains required." : "Safety fallback generated; configure OPENAI_API_KEY to enable AI planning.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate a plan.");
      setStatus("No plan was dispatched.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" class="app-shell">
      <a href="#command" class="skip-link">Skip to command center</a>
      <section id="command" aria-label="World Cup 2026 StadiumOps command center">
        <header class="hero">
          <p class="eyebrow">Stadium operations copilot</p>
          <h1>World Cup 2026 StadiumOps Copilot</h1>
          <p>Generate grounded, supervisor-approved operating plans from the current venue scenario.</p>
        </header>

        <section class="dashboard" aria-label="Scenario planning workspace">
          <form class="control-panel" onSubmit={(event) => { event.preventDefault(); void generate(); }}>
            <h2>Scenario inputs</h2>
            <label>
              Venue
              <select value={venueId()} onInput={(event) => setVenueId(event.currentTarget.value as VenueId)}>
                <For each={venues}>{(venue) => <option value={venue.value}>{venue.label}</option>}</For>
              </select>
            </label>
            <label>
              Scenario
              <select value={scenarioId()} onInput={(event) => setScenarioId(event.currentTarget.value as ScenarioId)}>
                <For each={scenarioOptions}>{(scenario) => <option value={scenario.value}>{scenario.label}</option>}</For>
              </select>
            </label>
            <label>
              Fan language
              <select value={language()} onInput={(event) => setLanguage(event.currentTarget.value)}>
                <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
              </select>
            </label>
            <label>
              Peak density: {density()}%
              <input aria-label="Peak density" type="range" min="0" max="100" value={density()} onInput={(event) => setDensity(Number(event.currentTarget.value))} />
            </label>
            <label>
              Operator note <span class="muted">(optional)</span>
              <textarea value={note()} maxLength="600" rows="4" placeholder="Add verified context for the plan." onInput={(event) => setNote(event.currentTarget.value)} />
            </label>
            <button type="submit" disabled={loading()}>{loading() ? "Generating plan…" : "Generate safe plan"}</button>
          </form>

          <section class="map-panel" aria-label="Live crowd map">
            <div class="panel-heading"><h2>Venue digital twin</h2><span class="status">{status()}</span></div>
            <DigitalTwin density={liveDensity()} actions={plan() ? planActions(plan()!) : []} />
            <p class="muted">Simulation inputs are local until a plan is generated. Generated actions always require supervisor approval.</p>
          </section>
        </section>

        <section class="plan-panel" aria-live="polite" aria-label="Generated operating plan">
          <Show when={error()}><p class="error" role="alert">{error()}</p></Show>
          <Show when={plan()} fallback={<p>No plan yet. Choose a scenario and generate an assessment.</p>}>
            {(generated) => <>
              <div class="panel-heading"><h2>Recommended plan</h2><span class="badge">{generated().source === "openai" ? "AI generated" : "Safety fallback"}</span></div>
              <p>{generated().summary}</p>
              <p><strong>Fan message:</strong> {generated().fanMessage}</p>
              <ol class="actions">
                <For each={generated().actions}>{(action) => <li><strong>{action.title}</strong><span>{action.dispatch}</span><small>{action.priority} · {action.channel} · approval required</small></li>}</For>
              </ol>
            </>}
          </Show>
        </section>
      </section>
    </main>
  );
}
