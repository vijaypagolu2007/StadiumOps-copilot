import type { DecisionEnvelope } from "@/shared/types";

export interface AuditSignature {
  keyId: string;
  signature: string;
  signedAt: string;
  previousHash: string;
  entryHash: string;
}

export interface AuditEntry extends AuditSignature {
  decisionId: string;
  operatorId: string;
}

export class AuditChain {
  #entries: AuditEntry[] = [];
  #keyPair?: CryptoKeyPair;
  #keyCreatedAt = 0;

  constructor(private readonly keyTtlMs = 86_400_000) {}

  async signDecision(
    decision: DecisionEnvelope,
    operatorId: string,
  ): Promise<AuditSignature> {
    const keyPair = await this.activeKeyPair();
    const previousHash = this.#entries.at(-1)?.entryHash ?? "genesis";
    const signedAt = new Date().toISOString();
    const payload = JSON.stringify({
      decisionId: decision.id,
      operatorId,
      approvedActions: decision.actions
        .filter((action) => action.requiresApproval)
        .map((action) => action.id),
      previousHash,
      signedAt,
    });
    const signatureBytes = await crypto.subtle.sign(
      { name: "Ed25519" },
      keyPair.privateKey,
      new TextEncoder().encode(payload),
    );
    const signature = this.hex(signatureBytes);
    const entryHash = await this.sha256(`${payload}.${signature}`);
    const keyId = await this.keyId(keyPair.publicKey);
    const entry = {
      decisionId: decision.id,
      operatorId,
      keyId,
      signature,
      signedAt,
      previousHash,
      entryHash,
    };
    this.#entries.push(entry);
    return entry;
  }

  async verify(
    decision: DecisionEnvelope,
    signature: AuditSignature,
    operatorId: string,
  ): Promise<boolean> {
    if (!this.#keyPair) return false;
    const payload = JSON.stringify({
      decisionId: decision.id,
      operatorId,
      approvedActions: decision.actions
        .filter((action) => action.requiresApproval)
        .map((action) => action.id),
      previousHash: signature.previousHash,
      signedAt: signature.signedAt,
    });
    return crypto.subtle.verify(
      { name: "Ed25519" },
      this.#keyPair.publicKey,
      Uint8Array.from(
        signature.signature
          .match(/.{1,2}/g)
          ?.map((byte) => Number.parseInt(byte, 16)) ?? [],
      ),
      new TextEncoder().encode(payload),
    );
  }

  entries(): readonly AuditEntry[] {
    return this.#entries;
  }

  private async activeKeyPair(): Promise<CryptoKeyPair> {
    if (!crypto.subtle)
      throw new Error(
        "WebCrypto is required; fail closed without crypto.subtle.",
      );
    if (!this.#keyPair || Date.now() - this.#keyCreatedAt > this.keyTtlMs) {
      this.#keyPair = (await crypto.subtle.generateKey(
        { name: "Ed25519" },
        true,
        ["sign", "verify"],
      )) as CryptoKeyPair;
      this.#keyCreatedAt = Date.now();
    }
    return this.#keyPair;
  }

  private async keyId(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", publicKey);
    return `ed25519-${(await this.sha256(this.hex(exported))).slice(0, 16)}`;
  }

  private async sha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );
    return this.hex(digest);
  }

  private hex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
}
