import { Component, createEffect, createSignal, For, onCleanup } from "solid-js";
import type { ActionCommand, ZoneId } from "@/shared/types";
import { densityBand } from "./density";

export const DigitalTwin: Component<{
  density: Record<ZoneId, number | null>;
  actions: ActionCommand[];
  reducedMotion?: boolean;
}> = (props) => {
  let frame = 0;
  const [animatedDensity, setAnimatedDensity] = createSignal(props.density);

  createEffect(() => {
    cancelAnimationFrame(frame);
    if (props.reducedMotion) {
      setAnimatedDensity(props.density);
      return;
    }
    frame = requestAnimationFrame(() => setAnimatedDensity(props.density));
  });

  onCleanup(() => cancelAnimationFrame(frame));

  const val = (id: ZoneId) => {
    const v = animatedDensity()[id];
    return typeof v === "number" ? v : null;
  };

  const textVal = (id: ZoneId, format: "short" | "long" = "long") => {
    const v = val(id);
    if (v === null) return `fallback`;
    return format === "short" ? `${v}%` : `${v}% density`;
  };

  const levelClass = (id: ZoneId) => {
    const band = densityBand(val(id));
    return band === "fallback" ? "unknown" : band === "watch" ? "medium" : band;
  };

  const getOverlays = () => {
    const parts: any[] = [];
    props.actions.forEach((action) => {
      const text = `${action.title} ${action.dispatch}`.toLowerCase();
      if (text.includes("overflow lanes") || text.includes("e4-e7")) {
        parts.push(
          <g>
            <rect class="overlay-zone" x="576" y="176" width="20" height="120" rx="8"></rect>
            <text class="overlay-label" x="584" y="168" text-anchor="middle">E4-E7</text>
          </g>
        );
      }
      if (text.includes("south gate") || text.includes("redirect")) {
        parts.push(
          <g>
            <path class="overlay-line" d="M548 300 C510 390, 430 438, 340 448"></path>
            <circle class="overlay-marker" cx="548" cy="300" r="9"></circle>
            <text class="overlay-label" x="452" y="410">Redirect to South Gate</text>
          </g>
        );
      }
      if (text.includes("transit") || text.includes("exit wave") || text.includes("platform")) {
        parts.push(
          <g>
            <rect class="overlay-zone" x="40" y="34" width="104" height="76" rx="12"></rect>
            <path class="overlay-line" d="M184 352 C150 316, 118 240, 92 110"></path>
            <text class="overlay-label" x="138" y="158">Timed transit flow</text>
          </g>
        );
      }
      if (action.physicalBackup || text.includes("mobility cart") || text.includes("accessible")) {
        parts.push(
          <g>
            <circle class="overlay-marker" cx="168" cy="206" r="9"></circle>
            <circle class="overlay-marker" cx="238" cy="228" r="9"></circle>
            <text class="overlay-label" x="214" y="190">Mobility backup</text>
          </g>
        );
      }
      if (text.includes("multilingual") || text.includes("led")) {
        parts.push(
          <text class="overlay-label" x="320" y="126" text-anchor="middle">LED multilingual alert</text>
        );
      }
    });
    return parts;
  };

  return (
    <svg class="stadium-map" id="stadiumMap" viewBox="0 0 640 520" role="img" aria-labelledby="mapTitle mapDesc">
      <title id="mapTitle">Stadium crowd heatmap</title>
      <desc id="mapDesc">Density zones are updated with text labels for Low, Watch, High, and Critical crowd levels.</desc>
      <defs>
        <marker id="arrowHead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
          <path d="M0,0 L10,4 L0,8 Z" fill="#2578a6"></path>
        </marker>
      </defs>
      <rect x="26" y="26" width="588" height="468" rx="28" fill="#eef7ef" stroke="#d5e4d6" stroke-width="2"></rect>
      
      <rect class={`map-zone ${levelClass("north")}`} x="166" y="34" width="308" height="76" rx="12" role="img"></rect>
      <rect class={`map-zone ${levelClass("south")}`} x="166" y="410" width="308" height="76" rx="12" role="img"></rect>
      <rect class={`map-zone ${levelClass("west")}`} x="42" y="132" width="108" height="256" rx="14" role="img"></rect>
      <rect class={`map-zone ${levelClass("east")}`} x="490" y="132" width="108" height="256" rx="14" role="img"></rect>
      <rect class={`map-zone ${levelClass("transit")}`} x="40" y="34" width="104" height="76" rx="12" role="img"></rect>
      <rect class={`map-zone ${levelClass("fan")}`} x="496" y="34" width="104" height="76" rx="12" role="img"></rect>
      <ellipse class={`map-zone ${levelClass("bowl")}`} cx="320" cy="260" rx="194" ry="138" role="img"></ellipse>
      
      <rect x="226" y="196" width="188" height="128" rx="10" fill="#dff4e6" stroke="#9fd6af" stroke-width="2"></rect>
      <line x1="320" y1="196" x2="320" y2="324" stroke="#9fd6af" stroke-width="2"></line>
      <circle cx="320" cy="260" r="25" fill="none" stroke="#9fd6af" stroke-width="2"></circle>
      <path class="route" d="M88 72 C120 134, 142 182, 192 205 C242 228, 262 265, 318 298 C370 330, 438 330, 546 354"></path>
      
      <text class="map-label" x="320" y="80" text-anchor="middle">North Gate</text>
      <text class="map-small" x="320" y="100" text-anchor="middle">{textVal("north")}</text>
      
      <text class="map-label" x="320" y="454" text-anchor="middle">South Gate</text>
      <text class="map-small" x="320" y="474" text-anchor="middle">{textVal("south")}</text>
      
      <text class="map-label" x="96" y="252" text-anchor="middle">West</text>
      <text class="map-small" x="96" y="272" text-anchor="middle">{textVal("west", "short")}</text>
      
      <text class="map-label" x="544" y="252" text-anchor="middle">East</text>
      <text class="map-small" x="544" y="272" text-anchor="middle">{textVal("east", "short")}</text>
      
      <text class="map-label" x="92" y="75" text-anchor="middle">Transit</text>
      <text class="map-small" x="92" y="95" text-anchor="middle">{textVal("transit", "short")}</text>
      
      <text class="map-label" x="548" y="75" text-anchor="middle">Fan Zone</text>
      <text class="map-small" x="548" y="95" text-anchor="middle">{textVal("fan", "short")}</text>
      
      <text class="map-label" x="320" y="365" text-anchor="middle">Lower Bowl</text>
      <text class="map-small" x="320" y="385" text-anchor="middle">{textVal("bowl", "short")}</text>
      
      <text class="map-small" x="338" y="300">Step-free route</text>
      
      <g aria-label="Generated action map overlays">
        <For each={getOverlays()}>{(overlay) => overlay}</For>
      </g>
    </svg>
  );
};
