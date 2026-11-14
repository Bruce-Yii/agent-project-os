-- WP1-A initial schema (all 6 tables).
-- Generated for migration runner (src/persistence/migrate.ts).

CREATE TABLE IF NOT EXISTS personal_spaces (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES personal_spaces(id),
  name TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  current_state TEXT,
  current_state_freshness TEXT,
  current_state_source TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  non_scope TEXT NOT NULL DEFAULT '',
  acceptance_criteria TEXT NOT NULL DEFAULT '',
  parent_id TEXT,
  status TEXT NOT NULL DEFAULT 'backlog',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dependency_edges (
  id TEXT PRIMARY KEY,
  source_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_current_states (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  freshness TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'owner',
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_projects_space_id ON projects(space_id);
CREATE INDEX IF NOT EXISTS idx_goals_project_id ON goals(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_dependency_edges_source ON dependency_edges(source_task_id);
CREATE INDEX IF NOT EXISTS idx_dependency_edges_target ON dependency_edges(target_task_id);