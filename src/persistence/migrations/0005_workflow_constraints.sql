-- 0005_workflow_constraints.sql
-- Upgrade path for DBs that already recorded 0004_workflow.sql before
-- constraints were added. Idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS runs_assignment_id_attempt_unique
  ON runs (assignment_id, attempt);

CREATE INDEX IF NOT EXISTS runs_assignment_id_status_idx
  ON runs (assignment_id, status);

INSERT INTO schema_migrations (version) VALUES ('0005_workflow_constraints.sql')
  ON CONFLICT (version) DO NOTHING;