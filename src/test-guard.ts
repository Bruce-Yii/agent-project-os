// Test database safety guard for WP1-A.
// Ensures destructive test operations only run against explicitly named
// disposable test databases. Fails closed on any non-test target.

import { Pool } from "pg";

const ALLOWED_DB_PATTERNS = [/test/i, /wp1a/i, /spike/i];

export interface DbGuardResult {
  ok: boolean;
  reason?: string;
  dbName?: string;
}

/**
 * Verify that the connected database is a disposable test database.
 * Checks:
 * 1. DATABASE_URL or WP1A_TEST_DB env var is set (no fallback).
 * 2. WP1A_TEST_OPT_IN=true is set (explicit opt-in).
 * 3. Actual connected DB name matches an allowed pattern.
 * Fails closed on any failure.
 */
export async function verifyDisposableDb(connectionString: string): Promise<DbGuardResult> {
  // Check 1: explicit opt-in
  if (process.env.WP1A_TEST_OPT_IN !== "true") {
    return { ok: false, reason: "WP1A_TEST_OPT_IN must be set to 'true' for destructive test operations" };
  }

  // Check 2: no fallback credentials
  if (!process.env.DATABASE_URL && !process.env.WP1A_TEST_DB) {
    return { ok: false, reason: "DATABASE_URL or WP1A_TEST_DB must be explicitly set (no fallback)" };
  }

  const pool = new Pool({ connectionString });
  try {
    // Check 3: actual connected DB name
    const { rows } = await pool.query("SELECT current_database() AS db_name");
    const dbName = rows[0]?.db_name as string;
    if (!dbName) {
      return { ok: false, reason: "Could not determine connected database name" };
    }

    const allowed = ALLOWED_DB_PATTERNS.some((p) => p.test(dbName));
    if (!allowed) {
      return { ok: false, reason: `Database '${dbName}' does not match allowed test patterns (${ALLOWED_DB_PATTERNS.map((p) => p.source).join(", ")})` };
    }

    return { ok: true, dbName };
  } catch (err) {
    return { ok: false, reason: `DB guard check failed: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Assert that the DB is disposable. Throws if not.
 */
export async function assertDisposableDb(connectionString: string): Promise<string> {
  const result = await verifyDisposableDb(connectionString);
  if (!result.ok) {
    throw new Error(`DB GUARD FAILED: ${result.reason}`);
  }
  return result.dbName!;
}