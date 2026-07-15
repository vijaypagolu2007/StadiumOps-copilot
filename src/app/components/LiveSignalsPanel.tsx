import { Component, For } from "solid-js";
import { averageKnown, zonePercent, getScenario, getVenue, clamp, levelFor } from "@/domains/decision";
import { StoreState } from "@/store/useOpsStore";

export const LiveSignalsPanel: Component<{ state: StoreState }> = (props) => {
  const metrics = () => props.state.currentMetrics || { wait: 11, access: 96, waste: 71, risk: 62 };
  const zoneValues = () => props.state.currentZones || {} as Record<string, number>;
  const venue = () => getVenue(props.state.venueId);
  const scenario = () => getScenario(props.state.scenarioId);
  
  const feed = [
    `Turnstile E2 read gap detected.`,
    `Transit platform B reporting +12% load vs forecast.`,
    `VIP lot egress blocked by disabled vehicle.`,
    `Concession stock alert: vegan options low at Section 112.`,
    `Elevator E4 maintenance ticket opened.`,
    `Weather cell detected 14 miles west.`,
    `Water pressure drop reported in South Concourse restrooms.`,
    `Lost child reported near Fan Zone activation.`,
    `Audio system diagnostic running in Lower Bowl.`
  ];

  return (
    <article class="panel signals-panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Live Signals</h2>
          <p class="panel-subtitle">Sensor, transit, accessibility, and sustainability feed.</p>
        </div>
        <span class="status-pill">
          <span id="signalDot" class={`dot ${metrics().risk > 75 ? 'high' : metrics().risk > 55 ? 'medium' : ''}`}></span>
          <span id="signalLabel">{metrics().risk > 75 ? 'High' : metrics().risk > 55 ? 'Watch' : 'Low'}</span>
        </span>
      </div>
      <div class="panel-body signals">
        <div>
          <p class="section-label">Operating load</p>
          <div id="signalList">
            <For each={[
              ["Ingress pressure", averageKnown([zoneValues().north, zoneValues().east, zoneValues().south], 65), "Gate cameras and turnstiles"],
              ["Transit load", zonePercent(zoneValues().transit, scenario().zones.transit), venue().transit],
              ["Concourse flow", averageKnown([zoneValues().east, zoneValues().west], 62), props.state.corruption ? "Wi-Fi offline; camera fallback active" : "Wi-Fi density and queue sensors"],
              ["Accessible assistance", clamp(100 - (100 - metrics().access) * 2, 20, 100), "Lift uptime, cart requests, staffed corridors"],
              ["Fan redirect compliance", props.state.decision?.verification.status === "awaiting" ? 0 : props.state.decision?.verification.complianceRate || 0, props.state.decision?.verification.evidence || "Monitoring flows"]
            ]}>
              {([name, value, copy]) => {
                const level = levelFor(value);
                return (
                  <div class="signal-row">
                    <div class="row-top">
                      <span class="row-name">{name as string}</span>
                      <span class="row-meta">{value as number}%</span>
                    </div>
                    <div class="bar"><span class={level} style={`width: ${value}%`}></span></div>
                    <div class="action-copy">{copy as string}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
        
        <div>
          <p class="section-label">Edge threshold alerts</p>
          <div id="edgeAlertList">
            <For each={props.state.edgeAlerts}>
              {(alert) => (
                <div class="action-row">
                  <div class="action-body">
                    <span class="action-title">{alert.title}</span>
                    <span class="action-copy">{alert.summary}</span>
                  </div>
                  <span class={`priority ${alert.priority}`}>{alert.priority}</span>
                </div>
              )}
            </For>
          </div>
        </div>

        <div>
          <p class="section-label">Sustainability pulse</p>
          <div class="mini-grid" id="sustainabilityGrid">
            <div class="mini-stat">
              <strong>{metrics().waste}%</strong>
              <span>waste diverted from landfill</span>
            </div>
            <div class="mini-stat">
              <strong>{Math.min(40, Math.max(26, 26 + props.state.tick * 2))}k</strong>
              <span>single-use bottles avoided</span>
            </div>
            <div class="mini-stat">
              <strong>{Math.min(18, Math.max(12, 18 - Math.floor(props.state.tick / 2)))}%</strong>
              <span>temporary power headroom</span>
            </div>
            <div class="mini-stat">
              <strong>{Math.min(13, Math.max(7, 7 + Math.floor(props.state.tick / 2)))} min</strong>
              <span>avg refill station wait</span>
            </div>
          </div>
        </div>

        <div>
          <p class="section-label">Anomaly feed</p>
          <div id="feedList">
            <For each={Array.from({ length: 4 })}>
              {(_, i) => {
                const idx = (props.state.tick + i() * 3) % feed.length;
                return (
                  <div class="feed-row">
                    <span class="time-chip">T-{Math.abs(1 - i() * 2)}m</span>
                    <span class="feed-copy">{feed[idx]}</span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </article>
  );
};
