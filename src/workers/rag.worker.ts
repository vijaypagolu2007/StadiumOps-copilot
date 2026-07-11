import { topologyKnowledge } from "@/domains/rag/knowledge";

self.onmessage = (event: MessageEvent) => {
  if (event.data.type !== "rag-query") return;
  const { key, input } = event.data;
  const tags = new Set<string>([input.scenarioId, ...input.tags]);
  const chunks = topologyKnowledge
    .map((chunk) => ({
      ...chunk,
      score: chunk.tags.reduce((score, tag) => score + (tags.has(tag) ? 2 : 0), 0)
    }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, input.limit ?? 4);
  self.postMessage({ key, chunks });
};
