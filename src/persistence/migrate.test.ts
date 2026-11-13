import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { migrate } from "./migrate.js";
import { startDisposablePg, type DisposablePg } from "./disposable-pg.js";

describe("WP1-A migrations", () => {
  let pg: DisposablePg;
  let pool: Pool;

  before(async () => {
    // Container created exclusively by test process; connection URI from container only.
    // No ambient DATABASE_URL / ADMIN_URL / WP1A_TEST_DB fallback.
    pg = await startDisposablePg();
    pool = new Pool({ connectionString: pg.connectionUri });
  });

  after(async () => {
    await pool.end().catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    await pg.stop().catch(() => {});
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
      "schema_migrations",
    ]) {
      assert.ok(names.includes(t), `missing table ${t}`);
    }
    const mig = await pool.query("SELECT version FROM schema_migrations");
    assert.equal(mig.rows.length, 2);
  });

  it("is idempotent", async () => {
    const result = await migrate(pg.connectionUri);
    assert.deepEqual(result.applied, []);
  });
});
