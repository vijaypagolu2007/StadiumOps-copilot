import { Component } from "solid-js";

export interface KPIBarProps {
  riskScore: number;
  riskNote: string;
  waitScore: number;
  waitNote: string;
  accessScore: number;
  accessNote: string;
  wasteScore: number;
  wasteNote: string;
}

export const KPIBar: Component<KPIBarProps> = (props) => {
  return (
    <section class="metrics" aria-label="Live operating metrics">
      <article class="metric">
        <div class="label">Crowd Risk</div>
        <div class="value">
          <span>{props.riskScore}</span><span class="unit">/100</span>
        </div>
        <div class="note">{props.riskNote}</div>
      </article>
      <article class="metric">
        <div class="label">Fan Wait</div>
        <div class="value">
          <span>{props.waitScore}</span><span class="unit">min</span>
        </div>
        <div class="note">{props.waitNote}</div>
      </article>
      <article class="metric">
        <div class="label">Accessible Routes</div>
        <div class="value">
          <span>{props.accessScore}</span><span class="unit">%</span>
        </div>
        <div class="note">{props.accessNote}</div>
      </article>
      <article class="metric">
        <div class="label">Waste Diversion</div>
        <div class="value">
          <span>{props.wasteScore}</span><span class="unit">%</span>
        </div>
        <div class="note">{props.wasteNote}</div>
      </article>
    </section>
  );
};
