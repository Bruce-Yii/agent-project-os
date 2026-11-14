# Independent Module Acceptance Review — WP1-A @ 01901b23

**Reviewer**: wp1a-module-review (independent subagent, delegated by lead)
**Date**: 2026-11-14
**SHA reviewed**: `01901b23b8b12e9e7affa397cfc7710c15203a47`
**Branch**: `feat/wp1a-safety-integration`
**CI**: 8/8 PASS (run 43537538855)

---

## 0. Scope and method

This review closes the three test gaps identified in the prior
`docs/review/wp1a-independent-review-bdce28ff.md` (Module Acceptance:
CONDITIONAL PASS). For each new test I read the test source and the production
code it exercises, then checked that the test (a) exercises the real code path
it claims, (b) cannot pass on a vacuous/incorrect implementation, and (c) asserts
the promised invariant. I also re-ran the full required verification locally.

Files reviewed:

- `src/persistence/receipts.test.ts` (fault injection)
- `tests/wp1a/concurrent.test.ts` (concurrent writer)
- `src/persistence/idempotency.test.ts` (pool-path conflict)
- `src/persistence/receipts.ts`
- `src/persistence/idempotency.ts`
- `src/commands/executor.ts`

---

## A. Gate 0 Test Safety (carried forward)

Unchanged from the prior review: disposable-container isolation, no ambient DB
URL fallback, no `--test-force-exit`, pool tracking all still hold at this SHA.
Gate 0 Test Safety remains **PASS**.

---

## B. WP1-A Module Acceptance

### B.1 Fault injection — receipt INSERT failure -> rollback

**Test**: `src/persistence/receipts.test.ts:66-99`
("receipt INSERT failure -> REJECTED RECEIPT_FAILED, business write &
idempotency rolled back").

Claim verification:

1. **Does it actually mock the pool to throw on receipt INSERT?** Yes.
   - `wrapPool` is installed on both `pool` and `dbPool` at `before()` time
     (`receipts.test.ts:53-54`), intercepting each client's `query` on
     `"connect"` (`receipts.test.ts:32-51`).
   - The predicate requires `/insert/i` **and** `/command_receipts/i`
     (`receipts.test.ts:40`), so only the receipt INSERT is faulted; project and
     idempotency inserts are not.
   - The mock handles both pg calling conventions: callback form via
     `process.nextTick(() => last(err))` (`receipts.test.ts:43-45`) and
     promise form via `Promise.reject(err)` (`receipts.test.ts:47`). The
     drizzle transactional path uses the callback form and the test observed
     `RECEIPT_FAILED`, confirming the fault actually fired.
2. **Does it verify transaction rollback (Project not persisted)?** Yes.
   - `beforeProjects` captured before execution
     (`receipts.test.ts:71`); `afterProjects` compared with `assert.equal`
     (`receipts.test.ts:92`).
   - Idempotency rollback verified two ways: global count unchanged
     (`receipts.test.ts:72,94-95`) and `store.getRecord(...)` returns `null`
     (`receipts.test.ts:97-98`).
   - Result contract verified: `r.status === "REJECTED"` and
     `r.reason === "RECEIPT_FAILED"` (`receipts.test.ts:88-89`).

Production path exercised: `CommandExecutor.execute` runs `runInTransaction`
(`executor.ts:97`); the handler persists the Project inside that transaction;
`receiptRecorder.record(..., tx)` calls `tx.execute(INSERT ... command_receipts)`
(`receipts.ts:53-57`, `executor.ts:131-144`); the thrown `RECEIPT_FAILED` aborts
the transaction. The outer catch extracts the underlying cause message
(`executor.ts:155-160`) so the caller sees `RECEIPT_FAILED` rather than a
drizzle wrapper message. Because the transaction rolls back, neither the
Project row nor the idempotency row survives.

Verdict for B.1: **PASS** (real fault, real rollback, real assertions).

### B.2 Concurrent writer — simultaneous replay -> exactly-one side effect

**Test**: `tests/wp1a/concurrent.test.ts:41-82`.

Claim verification:

1. **Does it actually run two executors concurrently?** Yes.
   - Two distinct `CommandExecutor` instances share one `db`/`pool`
     (`concurrent.test.ts:42-43`).
   - Both `execute()` calls are issued in a single `Promise.all`
     (`concurrent.test.ts:67-70`), so they overlap rather than run sequentially.
2. **Does it verify exactly-one side effect?** Yes.
   - Both results must be `OK` (`concurrent.test.ts:72-73`).
   - Both must return the same `projectId` (`concurrent.test.ts:74-75`).
   - Project row count must increase by exactly one
     (`concurrent.test.ts:77-78`).
   - Exactly one row carries the returned `projectId`
     (`concurrent.test.ts:80-81`).

Production path exercised: each executor runs its own `runInTransaction`
(`executor.ts:97`); both pass the idempotency `getRecord` check before either
commits; both attempt `CreateProject`; the idempotency INSERT uses
`ON CONFLICT (idempotency_key) DO NOTHING RETURNING` (`idempotency.ts:82-85`),
so the loser gets zero returned rows and throws `IDEMPOTENCY_CONFLICT`
(`idempotency.ts:88-91`); that throw aborts and rolls back the loser's
transaction (project + receipt), while the outer catch replays the winner's
stored result (`executor.ts:161-168`). Net effect: one Project, one receipt, one
idempotency record.

Verdict for B.2: **PASS** (genuine concurrency, genuine single side effect).

### B.3 Pool-path conflict — non-transactional path

**Test**: `src/persistence/idempotency.test.ts:31-56`.

Claim verification:

1. **Does it actually test the non-transactional path?** Yes.
   - Store created via `createIdempotencyStore(pool)` (`idempotency.test.ts:32`)
     with no transaction argument.
   - `store.set("k1", "actor-1", { foo: 1 }, "payloadA")` passes a string as
     `payloadOrTx` (`idempotency.test.ts:34`), so `transaction` stays
     `undefined` and the `if (transaction)` branch (`idempotency.ts:80`) is
     skipped; execution goes through the `if (!this.pool) return;` pool branch
     (`idempotency.ts:95-126`).
2. **Does it verify the original record is unchanged?** Yes.
   - `before` snapshot of `result`/`payload` (`idempotency.test.ts:36-39`).
   - `assert.rejects` requires `err.message === "IDEMPOTENCY_CONFLICT"`
     (`idempotency.test.ts:41-50`).
   - `after` snapshot re-checked for both `result` (`{ foo: 1 }`) and
     `payload` (`"payloadA"`) (`idempotency.test.ts:52-55`).

Production path exercised: pool branch SELECTs the existing row
(`idempotency.ts:96-98`), extracts the stored payload (`idempotency.ts:101-109`),
compares `existingPayload !== payload` (`idempotency.ts:112-115`), and throws
`IDEMPOTENCY_CONFLICT` (`idempotency.ts:116-118`) **before** any INSERT, so the
original row cannot be overwritten.

Verdict for B.3: **PASS** (true non-transactional path, original preserved).

### B.4 Production code paths exercised (summary)

| Acceptance claim (docs/46 §8) | Evidence |
|---|---|
| Same key/same payload -> one effect | `concurrent.test.ts` (same payload), `contract.test.ts` "duplicate command" |
| Same key/different payload -> CONFLICT | `idempotency.test.ts`, `executor.ts:99-103` |
| Stale version / unauthorized / illegal transition -> zero mutation | `contract.test.ts` (multiple) |
| Concurrent writers preserve invariants | `concurrent.test.ts` |
| Mid-transaction failure preserves invariants | `receipts.test.ts` |
| Migrations from empty, disposable PG | `migrate.test.ts`, `persistence.test.ts` |
| Process-level crash/restart | `restart.test.ts` |
| Clean checkout build/test | typecheck + build + test:db (below) |

### B.5 Verdict

All three previously identified test gaps are now closed by tests that exercise
the real production paths and assert the promised invariants, and they pass on
the reviewed SHA. The remaining Module Acceptance criteria from `docs/46 §8`
(receipt/state/versions preserved across restart, negative paths with zero
mutation, clean checkout) are covered by the pre-existing contract/restart/
persistence suites, which also pass.

**WP1-A Module Acceptance Verdict: PASS**

---

## C. Evidence

### Commands run (all on SHA 01901b23)

```
npm run typecheck  -> PASS (0 errors)            [exit 0]
npm run build      -> PASS (tsc)                 [exit 0]
npm run test:db    -> 31/31 PASS, 8 suites, 0 fail, 0 skip, 0 cancelled  [exit 0]
npm test           -> 6/6 PASS, 1 suite          [exit 0]
```

Breakdown of the `test:db` run:

- WP1-A command contract (product code): 10 + 11 cases
- WP1-A pool-path idempotency conflict: 1 case
- WP1-A migrations: 2 cases
- WP1-A persistence (PostgreSQL): 6 cases
- WP1-A fault injection: 1 case
- WP1-A concurrent writer: 1 case
- WP1-A command contract (product code, tests/wp1a): 11 cases
- WP1-A restart recovery (separate process): 1 case

Total: 31 tests, 8 suites, duration ~53 s.

### CI

- Run 43537538855: 8/8 PASS (on the reviewed SHA).

---

## D. Remaining blockers

None for the three previously identified gaps.

### Residual risks (non-blocking, owned)

1. **Pool-path concurrency not exercised.** `idempotency.test.ts` is sequential.
   The pool branch (`idempotency.ts:95-126`) performs SELECT-then-INSERT without
   `ON CONFLICT DO NOTHING`; under true concurrency a duplicate-key violation
   from Postgres is possible. This path is a non-transactional fallback; the
   transactional path (used by `CommandExecutor`) is the concurrency-safe one
   and is covered by `concurrent.test.ts`. Recommend a future test or an
   `ON CONFLICT DO NOTHING` guard on the pool INSERT for symmetry.
2. **Fault-injection mock is pattern-based.** It keys on
   `/insert/i && /command_receipts/i` (`receipts.test.ts:40`). It passed on
   this SHA, proving the mock fired, but a future drizzle query-shape change
   could silently bypass it. The assertion `r.reason === "RECEIPT_FAILED"`
   (`receipts.test.ts:89`) is the real guard; keep it.
3. **Concurrent test checks project cardinality only.** It does not assert
   receipt/idempotency counts, but the production mechanism (transactional
   rollback of the loser) makes those follow from the project assertion. A
   future hardening pass could add those counts.

None of these block Module Acceptance; they are tracked as follow-ups.

---

## E. Claim-to-evidence matrix (this review)

| Claim | Expected observation | Actual observation | Evidence |
|---|---|---|---|
| Receipt INSERT failure rolls back Project + idempotency | `REJECTED`/`RECEIPT_FAILED`, counts unchanged, `getRecord===null` | Matches | `receipts.test.ts:88-98`, local run |
| Two concurrent executors -> one Project, same id | both `OK`, same `projectId`, count +1 | Matches | `concurrent.test.ts:72-81`, local run |
| Pool-path same-key/diff-payload -> `IDEMPOTENCY_CONFLICT`, original unchanged | throws with exact message; result/payload unchanged | Matches | `idempotency.test.ts:41-55`, local run |

**Overall verdict: PASS (Module Acceptance).**