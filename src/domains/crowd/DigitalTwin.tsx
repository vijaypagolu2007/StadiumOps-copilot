import { For, createEffect, createSignal, onCleanup } from "solid-js";
import type { ActionCommand, DensityBand, ZoneId } from "@/shared/types";
import { densityBand } from "./density";

type ZoneShape = {
  id: ZoneId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const zones: ZoneShape[] = [
  { id: "north", label: "North Gate", x: 166, y: 34, w: 308, h: 76 },
  { id: "south", label: "South Gate", x: 166, y: 410, w: 308, h: 76 },
  { id: "west", label: "West Concourse", x: 42, y: 132, w: 108, h: 256 },
  { id: "east", label: "East Concourse", x: 490, y: 132, w: 108, h: 256 },
  { id: "transit", label: "Transit Plaza", x: 40, y: 34, w: 104, h: 76 },
  { id: "fan", label: "Fan Zone", x: 496, y: 34, w: 104, h: 76 },
  { id: "bowl", label: "Lower Bowl", x: 212, y: 142, w: 216, h: 236 },
];

const fillByBand: Record<DensityBand, string> = {
  low: "#bfead1",
  watch: "#ffe1a8",
  high: "#ffb5a6",
  critical: "#ef7f7f",
  fallback: "#dfe7e1",
};

export function DigitalTwin(props: {
  density: Record<ZoneId, number | null>;
  actions: ActionCommand[];
  reducedMotion?: boolean;
}) {
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

  const overlaySummary = () =>
    props.actions
      .map((action) => action.mapOverlay?.label)
      .filter(Boolean)
      .join("; ") || "No generated action overlays.";

  return (
    <figure aria-label="Stadium digital twin command map">
      <svg
        viewBox="0 0 640 520"
        role="img"
        aria-roledescription="crowd density heatmap"
      >
        <title>Stadium crowd heatmap with generated action overlays</title>
        <desc>{overlaySummary()}</desc>
        <rect
          x="26"
          y="26"
          width="588"
          height="468"
          rx="28"
          fill="#eef7ef"
          stroke="#d5e4d6"
        />
        <For each={zones}>
          {(zone) => {
            const value = () => animatedDensity()[zone.id];
            const band = () => densityBand(value());
            return (
              <g
                aria-label={`${zone.label}: ${value() ?? "fallback"} percent, ${band()}`}
              >
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  rx="12"
                  fill={fillByBand[band()]}
                  stroke="#ffffff"
                  stroke-width="2"
                />
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2}
                  text-anchor="middle"
                  font-weight="800"
                >
                  {zone.label}
                </text>
              </g>
            );
          }}
        </For>
        <For each={props.actions.filter((action) => action.mapOverlay)}>
          {(action) => (
            <g aria-label={`Action overlay: ${action.mapOverlay?.label}`}>
              <circle
                cx="544"
                cy="260"
                r="9"
                fill="#2578a6"
                stroke="#ffffff"
                stroke-width="3"
              />
              <path
                d="M544 300 C510 390 430 438 340 448"
                fill="none"
                stroke="#2578a6"
                stroke-width="5"
              />
              <text x="420" y="410" font-size="12" font-weight="900">
                {action.mapOverlay?.label}
              </text>
            </g>
          )}
        </For>
      </svg>
      <figcaption class="sr-only">{overlaySummary()}</figcaption>
    </figure>
  );
}

export class StadiumDigitalTwinElement extends HTMLElement {
  connectedCallback() {
    this.setAttribute("role", "region");
    this.setAttribute("aria-label", "Stadium digital twin web component host");
  }
}

if (!customElements.get("stadium-digital-twin")) {
  customElements.define("stadium-digital-twin", StadiumDigitalTwinElement);
}
