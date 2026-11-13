# WP1-A Safety Review — Independent Adversarial Analysis

**Reviewer:** D1-SAFETY-REVIEW (independent, no shared code changes)
**Date:** 2026-11-13
**Target:** `feat/wp1a-safety-integration` @ `ef5c70c`
**Base reviewed against:** recovery branch `69c21e8` + quarantined WP1-A `b6b828a`

## Verdict: CONDITIONALLY PASS — non-destructive checks only

Docker is unavailable locally. Destructive integration tests (test:db) have NOT been executed. Gate 0 remains REJECTED pending Coordinator approval after CI runs.

## Non-destructive preflight results

### N1: Legacy guard retirement ✅ PASS
- `src/test-guard.ts` does not exist (deleted).
- No source file imports `assertDisposableDb` or `verifyDisposableDb`.
- No reference to `WP1A_TEST_OPT_IN` in src/ or tests/.
- **Adversarial check:** Searched all .ts files including node_modules exclusion — confirmed absent.

### N3: No ambient DATABASE_URL fallback in tests ✅ PASS (with one scoped exception)
- `src/persistence/migrate.test.ts`: No `process.env.DATABASE_URL` or `WP1A_TEST_DB`. Uses `pg.connectionUri` from container. ✅
- `src/persistence/persistence.test.ts`: No env var access. Uses `pg.connectionUri`. ✅
- `src/commands/contract.test.ts`: No env var access. Uses `pg.connectionUri`. ✅
- `tests/wp1a/contract.test.ts`: No env var access. Uses `pg.connectionUri`. ✅
- `tests/wp1a/restart.test.ts`: Uses `WP1A_TEST_DB_URL` env var **BUT** this is set by the parent test from `pg.connectionUri` (line 56: `const env = { ...process.env, WP1A_TEST_DB_URL: dbUrl }`). The child process receives the container's URI, not an ambient fallback. ✅ (scoped exception — documented)
- **Adversarial check:** Verified that no test reads `process.env.DATABASE_URL` or `process.env.WP1A_TEST_DB` directly. The only env var used is `WP1A_TEST_DB_URL`, which is always set from the container handle.

### N6: Test discovery completeness ✅ PASS
- `package.json` test script: `npm run build && node --test ... dist/src/tests/domain.test.js` (domain only, no DB)
- `package.json` test:db script: `npm run build && node --test ... dist/src/persistence/persistence.test.js dist/src/persistence/migrate.test.js dist/src/commands/contract.test.js dist/tests/wp1a/contract.test.js dist/tests/wp1a/restart.test.js`
- All 5 DB test files are included. Previously omitted `src/commands/contract.test.ts` is now included. ✅
- **Adversarial check:** Compared file list against actual test files in dist/ — all present.

### N7: No destructive DB operations ✅ PASS
- No `DROP DATABASE ... WITH (FORCE)` in any source file.
- No `CREATE DATABASE` in any source file.
- No `DROP TABLE ... CASCADE` in any source file.
- No `ADMIN_URL` construction in any source file.
- **Adversarial check:** Searched all .ts and .sql files for DROP/CREATE/ADMIN — confirmed absent except in comments and migrations (schema DDL, not test operations).

### N8: Container cleanup on failure ✅ PASS (code review)
- `disposable-pg.ts`: `stop()` calls `started.stop()`.
- All test files call `await pg.stop().catch(() => {})` in `after()` / `finally`.
- **Adversarial check:** Verified that `after()` runs even if tests fail (node:test guarantees this). Container will be stopped.
- **Potential issue:** If the test process is killed (SIGKILL), `after()` won't run and the container may leak. Testcontainers has a Ryuk reaper container that cleans up orphaned containers, but this requires Docker and Ryuk to be running. **Recommendation:** Document this as a known limitation; CI runs are ephemeral so leaks are acceptable.

## Additional adversarial checks

### A1: No withReuse() ✅ PASS
- `disposable-pg.ts` does not call `withReuse()`. Each test run gets a fresh container. ✅

### A2: Connection URI only from container ✅ PASS
- All test files use `pg.connectionUri` from `startDisposablePg()`. No external connection string accepted. ✅

### A3: No user-supplied DB ✅ PASS
- `startDisposablePg()` creates a container; there is no parameter for an external connection string. ✅
- **Adversarial check:** Verified that `startDisposablePg` only accepts optional image/database/username/password overrides, not a connection URL.

### A4: Container image pinned ✅ PASS (with caveat)
- Default image: `postgres:17-alpine`. This is a mutable tag (could change).
- **Recommendation:** Pin to a specific digest for reproducibility (e.g., `postgres:17-alpine@sha256:...`). This is a minor improvement, not a blocker.

### A5: TypeScript compilation ✅ PASS
- `tsc --noEmit`: 0 errors.
- `npm run build`: PASS.

### A6: Domain tests ✅ PASS
- `npm run test`: 6/6 pass (domain model tests, no DB needed).

### A7: DB tests (test:db) ⚠️ NOT RUN
- Requires Docker (not available locally).
- CI workflow includes `npm run test:db` on ubuntu-latest (has Docker).
- **Status:** PENDING CI execution.

## Destructive integration test gate (NOT YET APPROVED)

The following destructive tests are disabled until Coordinator approval:
- `migrate.test.ts`: `migrate()` creates tables, applies migrations
- `persistence.test.ts`: CRUD operations
- `contract.test.ts`: Command execution (creates projects, tasks, etc.)
- `tests/wp1a/contract.test.ts`: Command contract tests
- `tests/wp1a/restart.test.ts`: Process spawn + DB write + restart

These tests will run on GitHub Actions (ubuntu-latest) with Docker available. They must be reviewed by Coordinator before the destructive integration test stage is approved.

## Summary

| Check | Result |
|---|---|
| N1 (guard retired) | ✅ PASS |
| N3 (no ambient fallback) | ✅ PASS |
| N6 (test discovery) | ✅ PASS |
| N7 (no destructive ops) | ✅ PASS |
| N8 (container cleanup) | ✅ PASS (code review) |
| A1 (no withReuse) | ✅ PASS |
| A2 (container-only URI) | ✅ PASS |
| A3 (no user-supplied DB) | ✅ PASS |
| A4 (image pinned) | ⚠️ mutable tag (minor) |
| A5 (typecheck) | ✅ PASS |
| A6 (domain tests) | ✅ PASS (6/6) |
| A7 (DB tests) | ⚠️ NOT RUN (no Docker) |

## Verdict

**CONDITIONALLY PASS** for non-destructive checks. Gate 0 remains REJECTED. Destructive integration tests pending Coordinator approval + CI execution.