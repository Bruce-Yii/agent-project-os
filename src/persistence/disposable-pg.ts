// Disposable PostgreSQL test lifecycle for WP1-A (Gate 0 safety redesign).
//
// Uses @testcontainers/postgresql to create a per-run isolated container.
// The container is created exclusively by the test process; connection info
// comes ONLY from the container handle — no ambient DATABASE_URL/ADMIN_URL fallback.
//
// Safety invariants:
// 1. Container is created by test process (not user-supplied).
// 2. Connection URI comes from container.getConnectionUri() (not env vars).
// 3. No ambient DATABASE_URL / WP1A_TEST_DB / ADMIN_URL fallback.
// 4. No withReuse() — each test run gets a fresh container.
// 5. Container is stopped in after() even on failure.
// 6. No DROP DATABASE ... WITH (FORCE) or admin URL construction.
//
// Usage:
//   const pg = await startDisposablePg();
//   // use pg.connectionUri for Pool/Drizzle
//   await pg.stop();

import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export interface DisposablePg {
  container: StartedPostgreSqlContainer;
  connectionUri: string;
  database: string;
  username: string;
  password: string;
  port: number;
  stop: () => Promise<void>;
}

/**
 * Start a disposable PostgreSQL container for testing.
 * Fails closed if Docker is unavailable.
 */
export async function startDisposablePg(
  opts?: { image?: string; database?: string; username?: string; password?: string }
): Promise<DisposablePg> {
  const image = opts?.image ?? "postgres:17-alpine";
  const container = new PostgreSqlContainer(image);

  if (opts?.database) container.withDatabase(opts.database);
  if (opts?.username) container.withUsername(opts.username);
  if (opts?.password) container.withPassword(opts.password);

  const started = await container.start();

  const connectionUri = started.getConnectionUri();
  const stop = async () => {
    await started.stop();
  };

  return {
    container: started,
    connectionUri,
    database: started.getDatabase(),
    username: started.getUsername(),
    password: started.getPassword(),
    port: started.getPort(),
    stop,
  };
}
