import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, closeDb } from "../../src/persistence/db.js";
import { migrate } from "../../src/persistence/migrate.js";
import { startDisposablePg, type DisposablePg } from "../../src/persistence/disposable-pg.js";
import { CommandExecutor } from "../../src/commands/executor.js";
import { ProjectRepository } from "../../src/persistence/repositories.js";

const OWNER = "personal-owner-1";

process.on("uncaughtException", (err: Error) => {
  if (String(err?.message || err).includes("terminating connection")) return;
  throw err;
});

describe("WP1-A concurrent writer: simultaneous replay -> exactly-one side effect", () => {
  let pg: DisposablePg;
  let pool: any;
  let dbPool: any;
  let db: any;

  before(async () => {
    pg = await startDisposablePg();
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: pg.connectionUri });
    await migrate(pg.connectionUri);
    const result = createDb(pg.connectionUri);
    db = result.db;
    dbPool = result.pool;
  });

  after(async () => {
    try { await closeDb(pool); } catch { /* already closed */ }
    try { await closeDb(dbPool); } catch { /* already closed */ }
    await new Promise((r) => setTimeout(r, 2000));
    await pg.stop().catch((e: any) => {
      if (!String(e?.message || e).includes("terminating connection")) throw e;
    });
  });

  it("two executors same idempotency key -> one Project row, same projectId", async () => {
    const executor1 = new CommandExecutor({ db, pool });
    const executor2 = new CommandExecutor({ db, pool });
    const projRepo = new ProjectRepository(db);

    const beforeCount = (await projRepo.findBySpace("ps-concurrent")).length;

    const envelopeBase = {
      actor: OWNER,
      personalSpaceId: "ps-concurrent",
      createdAt: new Date().toISOString(),
      correlationId: "concurrent-corr",
      causationId: "concurrent-cause",
    };

    const cmd1 = {
      envelope: { ...envelopeBase, commandId: "cc-1", idempotencyKey: "concurrent-key-1" },
      intent: "CreateProject" as const,
      payload: { space_id: "ps-concurrent", name: "Concurrent Project" },
    };
    const cmd2 = {
      envelope: { ...envelopeBase, commandId: "cc-2", idempotencyKey: "concurrent-key-1" },
      intent: "CreateProject" as const,
      payload: { space_id: "ps-concurrent", name: "Concurrent Project" },
    };

    const [r1, r2] = await Promise.all([
      executor1.execute(cmd1 as any),
      executor2.execute(cmd2 as any),
    ]);

    assert.equal(r1.status, "OK");
    assert.equal(r2.status, "OK");
    assert.ok(r1.projectId, "first result must have projectId");
    assert.equal(r2.projectId, r1.projectId, "both must return same projectId");

    const after = await projRepo.findBySpace("ps-concurrent");
    assert.equal(after.length, beforeCount + 1, "exactly one Project row created");

    const matching = after.filter((p: any) => p.id === r1.projectId);
    assert.equal(matching.length, 1, "no duplicate side effects");
  });
});
