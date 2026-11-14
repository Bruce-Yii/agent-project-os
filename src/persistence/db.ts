// Database connection (Drizzle + pg).
// Tech stack: PROPOSED (P-021). Uses node-postgres (pg).

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

// Track every Pool created so callers can close them deterministically.
const createdPools = new Set<Pool>();

export function createDb(connectionString: string): { db: Db; pool: Pool } {
  const pool = new Pool({ connectionString });
  createdPools.add(pool);
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export async function closeDb(pool: Pool): Promise<void> {
  createdPools.delete(pool);
  try {
    await pool.end();
  } catch {
    // already closed; ignore
  }
}

export function getCreatedPools(): Pool[] {
  return [...createdPools];
}
