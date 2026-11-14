-- WP1-C durable agent session registry (P0 item 5).
-- Persists Project OS agent sessions to PostgreSQL, preserving provider session IDs.

CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY,
  provider_session_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  cwd TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  project_id TEXT,
  task_id TEXT,
  assignment_id TEXT,
  capabilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_task_id ON agent_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);