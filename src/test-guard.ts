// Test database safety guard for WP1-A (Gate 0).
// Ensures destructive test operations only run against explicitly named
// disposable test databases. Fails closed on any failure.
//
// Design (per coordinator RCA b20a2da0):
// - Require WP1A_TEST_OPT_IN=true (explicit opt-in)
// - Require DATABASE_URL or WP1A_TEST_DB env var (no fallback credentials)
// - Actual connected DB name must start with an exact allowed prefix
//   (not a regex substring match)
// - If WP1A_TEST_NONCE is set, the DB name must contain it (per-run marker)
// - Negative tests prove refusal on non-disposable targets

import { Pool } from "pg";

// Exact prefix allowlist — DB name must START WITH one of these.
const ALLOWED_DB_PREFIXES = ["wp1a_test", "wp1a_migrate_test", "wp1a_contract_test"];

export interface DbGuardResult {
  ok: boolean;
  reason?: string;
  dbName?: string;
}

/**
 * Verify that the connected database is a disposable test database.
 * Fails closed on any failure. Does NOT delete or modify data.
 */
export async function verifyDisposableDb(connectionString: string): Promise<DbGuardResult> {
  // Check 1: explicit opt-in
  if (process.env.WP1A_TEST_OPT_IN !== "true") {
    return { ok: false, reason: "WP1A_TEST_OPT_IN must be set to 'true' for destructive test operations" };
  }

  // Check 2: no fallback credentials
  if (!process.env.DATABASE_URL && !process.env.WP1A_TEST_DB) {
    return { ok: false, reason: "DATABASE_URL or WP1A_TEST_DB must be explicitly set (no fallback credentials)" };
  }

  const pool = new Pool({ connectionString });
  try {
    // Check 3: actual connected DB name (not connection string)
    const { rows } = await pool.query("SELECT current_database() AS db_name");
    const dbName = rows[0]?.db_name as string;
    if (!dbName) {
      return { ok: false, reason: "Could not determine connected database name" };
    }

    // Check 4: exact prefix match (not regex substring)
    const allowed = ALLOWED_DB_PREFIXES.some((prefix) => dbName.startsWith(prefix));
    if (!allowed) {
      return { ok: false, reason: `Database '${dbName}' does not start with an allowed test prefix (${ALLOWED_DB_PREFIXES.join(", ")})` };
    }

    // Check 5: if per-run nonce is set, DB name must contain it
    const nonce = process.env.WP1A_TEST_NONCE;
    if (nonce && !dbName.includes(nonce)) {
      return { ok: false, reason: `Database '${dbName}' does not contain the per-run nonce '${nonce}' (not created by this test run)` };
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