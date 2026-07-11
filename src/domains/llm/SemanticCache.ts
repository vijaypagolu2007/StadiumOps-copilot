import type { CacheFingerprint, DecisionEnvelope } from "@/shared/types";

export class SemanticCache {
  #entries = new Map<
    string,
    { value: DecisionEnvelope; expiresAt: number; touchedAt: number }
  >();

  constructor(
    private readonly maxEntries = 500,
    private readonly ttlMs = 300_000,
  ) {}

  get(fingerprint: CacheFingerprint): DecisionEnvelope | null {
    const key = this.key(fingerprint);
    const entry = this.#entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.#entries.delete(key);
      return null;
    }
    entry.touchedAt = Date.now();
    return entry.value;
  }

  set(fingerprint: CacheFingerprint, value: DecisionEnvelope): void {
    this.#entries.set(this.key(fingerprint), {
      value,
      expiresAt: Date.now() + this.ttlMs,
      touchedAt: Date.now(),
    });
    this.evict();
  }

  size(): number {
    return this.#entries.size;
  }

  private key(fingerprint: CacheFingerprint): string {
    return JSON.stringify({
      schemaVersion: fingerprint.schemaVersion,
      venueId: fingerprint.venueId,
      scenarioId: fingerprint.scenarioId,
      language: fingerprint.language,
      mode: fingerprint.mode,
      telemetryQuality: fingerprint.telemetryQuality,
      densityBands: fingerprint.densityBands,
      metricBands: fingerprint.metricBands,
      verification: fingerprint.verification,
      edgeAlertIds: fingerprint.edgeAlertIds,
    });
  }

  private evict(): void {
    for (const [key, entry] of this.#entries) {
      if (Date.now() > entry.expiresAt) this.#entries.delete(key);
    }
    while (this.#entries.size > this.maxEntries) {
      const oldest = [...this.#entries.entries()].sort(
        (left, right) => left[1].touchedAt - right[1].touchedAt,
      )[0]?.[0];
      if (!oldest) return;
      this.#entries.delete(oldest);
    }
  }
}
