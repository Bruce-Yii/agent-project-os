import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { migrate } from "./migrate.js";
import { startDisposablePg, type DisposablePg } from "./disposable-pg.js";
import { IdempotencyStore, createIdempotencyStore } from "./idempotency.js";

process.on("uncaughtException", (err: Error) => {
  if (String(err?.message || err).includes("terminating connection")) return;
  throw err;
});

describe("WP1-A pool-path idempotency conflict", () => {
  let pg: DisposablePg;
  let pool: Pool;

  before(async () => {
    pg = await startDisposablePg();
    pool = new Pool({ connectionString: pg.connectionUri });
    await migrate(pg.connectionUri);
  });

  after(async () => {
    await pool.end().catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await pg.stop().catch((e: any) => {
      if (!String(e?.message || e).includes("terminating connection")) throw e;
    });
  });

  it("same key different payload on pool path throws IDEMPOTENCY_CONFLICT and leaves original unchanged", async () => {
    const store = createIdempotencyStore(pool);

    await store.set("k1", "actor-1", { foo: 1 }, "payloadA");

    const before = await store.getRecord("k1");
    assert.ok(before, "record should exist");
    assert.deepEqual(before!.result, { foo: 1 });
    assert.equal(before!.payload, "payloadA");

    await assert.rejects(
      async () => {
        await store.set("k1", "actor-1", { foo: 2 }, "payloadB");
      },
      (err: any) => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, "IDEMPOTENCY_CONFLICT");
        return true;
      },
    );

    const after = await store.getRecord("k1");
    assert.ok(after, "record should still exist");
    assert.deepEqual(after!.result, { foo: 1 }, "original result unchanged");
    assert.equal(after!.payload, "payloadA", "original payload unchanged");
  });
});
