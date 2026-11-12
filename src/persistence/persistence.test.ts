import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, closeDb } from "./db.js";
import { PersonalSpaceRepository, ProjectRepository, TaskRepository, GoalRepository, DependencyRepository } from "./repositories.js";
import { migrate } from "./migrate.js";
import { assertDisposableDb } from "../test-guard.js";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
  if (!url) {
    throw new Error("DATABASE_URL or WP1A_TEST_DB must be set (no default credentials).");
  }
  return url;
}

describe("WP1-A persistence (PostgreSQL)", () => {
  const DB_URL = getDbUrl();
  let pool: any;
  let db: any;

  before(async () => {
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: DB_URL });
    await assertDisposableDb(DB_URL);
    await pool.query("DELETE FROM project_current_states");
    await pool.query("DELETE FROM dependency_edges");
    await pool.query("DELETE FROM goals");
    await pool.query("DELETE FROM tasks");
    await pool.query("DELETE FROM projects");
    await pool.query("DELETE FROM personal_spaces");
    await pool.query("DELETE FROM idempotency_records");
    await pool.query("DELETE FROM command_receipts");
    await pool.query("DELETE FROM schema_migrations");
    await migrate(DB_URL);
    const result = createDb(DB_URL);
    db = result.db;
  });

  after(async () => {
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
    const newPool = new (await import("pg")).Pool({ connectionString: DB_URL });
    pool = newPool;
    const { db: newDb } = createDb(DB_URL);
    db = newDb;
    const repo = new ProjectRepository(newDb);
    const found = await repo.findById("proj-1");
    assert.ok(found, "Project should survive connection restart");
    assert.equal(found!.name, "Updated Project");
    assert.equal(found!.status, "active");
  });
});