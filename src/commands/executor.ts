// CommandExecutor — real typed command execution for WP1-A.
//
// - Authorization (Owner-only, fail-closed)
// - expected_version optimistic concurrency (CAS)
// - state-transition guards
// - Drizzle transaction
// - idempotency (DB-backed via idempotency_records table)
// - receipt recording (DB-backed via command_receipts table)

import { randomUUID } from "node:crypto";
import type { Db } from "../persistence/db.js";
import type { Pool } from "pg";
import type { Command, CommandEnvelope } from "./envelope.js";
import { runInTransaction } from "../persistence/transaction.js";
import {
  ReceiptRecorder,
  createReceiptRecorder,
  type Receipt,
} from "../persistence/receipts.js";
import { IdempotencyStore, createIdempotencyStore } from "../persistence/idempotency.js";
import * as handlers from "./handlers.js";

export type CommandStatus = "OK" | "REJECTED";

export interface CommandResult {
  status: CommandStatus;
  reason?: string;
  [key: string]: unknown;
}

export interface CommandExecutorDeps {
  db: Db;
  pool?: Pool;
  owner?: string;
  receiptRecorder?: ReceiptRecorder;
  idempotencyStore?: IdempotencyStore;
}

function isDb(value: unknown): value is Db {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { transaction?: unknown }).transaction === "function" &&
    typeof (value as { select?: unknown }).select === "function"
  );
}

export class CommandExecutor {
  private readonly db: Db;
  private readonly pool: Pool | null;
  private readonly owner: string;
  private readonly receiptRecorder: ReceiptRecorder;
  private readonly idempotencyStore: IdempotencyStore;

  constructor(dbOrDeps: Db | CommandExecutorDeps, options?: Partial<CommandExecutorDeps>) {
    if (isDb(dbOrDeps)) {
      this.db = dbOrDeps;
      this.pool = options?.pool ?? null;
      this.owner = options?.owner ?? "personal-owner-1";
      this.receiptRecorder = options?.receiptRecorder ?? createReceiptRecorder(this.pool ?? undefined);
      this.idempotencyStore = options?.idempotencyStore ?? createIdempotencyStore(this.pool ?? undefined);
    } else {
      const deps = dbOrDeps as CommandExecutorDeps;
      this.db = deps.db;
      this.pool = deps.pool ?? options?.pool ?? null;
      this.owner = deps.owner ?? options?.owner ?? "personal-owner-1";
      this.receiptRecorder = deps.receiptRecorder ?? options?.receiptRecorder ?? createReceiptRecorder(this.pool ?? undefined);
      this.idempotencyStore = deps.idempotencyStore ?? options?.idempotencyStore ?? createIdempotencyStore(this.pool ?? undefined);
    }
  }

  get receiptRecorderInstance(): ReceiptRecorder {
    return this.receiptRecorder;
  }

  private idempotencyKey(command: Command): string {
    return `${command.envelope.actor}::${command.envelope.idempotencyKey}`;
  }

  private canonicalPayload(command: Command): string {
    const obj = { intent: command.intent, payload: command.payload ?? {} };
    const keys = Object.keys(obj).sort();
    const canon = (v: unknown): string => {
      if (v === null || typeof v !== "object") return JSON.stringify(v);
      if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
      const ks = Object.keys(v as object).sort();
      return "{" + ks.map((k) => JSON.stringify(k) + ":" + canon((v as Record<string, unknown>)[k])).join(",") + "}";
    };
    return canon(obj);
  }

  async execute(command: Command): Promise<CommandResult> {
    const ikey = this.idempotencyKey(command);
    const payloadCanonical = this.canonicalPayload(command);

    try {
      return await runInTransaction(this.db, async (tx) => {
        // Idempotency: check DB-backed store first (inside transaction).
        const storedRec = await this.idempotencyStore.getRecord(ikey, tx);
        if (storedRec) {
          if (storedRec.payload && storedRec.payload !== payloadCanonical) {
            return { status: "REJECTED", reason: "CONFLICT" };
          }
          return { ...(storedRec.result as Record<string, unknown>) } as CommandResult;
        }

        // Authorization: Owner-only, fail-closed.
        if (command.envelope.actor !== this.owner) {
          const result: CommandResult = { status: "REJECTED", reason: "unauthorized" };
          await this.idempotencyStore.set(ikey, command.envelope.actor, result, payloadCanonical, tx);
          return result;
        }

        let result: CommandResult;
        try {
          const ctx = { db: tx, command, executor: this };
          result = await dispatchCommand(ctx, command);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message === "STALE_VERSION") {
            result = { status: "REJECTED", reason: "STALE_VERSION" };
          } else if (message === "unauthorized") {
            result = { status: "REJECTED", reason: "unauthorized" };
          } else {
            result = { status: "REJECTED", reason: message };
          }
        }

        // Receipt: record mutation on success (same transaction).
        if (result.status === "OK") {
          const receipt = await this.receiptRecorder.record(
            {
              commandId: command.envelope.commandId,
              idempotencyKey: command.envelope.idempotencyKey,
              actor: command.envelope.actor,
              intent: command.intent,
              status: "recorded",
              details: {
                personalSpaceId: command.envelope.personalSpaceId,
                projectId: command.envelope.projectId,
                taskId: command.envelope.taskId,
              },
            },
            tx,
          );
          (result as Record<string, unknown>).receiptId = receipt.receiptId;
          (result as Record<string, unknown>).receipt = receipt;
        }

        // Persist idempotency record (same transaction).
        await this.idempotencyStore.set(ikey, command.envelope.actor, result, payloadCanonical, tx);

        return { ...result };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === "IDEMPOTENCY_CONFLICT") {
        const storedRec = await this.idempotencyStore.getRecord(ikey, this.db);
        if (storedRec) {
          if (storedRec.payload && storedRec.payload !== payloadCanonical) {
            return { status: "REJECTED", reason: "CONFLICT" };
          }
          return { ...(storedRec.result as Record<string, unknown>) } as CommandResult;
        }
      }
      if (message === "STALE_VERSION") return { status: "REJECTED", reason: "STALE_VERSION" };
      if (message === "unauthorized") return { status: "REJECTED", reason: "unauthorized" };
      return { status: "REJECTED", reason: message };
    }
  }

  // Expose transactional execution helper for handlers/tests.
  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    return runInTransaction(this.db, fn);
  }

  async executeCommand(command: Command): Promise<CommandResult> {
    return this.execute(command);
  }
  async run(command: Command): Promise<CommandResult> {
    return this.execute(command);
  }
  async dispatch(command: Command): Promise<CommandResult> {
    return this.execute(command);
  }
  async process(command: Command): Promise<CommandResult> {
    return this.execute(command);
  }
}

function dispatchCommand(ctx: { db: Db; command: Command; executor: CommandExecutor }, command: Command): Promise<CommandResult> {
  const ns = handlers as unknown as Record<string, (c: typeof ctx) => Promise<CommandResult>>;
  const fn = ns[command.intent];
  if (!fn) {
    const prefixed = ns[`handle${command.intent}`];
    if (!prefixed) {
      return Promise.resolve({ status: "REJECTED", reason: `UNKNOWN_INTENT: ${command.intent}` });
    }
    return prefixed(ctx);
  }
  return fn(ctx);
}

export { randomUUID };