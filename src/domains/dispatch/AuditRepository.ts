import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AuditEntry } from "./AuditChain";

interface AuditDb extends DBSchema {
  entries: {
    key: string;
    value: AuditEntry;
    indexes: {
      "by-decision": string;
      "by-signed-at": string;
    };
  };
}

export class AuditRepository {
  #db?: IDBPDatabase<AuditDb>;

  async append(entry: AuditEntry): Promise<void> {
    const db = await this.db();
    await db.put("entries", entry);
  }

  async recent(limit = 100): Promise<AuditEntry[]> {
    const db = await this.db();
    const tx = db.transaction("entries", "readonly");
    const index = tx.store.index("by-signed-at");
    const entries: AuditEntry[] = [];
    let cursor = await index.openCursor(null, "prev");
    while (cursor && entries.length < limit) {
      entries.push(cursor.value);
      cursor = await cursor.continue();
    }
    return entries;
  }

  private async db(): Promise<IDBPDatabase<AuditDb>> {
    if (this.#db) return this.#db;
    this.#db = await openDB<AuditDb>("stadiumops-audit", 1, {
      upgrade(db) {
        const store = db.createObjectStore("entries", { keyPath: "entryHash" });
        store.createIndex("by-decision", "decisionId");
        store.createIndex("by-signed-at", "signedAt");
      },
    });
    return this.#db;
  }
}
