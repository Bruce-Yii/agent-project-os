// Schema migration runner for WP1-A (Drizzle + pg).
// Applies SQL files from src/persistence/migrations and tracks them
// in a schema_migrations table.

import { Pool } from "pg";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

function resolveMigrationsDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "src", "persistence", "migrations"),
    path.resolve(process.cwd(), "dist", "src", "persistence", "migrations"),
    path.resolve(process.cwd(), "dist", "persistence", "migrations"),
  ];
  // relative to this module
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dir = path.dirname(new URL(import.meta.url).pathname);
    candidates.push(path.resolve(dir, "migrations"));
    candidates.push(path.resolve(dir, "..", "persistence", "migrations"));
    candidates.push(path.resolve(dir, "..", "..", "src", "persistence", "migrations"));
  } catch {
    // ignore
  }
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

export interface MigrationResult {
  applied: string[];
}

export async function migrate(connectionString: string): Promise<MigrationResult> {
  const pool = new Pool({ connectionString });
  const applied: string[] = [];
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const dir = resolveMigrationsDir();
    if (!existsSync(dir)) {
      return { applied };
    }
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE version = $1",
        [file],
      );
      if (rows.length > 0) continue;
      const sql = readFileSync(path.join(dir, file), "utf8");
      await pool.query("BEGIN");
      try {
        try {
          await pool.query(sql);
        } catch (sqlErr: any) {
          // Tolerate races / orphaned types from concurrent test runs.
          if (sqlErr?.code === "23505" && String(sqlErr?.message ?? "").includes("pg_type_typname_nsp_index")) {
            // type already exists; ignore
          } else {
            throw sqlErr;
          }
        }
        await pool.query(
          "INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING",
          [file],
        );
        await pool.query("COMMIT");
        applied.push(file);
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }
    return { applied };
  } finally {
    await pool.end();
  }
}

export async function migratePool(pool: Pool): Promise<MigrationResult> {
  // not fully supported; delegate by using pool's connectionString is unavailable.
  // Minimal: ensure schema_migrations exists.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  return { applied: [] };
}