-- Durable intent/outbox for Paseo-backed agent session creation.
-- The intent is committed before the external create side effect. Reconciliation
-- retries with the same Paseo idempotency key after an interrupted process/DB write.
CREATE TABLE IF NOT EXISTS agent_session_creation_intents (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  cwd TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  project_id TEXT,
  task_id TEXT,
  assignment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','committed','compensated','reconciliation_required')),
  provider_session_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_session_creation_intents_status_idx
  ON agent_session_creation_intents (status, created_at);

INSERT INTO schema_migrations (version) VALUES ('0006_agent_session_creation_intents.sql')
  ON CONFLICT (version) DO NOTHING;
