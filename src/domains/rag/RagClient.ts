import type { RetrievalChunk, ScenarioId, VenueId } from "@/shared/types";

export interface RagQuery {
  venueId: VenueId;
  scenarioId: ScenarioId;
  tags: string[];
  limit?: number;
}

export class RagClient {
  #pending = new Map<string, Promise<RetrievalChunk[]>>();

  constructor(private readonly worker: Worker) {}

  query(input: RagQuery): Promise<RetrievalChunk[]> {
    const key = JSON.stringify({ ...input, tags: [...input.tags].sort() });
    const existing = this.#pending.get(key);
    if (existing) return existing;

    const request = new Promise<RetrievalChunk[]>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("RAG worker timeout")), 750);
      const listener = (event: MessageEvent) => {
        if (event.data.key !== key) return;
        window.clearTimeout(timeout);
        this.worker.removeEventListener("message", listener);
        this.#pending.delete(key);
        resolve(event.data.chunks);
      };
      this.worker.addEventListener("message", listener);
      this.worker.postMessage({ key, type: "rag-query", input });
    });

    this.#pending.set(key, request);
    window.setTimeout(() => this.#pending.delete(key), 100);
    return request;
  }
}
