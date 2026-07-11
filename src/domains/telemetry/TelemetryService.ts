import { decode, encode } from "msgpackr";
import { TelemetryFrameSchema } from "@/shared/schemas";
import type { TelemetryFrame } from "@/shared/types";

export class TelemetryService {
  #socket?: WebSocket;
  #reconnectAttempt = 0;

  constructor(
    private readonly endpoint: string,
    private readonly onFrame: (frame: TelemetryFrame) => void,
    private readonly onStatus: (status: "connected" | "reconnecting" | "closed") => void
  ) {}

  connect(): void {
    this.#socket = new WebSocket(this.endpoint);
    this.#socket.binaryType = "arraybuffer";
    this.#socket.onopen = () => {
      this.#reconnectAttempt = 0;
      this.onStatus("connected");
    };
    this.#socket.onmessage = (event) => {
      const payload = event.data instanceof ArrayBuffer ? decode(new Uint8Array(event.data)) : JSON.parse(String(event.data));
      const parsed = TelemetryFrameSchema.safeParse(payload);
      if (parsed.success) this.onFrame(parsed.data);
    };
    this.#socket.onclose = () => this.scheduleReconnect();
    this.#socket.onerror = () => this.scheduleReconnect();
  }

  requestReplay(fromSequence: number): void {
    this.#socket?.send(encode({ type: "replay", fromSequence }));
  }

  close(): void {
    this.#socket?.close(1000, "client shutdown");
    this.onStatus("closed");
  }

  private scheduleReconnect(): void {
    this.onStatus("reconnecting");
    const delay = Math.min(30_000, 500 * 2 ** this.#reconnectAttempt) + Math.floor(Math.random() * 250);
    this.#reconnectAttempt += 1;
    window.setTimeout(() => this.connect(), delay);
  }
}
