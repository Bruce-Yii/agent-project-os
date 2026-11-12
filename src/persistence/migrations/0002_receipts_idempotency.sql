-- WP1-A receipts and idempotency tables.
-- Mutation audit trail and durable idempotency store.

CREATE TABLE IF NOT EXISTS command_receipts (
  receipt_id TEXT PRIMARY KEY,
  command_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recorded',
  details JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_idempotency_key ON command_receipts(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_receipts_command_id ON command_receipts(command_id);

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_key TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  result_json JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_actor ON idempotency_records(actor);