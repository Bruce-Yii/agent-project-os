import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createDb, closeDb } from "../../src/persistence/db.js";
import { ProjectRepository, TaskRepository, PersonalSpaceRepository } from "../../src/persistence/repositories.js";
import { CommandExecutor } from "../../src/commands/executor.js";
import { startDisposablePg, type DisposablePg } from "../../src/persistence/disposable-pg.js";
import { migrate } from "../../src/persistence/migrate.js";

describe("WP1-A restart recovery (separate process)", () => {
  let pg: DisposablePg;

  it("spawns child that writes Project+Task via CommandExecutor, kills it, parent reads back + verifies idempotency replay", async () => {
    pg = await startDisposablePg();
    const dbUrl = pg.connectionUri;
    const root = process.cwd();
    const childPath = path.join(root, "restart_child_tmp.mjs");

    const childScript = `
import { createDb } from "./dist/src/persistence/db.js";
import { migrate } from "./dist/src/persistence/migrate.js";
import { CommandExecutor } from "./dist/src/commands/executor.js";

const url = process.env.WP1A_TEST_DB_URL;
await migrate(url);
const { db, pool } = createDb(url);
const executor = new CommandExecutor(db, { pool });
const r1 = await executor.execute({
  envelope: { commandId: "rc-1", idempotencyKey: "rk-restart", actor: "personal-owner-1", personalSpaceId: "restart-ps", createdAt: new Date().toISOString(), correlationId: "rcorr", causationId: "rcause" },
  intent: "BootstrapPersonalSpace",
  payload: { owner: "restart-owner" },
});
console.log("BOOTSTRAP:", JSON.stringify(r1));
const r2 = await executor.execute({
  envelope: { commandId: "rc-2", idempotencyKey: "rk-proj", actor: "personal-owner-1", personalSpaceId: "restart-ps", createdAt: new Date().toISOString(), correlationId: "rcorr2", causationId: "rcause2" },
  intent: "CreateProject",
  payload: { space_id: "restart-ps", name: "Restart Project", goal: "g" },
});
console.log("PROJECT:", JSON.stringify(r2));
const r3 = await executor.execute({
  envelope: { commandId: "rc-3", idempotencyKey: "rk-task", actor: "personal-owner-1", personalSpaceId: "restart-ps", projectId: r2.projectId, createdAt: new Date().toISOString(), correlationId: "rcorr3", causationId: "rcause3" },
  intent: "CreateTask",
  payload: { project_id: r2.projectId, title: "Restart Task" },
});
console.log("TASK:", JSON.stringify(r3));
await new Promise((r) => setTimeout(r, 60000));
`;

    writeFileSync(childPath, childScript, "utf8");

    const env = { ...process.env, WP1A_TEST_DB_URL: dbUrl };
    const result = spawnSync(process.execPath, [childPath], {
      cwd: root,
      env,
      timeout: 3000,
      stdio: "ignore",
    });

    // Verify child was terminated by timeout (expected) or completed
    assert.ok(result.signal === "SIGTERM" || result.status === null || result.status !== 0,
      `child should have been terminated by timeout, got status=${result.status} signal=${result.signal}`);

    try { unlinkSync(childPath); } catch { /* ignore */ }

    // Parent reads back from DB
    const { db, pool } = createDb(dbUrl);
    try {
      const projRepo = new ProjectRepository(db);
      const taskRepo = new TaskRepository(db);
      const projects = await projRepo.findBySpace("restart-ps");
      assert.ok(projects.length >= 1, "At least one Project should survive process restart");
      const restartProj = projects.find((p: any) => p.name === "Restart Project");
      assert.ok(restartProj, "Restart Project should survive process restart");
      assert.equal(restartProj!.status, "draft");

      const tasks = await taskRepo.findByProject(restartProj!.id);
      assert.ok(tasks.length >= 1, "At least one Task should survive process restart");
      const restartTask = tasks.find((t: any) => t.title === "Restart Task");
      assert.ok(restartTask, "Restart Task should survive process restart");
      assert.equal(restartTask!.status, "backlog");

      // Verify idempotency replay: re-executing same idempotency key returns stored result
      const executor = new CommandExecutor(db, { pool });
      const replay = await executor.execute({
        envelope: { commandId: "rc-replay", idempotencyKey: "rk-proj", actor: "personal-owner-1", personalSpaceId: "restart-ps", createdAt: new Date().toISOString(), correlationId: "rcorr-replay", causationId: "rcause-replay" },
        intent: "CreateProject",
        payload: { space_id: "restart-ps", name: "Restart Project", goal: "g" },
      });
      assert.equal(replay.status, "OK", "idempotency replay should return OK");
      assert.equal(replay.projectId, restartProj!.id, "replay must return same projectId (persisted idempotency)");

      // Verify exactly one project row (no duplicate from replay)
      const projectsAfter = await projRepo.findBySpace("restart-ps");
      const restartProjects = projectsAfter.filter((p: any) => p.name === "Restart Project");
      assert.equal(restartProjects.length, 1, "replay must not create duplicate Project");
    } finally {
      await closeDb(pool);
      await new Promise((r) => setTimeout(r, 500));
    }
  });

  after(async () => {
    if (pg) await pg.stop().catch(() => {});
  });
});
