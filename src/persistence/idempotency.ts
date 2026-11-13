// DB-backed idempotency store for WP1-A.
// Persists idempotency records to the idempotency_records table (migration 0002).

import type { Pool } from "pg";
import type { Db } from "./db.js";
import { sql } from "drizzle-orm";

export interface IdempotencyRecord {
  key: string;
  actor: string;
  result: unknown;
  recordedAt: string;
}

export class IdempotencyStore {
  private pool: Pool | null;

  constructor(pool?: Pool) {
    this.pool = pool ?? null;
  }

  setPool(pool: Pool): void {
    this.pool = pool;
  }

  // Returns the stored result plus the canonical payload (if any) that was
  // recorded alongside it. `result` has the internal payload marker stripped.
  async getRecord(key: string, tx?: Db): Promise<{ result: unknown; payload: string | null; actor: string } | null> {
    let rows: any[] = [];
    if (tx) {
      const res: any = await tx.execute(sql`SELECT result_json, actor FROM idempotency_records WHERE idempotency_key = ${key}`);
      rows = Array.isArray(res) ? res : (res?.rows ?? []);
    } else if (this.pool) {
      const r = await this.pool.query("SELECT result_json, actor FROM idempotency_records WHERE idempotency_key = $1", [key]);
      rows = r.rows;
    } else {
      return null;
    }
    if (!rows || rows.length === 0) return null;
    const raw = rows[0].result_json;
    let payload: string | null = null;
    let result: unknown = raw;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const { __idempotencyPayload, ...rest } = raw as Record<string, unknown>;
      if (__idempotencyPayload !== undefined) {
        payload = String(__idempotencyPayload);
        result = rest;
      }
    }
    return { result, payload, actor: rows[0].actor };
  }

  async get(key: string, tx?: Db): Promise<unknown | null> {
    const rec = await this.getRecord(key, tx);
    return rec ? rec.result : null;
  }

  // `payload` is an optional canonical string used for same-key/different-payload
  // conflict detection. `tx` makes the write part of a Drizzle transaction.
  async set(
    key: string,
    actor: string,
    result: unknown,
    payloadOrTx?: string | Db,
    tx?: Db,
  ): Promise<void> {
    let payload: string | undefined;
    let transaction = tx;
    if (typeof payloadOrTx === "string") {
      payload = payloadOrTx;
    } else if (payloadOrTx && typeof (payloadOrTx as any).execute === "function") {
      transaction = payloadOrTx as Db;
    }

    const toStore =
      payload !== undefined
        ? { ...(result as Record<string, unknown>), __idempotencyPayload: payload }
        : result;

    if (transaction) {
      const res: any = await transaction.execute(
        sql`INSERT INTO idempotency_records (idempotency_key, actor, result_json, recorded_at)
            VALUES (${key}, ${actor}, ${JSON.stringify(toStore)}::jsonb, NOW())
            ON CONFLICT (idempotency_key) DO NOTHING
            RETURNING idempotency_key`,
      );
      const rows = Array.isArray(res) ? res : (res?.rows ?? []);
      // If no row was returned, a concurrent transaction inserted the same key.
      if (rows.length === 0) {
        throw new Error("IDEMPOTENCY_CONFLICT");
      }
      return;
    }

    if (!this.pool) return;
    await this.pool.query(
      `INSERT INTO idempotency_records (idempotency_key, actor, result_json, recorded_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [key, actor, JSON.stringify(toStore)],
    );
  }

  async has(key: string): Promise<boolean> {
    if (!this.pool) return false;
    const { rows } = await this.pool.query(
      "SELECT 1 FROM idempotency_records WHERE idempotency_key = $1",
      [key],
    );
    return rows.length > 0;
  }
}

export function createIdempotencyStore(pool?: Pool): IdempotencyStore {
  return new IdempotencyStore(pool);
}