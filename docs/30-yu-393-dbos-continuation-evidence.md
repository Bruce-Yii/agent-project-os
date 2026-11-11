# 30 — YU-393 DBOS Continuation Evidence

**Status:** PARTIAL (subagent-reported; needs independent verification of raw outputs).
**Issue:** YU-393 (G3-S1). **Date:** 2026-11-12.
**Supplements:** docs/26 (happy path + crash recovery).

## 1. Upstream facts

- Package: `@dbos-inc/dbos-sdk` v5.5.0 (MIT). Dependencies: pg ^8.11.3, yaml, commander, superjson, serialize-error.

- PostgreSQL 17.11 host instance (`D:\12412\PostgreSQL`).

## 2. Tests performed (subagent-reported)

### 2.1 Idempotency — PASS

- Same workflow ID started twice returns recorded result; side_effects count = 1.

- Idempotency key dedup verified.

### 2.2 Outbox replay — PASS

- Step re-ran after crash; idempotent `INSERT ... ON CONFLICT` kept count = 1.

- At-least-once step execution with idempotent handler confirmed.

### 2.3 Workflow version upgrade — PASS

- Old in-flight workflow orphaned under new application version (status PENDING, not recovered).

- Recoverable under old version. Version management must be explicit.

### 2.4 Connection pool — PASS

- Pool size 2: 49 connection timeouts, ~10x latency vs pool size 10 (0 timeouts).

- All 40 workflows completed eventually.

- Conclusion: pool sizing is critical; default may be insufficient for concurrent load.

### 2.5 Disconnect/reconnect — PASS (simulated)

- PG service could not be stopped (no admin rights); simulated via TCP proxy outage.

- DBOS retried during outage; workflow ended SUCCESS after reconnect.

- Real service restart test still needed (NOT TESTED with actual service stop).

## 3. Limitations

- Disconnect test was simulated, not a real PG service restart.

- Idempotency/Outbox tested with simple handlers; complex multi-step transactions not covered.

- Version upgrade tested with same code (version hash change via trivial edit); real schema migration not tested.

## 4. Conclusion

**ADOPT with conditions:**

- Idempotent handlers required (at-least-once step execution).

- Pool sizing must be configured for expected concurrency.

- Explicit versioning policy for recovery (orphaned workflows under new version).

- Real PG service restart test still needed.

DBOS does not become Canonical Authority for Project/Task/Run (per YU-392 scope). It is a durable-workflow candidate behind `DurableWorkflowPort`.
