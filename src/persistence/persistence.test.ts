import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, closeDb } from "./db.js";
import { PersonalSpaceRepository, ProjectRepository, TaskRepository, GoalRepository, DependencyRepository } from "./repositories.js";
import { migrate } from "./migrate.js";
import { startDisposablePg, type DisposablePg } from "./disposable-pg.js";
import { randomUUID } from "node:crypto";

describe("WP1-A persistence (PostgreSQL)", () => {
  let pg: DisposablePg;
  let pool: any;
  let dbPool: any; // separate pool from createDb()
  let db: any;

  before(async () => {
    // Container created exclusively by test process; connection URI from container only.
    pg = await startDisposablePg();
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: pg.connectionUri });
    await migrate(pg.connectionUri);
    const result = createDb(pg.connectionUri);
    db = result.db;
    dbPool = result.pool; // store the second pool for cleanup
  });

  after(async () => {
    // Close ALL pools before stopping container
    try { await closeDb(pool); } catch { /* already closed */ }
    try { await closeDb(dbPool); } catch { /* already closed */ }
    // Explicit container stop (not relying on Ryuk alone)
    await new Promise((r) => setTimeout(r, 2000));
    await pg.stop().catch((e: any) => {
      if (!String(e?.message || e).includes("terminating connection")) throw e;
    });
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
    const newPool = new Pool({ connectionString: pg.connectionUri });
    pool = newPool;
    const { db: newDb } = createDb(pg.connectionUri);
    db = newDb;
    const repo = new ProjectRepository(newDb);
    const found = await repo.findById("proj-1");
    assert.ok(found, "Project should survive connection restart");
    assert.equal(found!.name, "Updated Project");
    assert.equal(found!.status, "active");
  });
});
