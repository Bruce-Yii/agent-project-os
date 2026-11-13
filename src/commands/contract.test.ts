import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { CommandExecutor } from "./executor.js";
import { createDb, closeDb } from "../persistence/db.js";
import { migrate } from "../persistence/migrate.js";
import { startDisposablePg, type DisposablePg } from "../persistence/disposable-pg.js";

describe("WP1-A command contract (product code)", () => {
  let pg: DisposablePg;
  let pool: any;
  let db: any;
  let executor: CommandExecutor;

  before(async () => {
    // Container created exclusively by test process; connection URI from container only.
    pg = await startDisposablePg();
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: pg.connectionUri });
    await migrate(pg.connectionUri);
    const result = createDb(pg.connectionUri);
    db = result.db;
    executor = new CommandExecutor({ db, pool });
  });

  after(async () => {
    try { await closeDb(pool); } catch { /* already closed */ }
  });

  it("bootstrap PersonalSpace is idempotent", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c1", idempotencyKey: "k1", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr1", causationId: "cause1" },
      intent: "BootstrapPersonalSpace",
      payload: { owner: "personal-owner-1" },
    });
    assert.equal(r1.status, "OK");
    const r2 = await executor.execute({
      envelope: { commandId: "c2", idempotencyKey: "k2", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr2", causationId: "cause2" },
      intent: "BootstrapPersonalSpace",
      payload: { owner: "personal-owner-1" },
    });
    assert.equal(r2.status, "OK");
    assert.equal(r2.spaceId, r1.spaceId, "second bootstrap must return same space");
  });

  it("unauthorized write rejected with 'unauthorized'", async () => {
    const r = await executor.execute({
      envelope: { commandId: "c3", idempotencyKey: "k3", actor: "agent-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr3", causationId: "cause3" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "Hacked" } as any,
    });
    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "unauthorized");
  });

  it("stale version rejected with 'STALE_VERSION'", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c4", idempotencyKey: "k4", actor: "personal-owner-1", personalSpaceId: "ps-1", expectedVersion: 1, createdAt: new Date().toISOString(), correlationId: "corr4", causationId: "cause4" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "Versioned Project" } as any,
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const r2 = await executor.execute({
      envelope: { commandId: "c5", idempotencyKey: "k5", actor: "personal-owner-1", personalSpaceId: "ps-1", projectId: projId, expectedVersion: 1, createdAt: new Date().toISOString(), correlationId: "corr5", causationId: "cause5" },
      intent: "UpdateProject",
      payload: { project_id: projId, name: "Updated" } as any as any,
    });
    assert.equal(r2.status, "OK");
    const r3 = await executor.execute({
      envelope: { commandId: "c6", idempotencyKey: "k6", actor: "personal-owner-1", personalSpaceId: "ps-1", projectId: projId, expectedVersion: 1, createdAt: new Date().toISOString(), correlationId: "corr6", causationId: "cause6" },
      intent: "UpdateProject",
      payload: { project_id: projId, name: "Stale" } as any as any,
    });
    assert.equal(r3.status, "REJECTED");
    assert.equal(r3.reason, "STALE_VERSION");
  });

  it("invalid state transition rejected with exact reason", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c7", idempotencyKey: "k7", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr7", causationId: "cause7" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "State Test" } as any,
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const r2 = await executor.execute({
      envelope: { commandId: "c8", idempotencyKey: "k8", actor: "personal-owner-1", personalSpaceId: "ps-1", projectId: projId, createdAt: new Date().toISOString(), correlationId: "corr8", causationId: "cause8" },
      intent: "CloseProject",
      payload: { project_id: projId } as any as any,
    });
    assert.equal(r2.status, "REJECTED");
    assert.ok((r2.reason ?? "").toLowerCase().includes("invalid_transition"), `expected INVALID_TRANSITION, got ${r2.reason}`);
  });

  it("duplicate command returns stored result without re-executing", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c9", idempotencyKey: "k-dup", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr9", causationId: "cause9" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "Dup Test" } as any,
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const r2 = await executor.execute({
      envelope: { commandId: "c10", idempotencyKey: "k-dup", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr10", causationId: "cause10" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "Dup Test" } as any,
    });
    assert.equal(r2.status, "OK");
    assert.equal(r2.projectId, projId, "duplicate must return stored result");
  });

  it("dependency cycle rejected", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c11", idempotencyKey: "k11", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr11", causationId: "cause11" },
      intent: "CreateProject",
      payload: { name: "Dep Test" } as any,
    });
    const projId = r1.projectId as string;
    const t1 = await executor.execute({
      envelope: { commandId: "c12", idempotencyKey: "k12", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr12", causationId: "cause12" },
      intent: "CreateTask",
      payload: { projectId: projId, title: "Task A" } as any as any,
    });
    const t2 = await executor.execute({
      envelope: { commandId: "c13", idempotencyKey: "k13", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr13", causationId: "cause13" },
      intent: "CreateTask",
      payload: { projectId: projId, title: "Task B" } as any as any,
    });
    process.stderr.write("DEBUG t1=" + JSON.stringify(t1) + " t2=" + JSON.stringify(t2) + "\n");
    const dep1 = await executor.execute({
      envelope: { commandId: "c14", idempotencyKey: "k14", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr14", causationId: "cause14" },
      intent: "AddDependency",
      payload: { sourceTaskId: t1.taskId as string, targetTaskId: t2.taskId as string },
    });
    const dep2 = await executor.execute({
      envelope: { commandId: "c15", idempotencyKey: "k15", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr15", causationId: "cause15" },
    assert.equal(dep1.status, "OK");
      intent: "AddDependency",
      payload: { sourceTaskId: t2.taskId as string, targetTaskId: t1.taskId as string },
    });
    assert.equal(dep2.status, "REJECTED");
    assert.ok((dep2.reason ?? "").toLowerCase().includes("cycle"), `expected cycle, got ${dep2.reason}`);
  });
  it("CreateProject -> CreateTask -> UpdateCurrentState round-trip", async () => {
    const r1 = await executor.execute({
      envelope: { commandId: "c16", idempotencyKey: "k16", actor: "personal-owner-1", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr16", causationId: "cause16" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "Roundtrip Project", goal: "Test" } as any,
    });
    assert.equal(r1.status, "OK");
    const projId = r1.projectId as string;
    const r2 = await executor.execute({
      envelope: { commandId: "c17", idempotencyKey: "k17", actor: "personal-owner-1", personalSpaceId: "ps-1", projectId: projId, createdAt: new Date().toISOString(), correlationId: "corr17", causationId: "cause17" },
      intent: "CreateTask",
      payload: { project_id: projId, title: "Roundtrip Task" } as any as any,
    });
    assert.equal(r2.status, "OK");
    const r3 = await executor.execute({
      envelope: { commandId: "c18", idempotencyKey: "k18", actor: "personal-owner-1", personalSpaceId: "ps-1", projectId: projId, createdAt: new Date().toISOString(), correlationId: "corr18", causationId: "cause18" },
      intent: "UpdateProjectCurrentState",
      payload: { project_id: projId, current_state: "Task in progress" } as any as any,
    });
    assert.equal(r3.status, "OK");
  });

  it("fail-closed: missing actor rejected", async () => {
    const r = await executor.execute({
      envelope: { commandId: "c19", idempotencyKey: "k19", actor: "", personalSpaceId: "ps-1", createdAt: new Date().toISOString(), correlationId: "corr19", causationId: "cause19" },
      intent: "CreateProject",
      payload: { space_id: "ps-1", name: "No Actor" } as any,
    });
    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "unauthorized");
  });
});
