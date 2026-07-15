import { Component, For } from "solid-js";
import { DigitalTwin } from "@/domains/crowd/DigitalTwin";
import { ActionCommand, ZoneId } from "@/shared/types";
import { zoneKeys } from "@/shared/data";
import { densityBand, levelFor, levelText, getVenue } from "@/domains/decision";
import { StoreState } from "@/store/useOpsStore";

interface DigitalTwinPanelProps {
  state: StoreState;
}

export const DigitalTwinPanel: Component<DigitalTwinPanelProps> = (props) => {
  const venue = () => getVenue(props.state.venueId);
  const metrics = () => props.state.currentMetrics || { risk: 50 };
  const status = () => levelFor(metrics().risk);
  const statusClass = () => status() === "high" || status() === "critical" ? "high" : status() === "medium" ? "medium" : "";

  const getOverlaysSummary = () => {
    const summaries: string[] = [];
    (props.state.decision?.actions || []).forEach((action) => {
      const text = `${action.title} ${action.dispatch}`.toLowerCase();
      if (text.includes("overflow lanes") || text.includes("e4-e7")) summaries.push("temporary East Gate lanes E4 through E7 highlighted");
      if (text.includes("south gate") || text.includes("redirect")) summaries.push("fan redirect arrow from East Concourse to South Gate");
      if (text.includes("transit") || text.includes("exit wave") || text.includes("platform")) summaries.push("timed transit flow highlighted from bowl to Transit Plaza");
      if (action.physicalBackup || text.includes("mobility cart") || text.includes("accessible")) summaries.push("mobility backup markers on the step-free route");
      if (text.includes("multilingual") || text.includes("led")) summaries.push("multilingual LED alert mapped to north display boards");
    });
    return summaries.length
      ? `Generated action overlays: ${Array.from(new Set(summaries)).join("; ")}.`
      : "No generated action overlays for the current plan.";
  };

  const getMapSummary = () => {
    return zoneKeys.map(([key, label]) => {
      const rawValue = props.state.currentZones?.[key as ZoneId];
      const value = typeof rawValue === "number" ? rawValue : 50;
      const band = densityBand(rawValue);
      const lvl = band === "low" ? "Low" : band === "watch" ? "Watch" : band === "high" ? "High" : band === "critical" ? "Critical" : "using fallback telemetry";
      return `${label} is ${lvl} at ${value} percent`;
    }).join(", ") + ".";
  };

  return (
    <article class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Stadium Digital Twin</h2>
          <p class="panel-subtitle" id="venueMeta">{`${venue().stadium}, ${venue().city}. Capacity model: ${venue().capacity.toLocaleString()} fans.`}</p>
        </div>
        <span class="status-pill">
          <span id="mapStatusDot" class={`dot ${statusClass()}`}></span>
          <span id="mapStatus">{levelText(metrics().risk)}</span>
        </span>
      </div>
      <div class="panel-body">
        <div class="map-wrap">
          <DigitalTwin density={props.state.currentZones || {} as any} actions={props.state.decision?.actions || []} />
          
          <div class="legend" aria-label="Crowd density legend">
            <span><i class="swatch" style="background: var(--low);"></i> Low</span>
            <span><i class="swatch" style="background: var(--medium);"></i> Watch</span>
            <span><i class="swatch" style="background: var(--high);"></i> High</span>
            <span><i class="swatch" style="background: var(--critical);"></i> Critical</span>
          </div>
          <div>
            <p class="section-label">Zone telemetry</p>
            <p class="sr-only" id="mapA11ySummary" aria-live="polite">
              {getMapSummary()}
            </p>
            <p class="sr-only" id="actionOverlaySummary" aria-live="polite">
              {getOverlaysSummary()}
            </p>
            <div class="map-details" id="zoneList">
              <For each={zoneKeys}>
                {([key, label]) => {
                  const rawValue = props.state.currentZones?.[key as ZoneId];
                  const value = typeof rawValue === "number" ? rawValue : 50;
                  const band = densityBand(rawValue);
                  const lvl = band === "low" ? "Low" : band === "watch" ? "Watch" : band === "high" ? "High" : band === "critical" ? "Critical" : "Fallback";
                  const levelClass = band === "fallback" ? "unknown" : band;
                  
                  return (
                    <div class="zone-row">
                      <div class="row-top">
                        <span class="row-name">{label}</span>
                        <span class="row-meta">
                          {typeof rawValue === "number" ? `${value}% ${lvl}` : `fallback ${value}%`}
                        </span>
                      </div>
                      <div class="bar">
                        <span class={levelClass} style={`width: ${value}%`}></span>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
