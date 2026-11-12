import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { migrate } from "./migrate.js";

const ADMIN_URL = "postgresql://postgres:123456@127.0.0.1:5432/postgres";
const TEST_DB = "wp1a_migrate_test";
const DB_URL = `postgresql://postgres:123456@127.0.0.1:5432/${TEST_DB}`;

describe("WP1-A migrations", () => {
  let pool: Pool;

  before(async () => {
    const adminPool = new Pool({ connectionString: ADMIN_URL });
    const { rows } = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB]);
    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${TEST_DB}`);
    }
    await adminPool.end();
    pool = new Pool({ connectionString: DB_URL });
    await pool.query(`
      DROP TABLE IF EXISTS project_current_states CASCADE;
      DROP TABLE IF EXISTS dependency_edges CASCADE;
      DROP TABLE IF EXISTS goals CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS personal_spaces CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
    `);
  });

  after(async () => {
    await pool.end();
    const adminPool = new Pool({ connectionString: ADMIN_URL });
    await adminPool.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
    await adminPool.end();
  });

  it("applies from empty DB", async () => {
    const result = await migrate(DB_URL);
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
    assert.equal(mig.rows.length, 1);
  });

  it("is idempotent", async () => {
    const result = await migrate(DB_URL);
    assert.deepEqual(result.applied, []);
  });
});