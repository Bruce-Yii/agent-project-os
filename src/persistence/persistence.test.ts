import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, closeDb } from "./db.js";
import { PersonalSpaceRepository, ProjectRepository, TaskRepository } from "./repositories.js";

const DB_URL = process.env.DATABASE_URL || "postgresql://postgres:123456@127.0.0.1:5432/wp1a_test";

// SQL to create tables (matches schema.ts)
const CREATE_TABLES = `
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
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
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
`;

const DROP_TABLES = `
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS personal_spaces CASCADE;
`;

describe("WP1-A persistence (PostgreSQL)", () => {
  let pool: any;
  let db: any;

  before(async () => {
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: DB_URL });
    await pool.query(DROP_TABLES);
    await pool.query(CREATE_TABLES);
    const result = createDb(DB_URL);
    db = result.db;
  });

  after(async () => {
    // pool may already be closed by restart test; ignore errors
    try { await closeDb(pool); } catch { /* already closed */ }
  });

  it("save and read PersonalSpace", async () => {
    const repo = new PersonalSpaceRepository(db);
    await repo.save({ id: "ps-1", owner: "owner-1", version: 1 });
    const found = await repo.findById("ps-1");
    assert.ok(found);
    assert.equal(found!.owner, "owner-1");
    assert.equal(found!.version, 1);
  });

  it("save and read Project", async () => {
    const spaceRepo = new PersonalSpaceRepository(db);
    await spaceRepo.save({ id: "ps-2", owner: "owner-2", version: 1 });
    const repo = new ProjectRepository(db);
    await repo.save({
      id: "proj-1", spaceId: "ps-2", name: "Test Project", goal: "Ship v1",
      status: "draft", currentState: null, currentStateFreshness: null,
      currentStateSource: null, version: 1,
    });
    const found = await repo.findById("proj-1");
    assert.ok(found);
    assert.equal(found!.name, "Test Project");
    assert.equal(found!.status, "draft");
  });

  it("save and read Task", async () => {
    const repo = new TaskRepository(db);
    await repo.save({
      id: "task-1", projectId: "proj-1", title: "Task A", scope: "Do X",
      nonScope: "", acceptanceCriteria: "X done", parentId: null, status: "backlog", version: 1,
    });
    const found = await repo.findById("task-1");
    assert.ok(found);
    assert.equal(found!.title, "Task A");
    assert.equal(found!.status, "backlog");
  });

  it("update Project (upsert)", async () => {
    const repo = new ProjectRepository(db);
    await repo.save({
      id: "proj-1", spaceId: "ps-2", name: "Updated Project", goal: "Ship v2",
      status: "active", currentState: "In progress", currentStateFreshness: new Date().toISOString(),
      currentStateSource: "owner", version: 2,
    });
    const found = await repo.findById("proj-1");
    assert.ok(found);
    assert.equal(found!.name, "Updated Project");
    assert.equal(found!.status, "active");
    assert.equal(found!.version, 2);
  });

  it("findByProject returns tasks", async () => {
    const repo = new TaskRepository(db);
    const tasks = await repo.findByProject("proj-1");
    assert.ok(tasks.length >= 1);
    assert.equal(tasks[0].title, "Task A");
  });

  it("restart recovery: close connection, reopen, read back", async () => {
    await closeDb(pool);
    const { Pool } = await import("pg");
    const newPool = new Pool({ connectionString: DB_URL });
    const { db: newDb } = createDb(DB_URL);
    const repo = new ProjectRepository(newDb);
    const found = await repo.findById("proj-1");
    assert.ok(found, "Project should survive connection restart");
    assert.equal(found!.name, "Updated Project");
    assert.equal(found!.status, "active");
    await closeDb(newPool);
  });
});