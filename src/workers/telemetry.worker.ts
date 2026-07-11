import { normalizeTelemetry } from "@/domains/telemetry/edgeNormalizer";
import { TelemetryFrameSchema } from "@/shared/schemas";

self.onmessage = (event: MessageEvent) => {
  if (event.data.type !== "telemetry-frame") return;
  const parsed = TelemetryFrameSchema.safeParse(event.data.frame);
  if (!parsed.success) {
    self.postMessage({
      type: "telemetry-rejected",
      errors: parsed.error.flatten(),
    });
    return;
  }
  const normalized = normalizeTelemetry(parsed.data);
  self.postMessage({ type: "telemetry-normalized", ...normalized });
};
