import { createSignal, onCleanup, onMount } from "solid-js";
import { opsStore } from "@/store/useOpsStore";
import type { VenueId } from "@/shared/types";

import { Header } from "./components/Header";
import { KPIBar } from "./components/KPIBar";
import { DigitalTwinPanel } from "./components/DigitalTwinPanel";
import { CopilotPanel } from "./components/CopilotPanel";
import { LiveSignalsPanel } from "./components/LiveSignalsPanel";
import { DecisionBoardPanel } from "./components/DecisionBoardPanel";

export function App() {
  const [state, setState] = createSignal(opsStore.getState());
  const unsubscribe = opsStore.subscribe(setState);
  
  onMount(() => {
    const interval = setInterval(() => {
      opsStore.getState().simulateTick();
    }, 1000);
    onCleanup(() => {
      clearInterval(interval);
      unsubscribe();
    });
  });

  return (
    <main class="app">
      <Header 
        venueId={state().venueId} 
        onVenueChange={(id) => opsStore.getState().setField("venueId", id as VenueId)}
        language={state().language}
        onLanguageChange={(lang) => opsStore.getState().setField("language", lang)}
      />

      <KPIBar 
        riskScore={state().currentMetrics?.risk ?? 62}
        riskNote={(state().currentMetrics?.risk ?? 62) > 75 ? "Escalate priority" : "Balanced ingress, monitor Gate B."}
        waitScore={state().currentMetrics?.wait ?? 11}
        waitNote={(state().currentMetrics?.wait ?? 11) > 14 ? "Queue threshold exceeded." : "Security and concessions blended average."}
        accessScore={state().currentMetrics?.access ?? 96}
        accessNote={(state().currentMetrics?.access ?? 96) < 90 ? "Physical backup required." : "Step-free path coverage."}
        wasteScore={state().currentMetrics?.waste ?? 71}
        wasteNote={(state().currentMetrics?.waste ?? 71) < 68 ? "Diversion below target." : "Recycling and compost stream quality."}
      />

      <section class="dashboard">
        <DigitalTwinPanel state={state()} />
        
        <CopilotPanel 
          decision={state().decision}
          mode={state().mode}
          onModeChange={(m) => opsStore.getState().setField("mode", m as any)}
          scenarioId={state().scenarioId}
          onScenarioChange={(s) => opsStore.getState().setField("scenarioId", s)}
          prompt={state().prompt}
          onPromptChange={(p) => opsStore.getState().setField("prompt", p)}
          operatorOverride={state().operatorOverride}
          onOperatorOverrideChange={(o) => opsStore.getState().setField("operatorOverride", o)}
          toggles={{
            corruption: state().corruption,
            cache: state().semanticCacheEnabled,
            apiDegraded: state().apiDegraded,
            lowCompliance: state().lowCompliance
          }}
          onToggleChange={(key, val) => {
            if (key === "cache") opsStore.getState().setField("semanticCacheEnabled", val);
            else opsStore.getState().setField(key as any, val);
          }}
          onGenerate={(e) => {
            e.preventDefault();
            opsStore.getState().generateDecision();
          }}
          onSimulate={() => {
            // Re-run generation with current state
            opsStore.getState().generateDecision();
          }}
          onCopy={() => {
            if (state().decision) {
              navigator.clipboard.writeText(JSON.stringify(state().decision, null, 2));
            }
          }}
          onApprove={() => opsStore.getState().approveDecision()}
          onRegression={() => {
            console.log("Regression test would run here");
          }}
        />

        <LiveSignalsPanel state={state()} />

        <DecisionBoardPanel state={state()} />
      </section>
    </main>
  );
}
