import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createDb, closeDb } from "../../src/persistence/db.js";
import { ProjectRepository, TaskRepository } from "../../src/persistence/repositories.js";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
  if (!url) {
    throw new Error("DATABASE_URL or WP1A_TEST_DB must be set (no default credentials).");
  }
  return url;
}

describe("WP1-A restart recovery (separate process)", () => {
  it("spawns child that writes Project+Task, kills it, parent reads back", async () => {
    const dbUrl = getDbUrl();
    const root = process.cwd();
    const childPath = path.join(root, "restart_child_tmp.mjs");

    const childScript = `
import { createDb } from "./dist/src/persistence/db.js";
import { migrate } from "./dist/src/persistence/migrate.js";
import { PersonalSpaceRepository, ProjectRepository, TaskRepository } from "./dist/src/persistence/repositories.js";

const url = process.env.DATABASE_URL || process.env.WP1A_TEST_DB;
await migrate(url);
const { db } = createDb(url);
const spaceRepo = new PersonalSpaceRepository(db);
await spaceRepo.save({ id: "restart-ps", owner: "restart-owner", version: 1 });
const projRepo = new ProjectRepository(db);
await projRepo.save({ id: "restart-proj", spaceId: "restart-ps", name: "Restart Project", goal: "g", status: "draft", currentState: null, currentStateFreshness: null, currentStateSource: null, version: 1 });
const taskRepo = new TaskRepository(db);
await taskRepo.save({ id: "restart-task", projectId: "restart-proj", title: "Restart Task", scope: "s", nonScope: "", acceptanceCriteria: "a", parentId: null, status: "backlog", version: 1 });
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

    const { db, pool } = createDb(dbUrl);
    try {
      const projRepo = new ProjectRepository(db);
      const taskRepo = new TaskRepository(db);
      const proj = await projRepo.findById("restart-proj");
      const task = await taskRepo.findById("restart-task");
      assert.ok(proj, "Project should survive process restart");
      assert.equal(proj!.name, "Restart Project");
      assert.equal(proj!.status, "draft");
      assert.ok(task, "Task should survive process restart");
      assert.equal(task!.title, "Restart Task");
      assert.equal(task!.status, "backlog");
    } finally {
      await closeDb(pool);
    }
  });
});