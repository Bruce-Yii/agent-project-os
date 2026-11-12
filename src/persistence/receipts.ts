// Receipt recording (mutation audit) for WP1-A.
// DB-backed implementation using raw SQL via pg Pool.
// Receipts are persisted in the command_receipts table (migration 0002).

import { randomUUID } from "node:crypto";
import type { Pool } from "pg";

export interface Receipt {
  readonly receiptId: string;
  readonly commandId?: string;
  readonly idempotencyKey?: string;
  readonly actor?: string;
  readonly intent?: string;
  readonly status: "recorded" | "acknowledged" | "failed" | "unknown";
  readonly recordedAt: string;
  readonly details?: Record<string, unknown>;
}

export interface ReceiptInput {
  commandId?: string;
  idempotencyKey?: string;
  actor?: string;
  intent?: string;
  status?: Receipt["status"];
  details?: Record<string, unknown>;
}

export class ReceiptRecorder {
  private pool: Pool | null;

  constructor(pool?: Pool) {
    this.pool = pool ?? null;
  }

  setPool(pool: Pool): void {
    this.pool = pool;
  }

  async record(input: ReceiptInput): Promise<Receipt> {
    const receipt: Receipt = {
      receiptId: randomUUID(),
      commandId: input.commandId,
      idempotencyKey: input.idempotencyKey,
      actor: input.actor,
      intent: input.intent,
      status: input.status ?? "recorded",
      recordedAt: new Date().toISOString(),
      details: input.details,
    };

    if (this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO command_receipts (receipt_id, command_id, idempotency_key, actor, intent, status, details, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            receipt.receiptId,
            receipt.commandId ?? null,
            receipt.idempotencyKey ?? null,
            receipt.actor ?? null,
            receipt.intent ?? null,
            receipt.status,
            receipt.details ? JSON.stringify(receipt.details) : null,
            receipt.recordedAt,
          ],
        );
      } catch (err) {
        // Log but don't fail the command; receipt is best-effort audit
        console.error("Receipt recording failed:", err);
      }
    }

    return receipt;
  }

  async list(): Promise<Receipt[]> {
    if (!this.pool) return [];
    const { rows } = await this.pool.query(
      "SELECT receipt_id, command_id, idempotency_key, actor, intent, status, details, recorded_at FROM command_receipts ORDER BY recorded_at DESC",
    );
    return rows.map((r: Record<string, unknown>) => ({
      receiptId: r.receipt_id as string,
      commandId: r.command_id as string | undefined,
      idempotencyKey: r.idempotency_key as string | undefined,
      actor: r.actor as string | undefined,
      intent: r.intent as string | undefined,
      status: r.status as Receipt["status"],
      recordedAt: r.recorded_at as string,
      details: r.details as Record<string, unknown> | undefined,
    }));
  }

  async clear(): Promise<void> {
    if (this.pool) {
      await this.pool.query("DELETE FROM command_receipts");
    }
  }
}

export function createReceiptRecorder(pool?: Pool): ReceiptRecorder {
  return new ReceiptRecorder(pool);
}

// Module-level default recorder (no pool until set)
const defaultRecorder = new ReceiptRecorder();

export function recordReceipt(input: ReceiptInput): Receipt {
  // Synchronous wrapper; async version preferred
  return defaultRecorder.record(input) as unknown as Receipt;
}

export async function recordReceiptAsync(input: ReceiptInput, pool: Pool): Promise<Receipt> {
  const recorder = new ReceiptRecorder(pool);
  return recorder.record(input);
}

export function listReceipts(): Receipt[] {
  return defaultRecorder.list() as unknown as Receipt[];
}

export async function listReceiptsAsync(pool: Pool): Promise<Receipt[]> {
  const recorder = new ReceiptRecorder(pool);
  return recorder.list();
}

export class Receipts extends ReceiptRecorder {}

export function getDefaultReceiptRecorder(): ReceiptRecorder {
  return defaultRecorder;
}