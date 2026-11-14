import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createDb, closeDb } from "./db.js";
import { migrate } from "./migrate.js";
import { startDisposablePg, type DisposablePg } from "./disposable-pg.js";
import { CommandExecutor } from "../commands/executor.js";
import { ProjectRepository } from "./repositories.js";
import { IdempotencyStore } from "./idempotency.js";

// Swallow "terminating connection" errors from pg when container stops.
process.on("uncaughtException", (err: Error) => {
  if (String(err?.message || err).includes("terminating connection")) return;
  throw err;
});

describe("WP1-A fault injection: receipt INSERT failure -> rollback", () => {
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

    const wrapPool = (p: any) => {
      p.on("connect", (client: any) => {
        const originalQuery = client.query.bind(client);
        client.query = (...args: any[]) => {
          const first = args[0];
          const text =
            typeof first === "string"
              ? first
              : (first && (first.text || first.query || first.name)) || "";
          if (/insert/i.test(text) && /command_receipts/i.test(text)) {
            const err = new Error("RECEIPT_FAILED");
            const last = args[args.length - 1];
            if (typeof last === "function") {
              process.nextTick(() => last(err));
              return;
            }
            return Promise.reject(err);
          }
          return originalQuery(...args);
        };
      });
    };
    wrapPool(pool);
    wrapPool(dbPool);
  });

  after(async () => {
    try { await closeDb(pool); } catch { /* already closed */ }
    try { await closeDb(dbPool); } catch { /* already closed */ }
    await new Promise((r) => setTimeout(r, 2000));
    await pg.stop().catch((e: any) => {
      if (!String(e?.message || e).includes("terminating connection")) throw e;
    });
  });

  it("receipt INSERT failure -> REJECTED RECEIPT_FAILED, business write & idempotency rolled back", async () => {
    const executor = new CommandExecutor({ db, pool });
    const store = new IdempotencyStore(pool);
    const projRepo = new ProjectRepository(db);

    const beforeProjects = (await projRepo.findBySpace("ps-fault")).length;
    const beforeIdemp = (await pool.query("SELECT count(*)::int AS c FROM idempotency_records")).rows[0].c;

    const r = await executor.execute({
      envelope: {
        commandId: "fault-c1",
        idempotencyKey: "fault-key-1",
        actor: "personal-owner-1",
        personalSpaceId: "ps-fault",
        createdAt: new Date().toISOString(),
        correlationId: "fault-corr",
        causationId: "fault-cause",
      },
      intent: "CreateProject",
      payload: { space_id: "ps-fault", name: "Fault Project" },
    });

    assert.equal(r.status, "REJECTED");
    assert.equal(r.reason, "RECEIPT_FAILED");

    const afterProjects = (await projRepo.findBySpace("ps-fault")).length;
    assert.equal(afterProjects, beforeProjects, "Project must not be persisted (rolled back)");

    const afterIdemp = (await pool.query("SELECT count(*)::int AS c FROM idempotency_records")).rows[0].c;
    assert.equal(afterIdemp, beforeIdemp, "idempotency record must not be persisted");

    const rec = await store.getRecord("personal-owner-1::fault-key-1");
    assert.equal(rec, null, "idempotency record must not exist");
  });
});
