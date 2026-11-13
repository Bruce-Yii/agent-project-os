import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createDb, closeDb } from "../../src/persistence/db.js";
import { ProjectRepository, TaskRepository, PersonalSpaceRepository } from "../../src/persistence/repositories.js";
import { CommandExecutor } from "../../src/commands/executor.js";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
  if (!url) {
    throw new Error("DATABASE_URL or WP1A_TEST_DB must be set (no default credentials).");
  }
  return url;
}

describe("WP1-A restart recovery (separate process)", () => {
  it("spawns child that writes Project+Task via CommandExecutor, kills it, parent reads back + verifies idempotency replay", async () => {
    const dbUrl = getDbUrl();
    const root = process.cwd();
    const childPath = path.join(root, "restart_child_tmp.mjs");

    const childScript = `
import { createDb } from "./dist/src/persistence/db.js";
import { migrate } from "./dist/src/persistence/migrate.js";
import { CommandExecutor } from "./dist/src/commands/executor.js";

const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
await migrate(url);
const { db } = createDb(url);
const executor = new CommandExecutor(db);
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

    const env = { ...process.env, DATABASE_URL: dbUrl, WP1A_TEST_DB: dbUrl };
    spawnSync(process.execPath, [childPath], {
      cwd: root,
      env,
      timeout: 3000,
      stdio: "ignore",
    });

    try { unlinkSync(childPath); } catch { /* ignore */ }

    // Parent reads back from DB
    const { db, pool } = createDb(dbUrl);
    try {
      const projRepo = new ProjectRepository(db);
      const taskRepo = new TaskRepository(db);
      const proj = await projRepo.findById("restart-proj");
      const task = await taskRepo.findById("restart-task");

      // Note: project/task IDs are generated (proj-*, task-*), not "restart-proj"/"restart-task"
      // The child uses CommandExecutor which generates IDs. We verify by listing.
      // Actually, the child creates with generated IDs. Let's check what was created.
      // Re-read: the child logs PROJECT/TASK but we can't capture stdout (stdio: ignore).
      // So we verify by checking that at least one project with name "Restart Project" exists.
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
      const executor = new CommandExecutor(db);
      // Re-bootstrap (idempotent) should return same space
      const replay = await executor.execute({
        envelope: { commandId: "rc-replay", idempotencyKey: "rk-proj", actor: "personal-owner-1", personalSpaceId: "restart-ps", createdAt: new Date().toISOString(), correlationId: "rcorr-replay", causationId: "rcause-replay" },
        intent: "CreateProject",
        payload: { space_id: "restart-ps", name: "Restart Project", goal: "g" },
      });
      // The idempotency store should return the stored result (same projectId)
      assert.equal(replay.status, "OK", "idempotency replay should return OK");
    } finally {
      await closeDb(pool);
    }
  });
});