import { createSignal, onCleanup } from "solid-js";
import { opsStore } from "@/store/useOpsStore";
import { DigitalTwin } from "@/domains/crowd/DigitalTwin";
import type { ZoneId } from "@/shared/types";

export function App() {
  const [state, setState] = createSignal(opsStore.getState());
  const unsubscribe = opsStore.subscribe(setState);
  onCleanup(unsubscribe);

  const density = () =>
    state().telemetry?.zones ??
    ({
      north: 68,
      south: 42,
      west: 61,
      east: 92,
      transit: 64,
      fan: 38,
      bowl: 44
    } satisfies Record<ZoneId, number>);

  return (
    <main id="main" class="app-shell">
      <a href="#command" class="skip-link">
        Skip to command center
      </a>
      <section id="command" aria-label="World Cup 2026 StadiumOps command center">
        <header>
          <p>Production scaffold</p>
          <h1>World Cup 2026 StadiumOps Copilot</h1>
          <p>Real-time venue intelligence with signed dispatch, RAG grounding, and accessible operations.</p>
        </header>
        <DigitalTwin density={density()} actions={state().actions} />
        <section aria-live="assertive">
          {state().alerts.filter((alert) => alert.priority === "critical").map((alert) => (
            <p>{alert.title}</p>
          ))}
        </section>
      </section>
    </main>
  );
}
