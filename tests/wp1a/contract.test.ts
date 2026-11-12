import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { CommandExecutor } from "../../src/commands/executor.js";
import { createDb, closeDb } from "../../src/persistence/db.js";
import { migrate } from "../../src/persistence/migrate.js";
import { ProjectRepository, TaskRepository, PersonalSpaceRepository } from "../../src/persistence/repositories.js";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
  if (!url) {
    throw new Error("DATABASE_URL or WP1A_TEST_DB must be set (no default credentials).");
  }
  return url;
}

const OWNER = "personal-owner-1";

describe("WP1-A command contract (product code)", () => {
  const DB_URL = getDbUrl();
  let pool: any;
  let db: any;
  let executor: CommandExecutor;

  before(async () => {
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: DB_URL });
    // Clean slate
    await pool.query("DROP TABLE IF EXISTS tasks CASCADE");
    await pool.query("DROP TABLE IF EXISTS goals CASCADE");
    await pool.query("DROP TABLE IF EXISTS dependency_edges CASCADE");
    await pool.query("DROP TABLE IF EXISTS project_current_states CASCADE");
    await pool.query("DROP TABLE IF EXISTS projects CASCADE");
    await pool.query("DROP TABLE IF EXISTS personal_spaces CASCADE");
    await pool.query("DROP TABLE IF EXISTS schema_migrations CASCADE");
    await migrate(DB_URL);
    const result = createDb(DB_URL);
    db = result.db;
    executor = new CommandExecutor(db, { owner: OWNER });
  });

  after(async () => {
    try { await closeDb(pool); } catch { /* already closed */ }
  });

  function env(overrides: Record<string, unknown> = {}) {
    return {
      commandId: `c-${Math.random()}`,
      idempotencyKey: `k-${Math.random()}`,
      actor: OWNER,
      personalSpaceId: "ps-1",
      createdAt: new Date().toISOString(),
      correlationId: "corr",
      causationId: "cause",
      ...overrides,
    };
  }

  it("bootstrap PersonalSpace is idempotent", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "bk-1" }),
      intent: "BootstrapPersonalSpace",
      payload: { owner: OWNER },
    });
    assert.equal(r1.status, "OK");
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "bk-2" }),
      intent: "BootstrapPersonalSpace",
      payload: { owner: OWNER },
    });
    assert.equal(r2.status, "OK");
    assert.equal(r2.personalSpaceId, r1.personalSpaceId, "second bootstrap must return same space_id");
  });

  it("unauthorized write rejected with 'unauthorized'", async () => {
    const r = await executor.execute({
      envelope: env({ actor: "agent-1", idempotencyKey: "unauth-1" }),
      intent: "CreateProject",
      payload: { name: "Hacked" },
    });
    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "unauthorized");
  });

  it("fail-closed: missing actor rejected", async () => {
    const r = await executor.execute({
      envelope: env({ actor: "", idempotencyKey: "noactor-1" }),
      intent: "CreateProject",
      payload: { name: "No Actor" },
    });
    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "unauthorized");
  });

  it("cross-PersonalSpace write rejected", async () => {
    // Project lives in space A; actor from a different owner/space cannot write.
    const r = await executor.execute({
      envelope: env({ actor: "other-owner", personalSpaceId: "ps-other", idempotencyKey: "cross-1" }),
      intent: "CreateProject",
      payload: { name: "Cross Space" },
    });
    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "unauthorized");
  });

  it("stale version rejected with 'STALE_VERSION'", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "sv-1", expectedVersion: 1 }),
      intent: "CreateProject",
      payload: { name: "Versioned Project" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "sv-2", projectId: projId, expectedVersion: 1 }),
      intent: "UpdateProject",
      payload: { projectId: projId, name: "Updated" },
    });
    assert.equal(r2.status, "OK");
    const r3 = await executor.execute({
      envelope: env({ idempotencyKey: "sv-3", projectId: projId, expectedVersion: 1 }),
      intent: "UpdateProject",
      payload: { projectId: projId, name: "Stale" },
    });
    assert.equal(r3.status, "REJECTED");
    assert.equal(r3.reason, "STALE_VERSION");
  });

  it("invalid state transition rejected with exact reason", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "ist-1" }),
      intent: "CreateProject",
      payload: { name: "State Test" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const before = await new ProjectRepository(db).findById(projId);
    // draft -> closed is invalid
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "ist-2", projectId: projId }),
      intent: "CloseProject",
      payload: { projectId: projId },
    });
    assert.equal(r2.status, "REJECTED");
    assert.equal(r2.reason, "INVALID_TRANSITION");
    // state unchanged after rejection
    const after = await new ProjectRepository(db).findById(projId);
    assert.equal(after!.status, before!.status);
    assert.equal(after!.version, before!.version);
  });

  it("Project lifecycle guards: draft->closed rejected, closed->active rejected (terminal)", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "lc-1" }),
      intent: "CreateProject",
      payload: { name: "Lifecycle" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    // draft -> closed rejected
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "lc-2", projectId: projId }),
      intent: "CloseProject",
      payload: { projectId: projId },
    });
    assert.equal(r2.status, "REJECTED");
    assert.equal(r2.reason, "INVALID_TRANSITION");
    // activate (draft->active valid)
    const r3 = await executor.execute({
      envelope: env({ idempotencyKey: "lc-3", projectId: projId, expectedVersion: 1 }),
      intent: "ActivateProject",
      payload: { projectId: projId },
    });
    assert.equal(r3.status, "OK");
    // active -> closed valid
    const r4 = await executor.execute({
      envelope: env({ idempotencyKey: "lc-4", projectId: projId, expectedVersion: r3.version as number }),
      intent: "CloseProject",
      payload: { projectId: projId },
    });
    assert.equal(r4.status, "OK");
    // closed -> active rejected (terminal)
    const r5 = await executor.execute({
      envelope: env({ idempotencyKey: "lc-5", projectId: projId }),
      intent: "ActivateProject",
      payload: { projectId: projId },
    });
    assert.equal(r5.status, "REJECTED");
    assert.equal(r5.reason, "INVALID_TRANSITION");
  });

  it("Task state subset: backlog->ready->blocked->cancelled, invalid rejected", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "ts-1" }),
      intent: "CreateProject",
      payload: { name: "Task States" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const t = await executor.execute({
      envelope: env({ idempotencyKey: "ts-2", projectId: projId }),
      intent: "CreateTask",
      payload: { projectId: projId, title: "T1" },
    });
    assert.equal(t.status, "OK");
    const taskId = t.taskId as string;
    const rReady = await executor.execute({
      envelope: env({ idempotencyKey: "ts-3", taskId }),
      intent: "TransitionTaskState",
      payload: { taskId, toStatus: "ready" },
    });
    assert.equal(rReady.status, "OK");
    const rBlocked = await executor.execute({
      envelope: env({ idempotencyKey: "ts-4", taskId }),
      intent: "TransitionTaskState",
      payload: { taskId, toStatus: "blocked" },
    });
    assert.equal(rBlocked.status, "OK");
    const rCancelled = await executor.execute({
      envelope: env({ idempotencyKey: "ts-5", taskId }),
      intent: "TransitionTaskState",
      payload: { taskId, toStatus: "cancelled" },
    });
    assert.equal(rCancelled.status, "OK");
    // invalid: cancelled -> ready
    const rInvalid = await executor.execute({
      envelope: env({ idempotencyKey: "ts-6", taskId }),
      intent: "TransitionTaskState",
      payload: { taskId, toStatus: "ready" },
    });
    assert.equal(rInvalid.status, "REJECTED");
    assert.equal(rInvalid.reason, "INVALID_TRANSITION");
  });

  it("Dependency acyclicity: cycle rejected, valid edge accepted", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "dep-1" }),
      intent: "CreateProject",
      payload: { name: "Dep Test" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const t1 = await executor.execute({
      envelope: env({ idempotencyKey: "dep-2", projectId: projId }),
      intent: "CreateTask",
      payload: { projectId: projId, title: "Task A" },
    });
    const t2 = await executor.execute({
      envelope: env({ idempotencyKey: "dep-3", projectId: projId }),
      intent: "CreateTask",
      payload: { projectId: projId, title: "Task B" },
    });
    assert.equal(t1.status, "OK");
    assert.equal(t2.status, "OK");
    const dep1 = await executor.execute({
      envelope: env({ idempotencyKey: "dep-4" }),
      intent: "AddDependency",
      payload: { sourceTaskId: t1.taskId as string, targetTaskId: t2.taskId as string },
    });
    assert.equal(dep1.status, "OK");
    const dep2 = await executor.execute({
      envelope: env({ idempotencyKey: "dep-5" }),
      intent: "AddDependency",
      payload: { sourceTaskId: t2.taskId as string, targetTaskId: t1.taskId as string },
    });
    assert.equal(dep2.status, "REJECTED");
    assert.equal(dep2.reason, "CYCLE");
  });

  it("duplicate command returns stored result without re-executing", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "dup-1" }),
      intent: "CreateProject",
      payload: { name: "Dup Test" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const repo = new ProjectRepository(db);
    const beforeCount = (await repo.findBySpace(r1.spaceId as string)).length;
    // Replay with same idempotency key
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "dup-1" }),
      intent: "CreateProject",
      payload: { name: "Dup Test" },
    });
    assert.equal(r2.status, "OK");
    assert.equal(r2.projectId, projId, "duplicate must return stored result");
    const afterCount = (await repo.findBySpace(r1.spaceId as string)).length;
    assert.equal(afterCount, beforeCount, "no re-execution / no duplicate side effect");
  });

  it("ProjectCurrentState: create, update, read back with freshness/source", async () => {
    const r1 = await executor.execute({
      envelope: env({ idempotencyKey: "pcs-1" }),
      intent: "CreateProject",
      payload: { name: "PCS Project" },
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const freshness1 = new Date().toISOString();
    const r2 = await executor.execute({
      envelope: env({ idempotencyKey: "pcs-2", projectId: projId }),
      intent: "UpdateProjectCurrentState",
      payload: { projectId: projId, summary: "initial", freshness: freshness1, source: "owner" },
    });
    assert.equal(r2.status, "OK");
    const repo = new ProjectRepository(db);
    let proj = await repo.findById(projId);
    assert.equal(proj!.currentState, "initial");
    assert.equal(proj!.currentStateFreshness, freshness1);
    assert.equal(proj!.currentStateSource, "owner");

    const freshness2 = new Date().toISOString();
    const r3 = await executor.execute({
      envelope: env({ idempotencyKey: "pcs-3", projectId: projId }),
      intent: "UpdateProjectCurrentState",
      payload: { projectId: projId, summary: "updated", freshness: freshness2, source: "derived" },
    });
    assert.equal(r3.status, "OK");
    proj = await repo.findById(projId);
    assert.equal(proj!.currentState, "updated");
    assert.equal(proj!.currentStateFreshness, freshness2);
    assert.equal(proj!.currentStateSource, "derived");
  });
});