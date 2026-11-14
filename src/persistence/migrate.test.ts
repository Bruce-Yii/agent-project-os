import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { migrate } from "./migrate.js";
import { startDisposablePg, type DisposablePg } from "./disposable-pg.js";

describe("WP1-A migrations", () => {
  let pg: DisposablePg;
  let pool: Pool;

  before(async () => {
    pg = await startDisposablePg();
    pool = new Pool({ connectionString: pg.connectionUri });
  });

  after(async () => {
    await pool.end().catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await pg.stop().catch((e: any) => {
      if (!String(e?.message || e).includes("terminating connection")) throw e;
    });
  });

  it("applies from empty DB", async () => {
    const result = await migrate(pg.connectionUri);
    assert.ok(result.applied.includes("0001_initial.sql"));
    const { rows } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    const names = rows.map((r: { tablename: string }) => r.tablename);
    for (const t of [
      "personal_spaces",
      "projects",
      "goals",
      "tasks",
      "dependency_edges",
      "project_current_states",
      "agent_sessions",
      "assignments",
      "runs",
      "artifacts",
      "reviews",
      "agent_session_creation_intents",
      "schema_migrations",
    ]) {
      assert.ok(names.includes(t), `missing table ${t}`);
    }
    const mig = await pool.query("SELECT version FROM schema_migrations");
    assert.equal(mig.rows.length, 6);
  });

  it("is idempotent", async () => {
    const result = await migrate(pg.connectionUri);
    assert.deepEqual(result.applied, []);
  });

  it("upgrades a legacy 0004 database and enforces workflow indexes", async () => {
    const upgradePg = await startDisposablePg();
    const upgradePool = new Pool({ connectionString: upgradePg.connectionUri });
    try {
      await upgradePool.query(`
        CREATE TABLE schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const dir = path.resolve(process.cwd(), "src", "persistence", "migrations");
      for (const file of [
        "0001_initial.sql",
        "0002_receipts_idempotency.sql",
        "0003_agent_sessions.sql",
      ]) {
        await upgradePool.query("BEGIN");
        try {
          await upgradePool.query(readFileSync(path.join(dir, file), "utf8"));
          await upgradePool.query(
            "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING",
            [file],
          );
          await upgradePool.query("COMMIT");
        } catch (error) {
          await upgradePool.query("ROLLBACK");
          throw error;
        }
      }

      // Reproduce the deployed pre-0005 shape: workflow tables exist, but the
      // unique-attempt and status indexes have not yet been installed.
      await upgradePool.query(`
        CREATE TABLE assignments (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES tasks(id),
          agent_id TEXT NOT NULL,
          runtime_id TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE runs (
          id TEXT PRIMARY KEY,
          assignment_id TEXT NOT NULL REFERENCES assignments(id),
          attempt INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'queued',
          idempotency_key TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE artifacts (
          id TEXT PRIMARY KEY,
          run_id TEXT NOT NULL REFERENCES runs(id),
          kind TEXT NOT NULL,
          immutable_ref TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE reviews (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES tasks(id),
          run_id TEXT REFERENCES runs(id),
          verdict TEXT NOT NULL DEFAULT 'pending',
          evidence_refs TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        INSERT INTO schema_migrations (version) VALUES ('0004_workflow.sql');
      `);

      const upgraded = await migrate(upgradePg.connectionUri);
      assert.ok(upgraded.applied.includes("0005_workflow_constraints.sql"));
      assert.ok(upgraded.applied.includes("0006_agent_session_creation_intents.sql"));

      const indexes = await upgradePool.query(
        "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='runs'",
      );
      const names = indexes.rows.map((row: { indexname: string }) => row.indexname);
      assert.ok(names.includes("runs_assignment_id_attempt_unique"));
      assert.ok(names.includes("runs_assignment_id_status_idx"));

      await upgradePool.query("INSERT INTO personal_spaces (id, owner) VALUES ('ps-upgrade','owner')");
      await upgradePool.query("INSERT INTO projects (id, space_id, name) VALUES ('p-upgrade','ps-upgrade','upgrade')");
      await upgradePool.query("INSERT INTO tasks (id, project_id, title) VALUES ('t-upgrade','p-upgrade','upgrade')");
      await upgradePool.query("INSERT INTO assignments (id, task_id, agent_id) VALUES ('a-upgrade','t-upgrade','agent')");
      await upgradePool.query(
        "INSERT INTO runs (id, assignment_id, attempt, status) VALUES ('r-upgrade-1','a-upgrade',1,'failed')",
      );
      await assert.rejects(
        upgradePool.query(
          "INSERT INTO runs (id, assignment_id, attempt, status) VALUES ('r-upgrade-duplicate','a-upgrade',1,'queued')",
        ),
        (error: any) => error?.code === "23505",
      );

      const rerun = await migrate(upgradePg.connectionUri);
      assert.deepEqual(rerun.applied, []);
    } finally {
      await upgradePool.end().catch(() => {});
      await upgradePg.stop().catch(() => {});
    }
  });
});
