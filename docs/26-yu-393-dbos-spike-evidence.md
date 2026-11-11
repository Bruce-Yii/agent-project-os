# 26 — YU-393 DBOS Durable Workflow Spike — Evidence Report

**Status:** PARTIAL (crash recovery verified; idempotency/Outbox/version-upgrade not yet tested).
**Issue:** YU-393 (G3-S1). **Owner:** W0 (spike executor: local W0).
**Date:** 2026-11-12.

## 1. Upstream facts (verified)

- Package: `@dbos-inc/dbos-sdk` v5.5.0 (npm).
- License: MIT (verified via `npm view`).
- Homepage: <https://docs.dbos.dev/>
- Source: <https://github.com/dbos-inc/dbos-transact-ts>
- Dependencies: `pg ^8.11.3`, `yaml ^2.8.3`, `commander ^12.0.0`, `superjson ^1.13.3`, `serialize-error ^8.1.0`.
- Node engine: current (v24.16.0 host) accepted by package.
- Requires PostgreSQL as system database.

## 2. Environment

- Host: Windows; Node 24.16.0; PostgreSQL 17.11 at `D:\12412\PostgreSQL`, service `postgresql-x64-17` (Running).
- Test database: `dbos_spike` (disposable, created/dropped via psql; not part of product).
- Connection: `postgresql://postgres:<redacted>@127.0.0.1:5432/dbos_spike` (password used only in temporary env, not stored).

## 3. Tests performed

### 3.1 Happy path (PASS)

Command: `node spike.js` (isolated dir `temp/2026-11-12-yu-393-dbos-spike`).

Observed: DBOS ran system DB migrations; launched executor; workflow with two steps (`DBOS.runStep`) completed; result `{"r1":"step1-ok","r2":"step2-ok"}`; exit 0.

Evidence: stdout captured in spike run (step one completed, step two completed, workflow done, RESULT).

### 3.2 Crash recovery (PASS)

Harness: `crash-spike.js` — step1 fast, step2 sleeps 10s.
Run 1: process killed (Stop-Process) at ~4s while step2 sleeping. DBOS had checkpointed step1; step2 in progress.
Run 2 (restart, same app version): DBOS logged `Recovering 1 workflows from application version ...`; re-executed step2 (logged "Step two started; sleeping 10s" twice); completed with RESULT `{"r1":"step1-ok","r2":"step2-ok"}`; exit 0.
Conclusion: DBOS recovers in-progress workflows after crash and re-executes the in-progress step. **Steps are at-least-once, not exactly-once** — idempotency is the caller's responsibility. This matches the Notion requirement "never claim exactly-once delivery."

## 4. Limitations / caveats

- Step execution is at-least-once; in-progress step is re-run on recovery. Callers must make steps idempotent or use DBOS's recorded-result semantics.
- Deprecation warning from `pg`: "Calling client.query() when the client is already executing a query" (pg@9 future removal). Minor; track upstream.
- `DBOS.launch()` recovery uses application version hash; changing code changes version and may orphan in-flight workflows unless versioning is managed.
- Test DB is disposable; no production data touched.

## 5. Not yet tested (PARTIAL)

- Idempotency key behavior under duplicate command submission.
- Outbox/Inbox transactional write + replay.
- Version upgrade / migration on a populated system DB.
- Connection-pool exhaustion / retry.
- PostgreSQL connection failure and reconnection.

## 6. Recommendation

- **Candidate: ADAPT/WRAP behind `DurableWorkflowPort`** (per G2). MIT license, mature, Postgres-backed, fits the Project OS durable-workflow need.
- Condition: define idempotency contract for steps; version-management policy for recovery; pool config for production.
- Not a frozen decision until W0 ADR + impact review (per YU-392 scope item 1/4).

## 7. Evidence artifacts (local, not committed)

- `temp/2026-11-12-yu-393-dbos-spike/spike.js`, `crash-spike.js`
- stdout captures: `crash-out.txt`, `crash-out2.txt`
- Test DB: `dbos_spike` on local PG 17 (disposable).
