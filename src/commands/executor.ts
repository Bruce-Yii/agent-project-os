// CommandExecutor — real typed command execution for WP1-A.
//
// - Authorization (Owner-only, fail-closed)
// - expected_version optimistic concurrency
// - state-transition guards
// - Drizzle transaction
// - idempotency
// - receipt recording

import { randomUUID } from "node:crypto";
import type { Db } from "../persistence/db.js";
import type { Command, CommandEnvelope } from "./envelope.js";
import { runInTransaction } from "../persistence/transaction.js";
import {
  ReceiptRecorder,
  createReceiptRecorder,
  type Receipt,
} from "../persistence/receipts.js";
import * as handlers from "./handlers.js";

export type CommandStatus = "OK" | "REJECTED";

export interface CommandResult {
  status: CommandStatus;
  reason?: string;
  [key: string]: unknown;
}

export interface CommandExecutorDeps {
  db: Db;
  owner?: string;
  idempotencyStore?: Map<string, CommandResult>;
  receiptRecorder?: ReceiptRecorder;
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
  private readonly owner: string;
  private readonly idempotencyStore: Map<string, CommandResult>;
  private readonly receiptRecorder: ReceiptRecorder;

  constructor(dbOrDeps: Db | CommandExecutorDeps, options?: Partial<CommandExecutorDeps>) {
    if (isDb(dbOrDeps)) {
      this.db = dbOrDeps;
      this.owner = options?.owner ?? "personal-owner-1";
      this.idempotencyStore = options?.idempotencyStore ?? new Map();
      this.receiptRecorder = options?.receiptRecorder ?? createReceiptRecorder();
    } else {
      const deps = dbOrDeps as CommandExecutorDeps;
      this.db = deps.db;
      this.owner = deps.owner ?? options?.owner ?? "personal-owner-1";
      this.idempotencyStore = deps.idempotencyStore ?? options?.idempotencyStore ?? new Map();
      this.receiptRecorder = deps.receiptRecorder ?? options?.receiptRecorder ?? createReceiptRecorder();
    }
  }

  get receiptRecorderInstance(): ReceiptRecorder {
    return this.receiptRecorder;
  }

  private idempotencyKey(command: Command): string {
    return `${command.envelope.actor}\u0000${command.envelope.idempotencyKey}`;
  }

  async execute(command: Command): Promise<CommandResult> {
    const ikey = this.idempotencyKey(command);

    // Idempotency: return stored result without re-executing.
    const stored = this.idempotencyStore.get(ikey);
    if (stored) {
      return { ...stored };
    }

    // Authorization: Owner-only, fail-closed.
    if (command.envelope.actor !== this.owner) {
      const result: CommandResult = { status: "REJECTED", reason: "unauthorized" };
      this.idempotencyStore.set(ikey, result);
      return result;
    }

    let result: CommandResult;
    try {
      result = await runInTransaction(this.db, async (tx) => {
        const ctx = {
          db: tx,
          command,
          executor: this,
        };
        return dispatchCommand(ctx, command);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Normalize known rejection reasons thrown by handlers.
      if (message === "STALE_VERSION") {
        result = { status: "REJECTED", reason: "STALE_VERSION" };
      } else if (message === "unauthorized") {
        result = { status: "REJECTED", reason: "unauthorized" };
      } else {
        result = { status: "REJECTED", reason: message };
      }
    }

    // Receipt: record mutation on success.
    if (result.status === "OK") {
      const receipt = this.receiptRecorder.record({
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
      });
      (result as Record<string, unknown>).receiptId = receipt.receiptId;
      (result as Record<string, unknown>).receipt = receipt;
    }

    this.idempotencyStore.set(ikey, result);
    return { ...result };
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

// Dispatch table. Kept here (not in handlers.ts) to avoid circular import at module load?
// handlers.ts imports CommandResult type only, so safe.
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