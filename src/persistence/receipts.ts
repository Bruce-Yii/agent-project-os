// Receipt recording (mutation audit) for WP1-A.
// In-memory implementation for now; TODO: persist to a receipts table (DB).

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
  private readonly receipts: Receipt[] = [];

  record(input: ReceiptInput): Receipt {
    const receipt: Receipt = {
      receiptId: crypto.randomUUID(),
      commandId: input.commandId,
      idempotencyKey: input.idempotencyKey,
      actor: input.actor,
      intent: input.intent,
      status: input.status ?? "recorded",
      recordedAt: new Date().toISOString(),
      details: input.details,
    };
    this.receipts.push(receipt);
    return receipt;
  }

  list(): Receipt[] {
    return [...this.receipts];
  }

  clear(): void {
    this.receipts.length = 0;
  }
}

export function createReceiptRecorder(): ReceiptRecorder {
  return new ReceiptRecorder();
}

// Module-level default recorder for convenience (TODO: replace with DB-backed).
const defaultRecorder = new ReceiptRecorder();

export function recordReceipt(input: ReceiptInput): Receipt {
  return defaultRecorder.record(input);
}

export function listReceipts(): Receipt[] {
  return defaultRecorder.list();
}

export class Receipts extends ReceiptRecorder {}

export function getDefaultReceiptRecorder(): ReceiptRecorder {
  return defaultRecorder;
}