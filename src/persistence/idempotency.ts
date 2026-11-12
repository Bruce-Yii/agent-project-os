// DB-backed idempotency store for WP1-A.
// Persists idempotency records to the idempotency_records table (migration 0002).

import type { Pool } from "pg";

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

  async get(key: string): Promise<unknown | null> {
    if (!this.pool) return null;
    const { rows } = await this.pool.query(
      "SELECT result_json FROM idempotency_records WHERE idempotency_key = $1",
      [key],
    );
    if (rows.length === 0) return null;
    return rows[0].result_json;
  }

  async set(key: string, actor: string, result: unknown): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(
      `INSERT INTO idempotency_records (idempotency_key, actor, result_json, recorded_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [key, actor, JSON.stringify(result)],
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