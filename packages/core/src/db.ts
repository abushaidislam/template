import { createRequire } from "node:module";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import type { ReceiptV1 } from "@qodewk/protocol";

function getDatabaseSyncClass(): any {
  try {
    const mod = "node:" + "sqlite";
    if (typeof require !== "undefined") {
      return require(mod).DatabaseSync;
    }
  } catch {}
  try {
    const mod = "node:" + "sqlite";
    const req = createRequire(import.meta.url);
    return req(mod).DatabaseSync;
  } catch {
    return null;
  }
}

const DatabaseSync = getDatabaseSyncClass();

export class LocalStateDB {
  private db: any;

  constructor(inMemory: boolean = false) {
    if (!DatabaseSync) {
      this.db = null;
      return;
    }

    if (inMemory || process.env.CI === "true" || process.env.QODEWK_NO_DB === "true") {
      this.db = new DatabaseSync(":memory:");
    } else {
      const qodewkDir = path.join(os.homedir(), ".qodewk");
      if (!fs.existsSync(qodewkDir)) {
        fs.mkdirSync(qodewkDir, { recursive: true });
      }
      const dbPath = path.join(qodewkDir, "state.db");
      this.db = new DatabaseSync(dbPath);
    }

    this.migrate();
  }

  private migrate() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id TEXT PRIMARY KEY,
        repo_hash TEXT UNIQUE NOT NULL,
        root_path TEXT NOT NULL,
        alias TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_observed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        repo_id TEXT NOT NULL,
        branch TEXT NOT NULL,
        head_sha TEXT NOT NULL,
        base_sha TEXT,
        files_count INTEGER NOT NULL,
        insertions INTEGER NOT NULL,
        deletions INTEGER NOT NULL,
        captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        public_id TEXT UNIQUE,
        repo_id TEXT NOT NULL,
        head_sha TEXT NOT NULL,
        base_sha TEXT,
        payload_json TEXT NOT NULL,
        claim_token TEXT,
        sync_status TEXT DEFAULT 'local',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agent_footprints (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        repo_path TEXT NOT NULL,
        session_id TEXT NOT NULL,
        task_title TEXT,
        model TEXT NOT NULL,
        steps_count INTEGER DEFAULT 0,
        files_edited TEXT,
        timestamp DATETIME NOT NULL,
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        tokens_cached INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        mode TEXT DEFAULT 'verified',
        confidence REAL DEFAULT 0.9,
        raw_transcript_path TEXT,
        captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public saveFootprint(fp: any) {
    if (!this.db) return;
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO agent_footprints (
          id, platform, repo_path, session_id, task_title, model, steps_count,
          files_edited, timestamp, tokens_input, tokens_output, tokens_cached,
          cost, mode, confidence, raw_transcript_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        fp.id,
        fp.platform,
        fp.repoPath,
        fp.sessionId,
        fp.taskTitle || null,
        fp.model,
        fp.stepsCount || 0,
        JSON.stringify(fp.filesEdited || []),
        fp.timestamp,
        fp.tokens.input,
        fp.tokens.output,
        fp.tokens.cached,
        fp.cost,
        fp.mode,
        fp.confidence,
        fp.rawTranscriptPath || null
      );
    } catch {}
  }

  public getFootprints(repoPath: string, sinceDate?: Date): any[] {
    if (!this.db) return [];
    try {
      const normTarget = repoPath.toLowerCase().replace(/\\/g, "/");
      let query = "SELECT * FROM agent_footprints WHERE LOWER(REPLACE(repo_path, '\\', '/')) LIKE ? ";
      const params: any[] = [`%${normTarget}%`];

      if (sinceDate) {
        query += "AND timestamp >= ? ";
        params.push(sinceDate.toISOString());
      }

      query += "ORDER BY timestamp DESC";
      return this.db.prepare(query).all(...params);
    } catch {
      return [];
    }
  }

  public saveReceipt(receipt: ReceiptV1, claimToken?: string) {
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO receipts (id, public_id, repo_id, head_sha, base_sha, payload_json, claim_token, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      receipt.receipt.id,
      receipt.receipt.id,
      receipt.repository.repoHash,
      receipt.repository.headSha,
      receipt.repository.baseSha || null,
      JSON.stringify(receipt),
      claimToken || null,
      claimToken ? "synced" : "local"
    );
  }

  public getReceipt(id: string): ReceiptV1 | null {
    if (!this.db) return null;
    const row = this.db.prepare("SELECT payload_json FROM receipts WHERE id = ? OR public_id = ?").get(id, id) as { payload_json: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.payload_json) as ReceiptV1;
  }

  public getRecentReceipts(limit: number = 10): Array<{
    receipt: ReceiptV1;
    claimToken?: string;
    syncStatus: string;
    createdAt: string;
  }> {
    if (!this.db) return [];
    try {
      const rows = this.db
        .prepare("SELECT payload_json, claim_token, sync_status, created_at FROM receipts ORDER BY created_at DESC LIMIT ?")
        .all(limit) as Array<{
          payload_json: string;
          claim_token: string | null;
          sync_status: string;
          created_at: string;
        }>;
      return rows.map((r) => ({
        receipt: JSON.parse(r.payload_json) as ReceiptV1,
        claimToken: r.claim_token || undefined,
        syncStatus: r.sync_status || "local",
        createdAt: r.created_at
      }));
    } catch {
      return [];
    }
  }

  public getStats(): { totalReceipts: number; totalFootprints: number } {
    if (!this.db) return { totalReceipts: 0, totalFootprints: 0 };
    try {
      const rRow = this.db.prepare("SELECT COUNT(*) as cnt FROM receipts").get() as { cnt: number };
      const fRow = this.db.prepare("SELECT COUNT(*) as cnt FROM agent_footprints").get() as { cnt: number };
      return {
        totalReceipts: rRow?.cnt || 0,
        totalFootprints: fRow?.cnt || 0
      };
    } catch {
      return { totalReceipts: 0, totalFootprints: 0 };
    }
  }

  public close() {
    if (this.db) {
      this.db.close();
    }
  }
}
