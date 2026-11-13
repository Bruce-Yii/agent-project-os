# WP1-A Safety Reuse Map (DRAFT — upstream facts UNVERIFIED)

**Owner:** W0-RECOVERY (research; no code changes yet)
**Date:** 2026-11-13
**Status:** UNVERIFIED upstream facts (web search unavailable). Testcontainers PostgreSQL is a CANDIDATE, not an adopted decision.
**Source:** WP1-A branch `feat/wp1a-personal-project-foundation` @ `b6b828af66b239e3a827b962bfa5d5b83b61ff61` (read-only inspection).

## 1. Destructive callsite census (CONFIRMED from source)

### Unguarded DROP (Gate 0 blocker)
| File | Lines | Statement | In package.json test list? |
|---|---|---|---|
| `src/commands/contract.test.ts` | 23-29 | 7× `DROP TABLE IF EXISTS ... CASCADE` | **NO** — omitted from `test` script |
| `src/persistence/migrate.test.ts` | 30-36 | 6× `DROP TABLE ... CASCADE` (inside migration) | Yes |
| `src/persistence/migrate.test.ts` | 43 | `DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)` | Yes |

### Admin path
| File | Line | Statement |
|---|---|---|
| `src/persistence/migrate.test.ts` | 13 | `ADMIN_URL = DB_URL.replace(/wp1a_migrate_test\|wp1a_test/, "postgres")` — replaces DB name with "postgres" (admin DB) |
| `src/persistence/migrate.test.ts` | 21, 42 | `new Pool({ connectionString: ADMIN_URL })` — admin connection |
| `src/persistence/migrate.test.ts` | 24 | `CREATE DATABASE ${TEST_DB}` |
| `src/persistence/migrate.test.ts` | 43 | `DROP DATABASE ... WITH (FORCE)` |

### Broad DELETE (guarded by prefix check only)
| File | Lines | Statements |
|---|---|---|
| `src/persistence/persistence.test.ts` | 26-34 | 9× `DELETE FROM ...` (all tables) |
| `tests/wp1a/contract.test.ts` | 31-39 | 9× `DELETE FROM ...` (all tables) |
| `src/persistence/receipts.ts` | 95 | `DELETE FROM command_receipts` (production code path) |

### Test guard (current, REJECTED)
| File | — | `src/test-guard.ts` |
|---|---|---|
| Design | prefix + optional nonce | `ALLOWED_DB_PREFIXES = ["wp1a_test", "wp1a_migrate_test", "wp1a_contract_test"]` |
| Flaw | `dbName.startsWith(prefix)` passes `wp1a_test_production` | Nonce only checked `if (nonce && ...)` — optional |
| Flaw | No proof the DB was created by this run | Name substring ≠ ownership |

### package.json test script
```
"test": "npm run build && node --test ... dist/src/tests/domain.test.js dist/src/persistence/persistence.test.js dist/src/persistence/migrate.test.js dist/tests/wp1a/contract.test.js dist/tests/wp1a/restart.test.js"
```
**Omitted:** `src/commands/contract.test.ts` (contains 7 unguarded DROP CASCADE).

## 2. Candidate: Testcontainers PostgreSQL

**Status: UNVERIFIED.** Web search unavailable. The following must be confirmed by a worker with network access before any adoption decision.

| Field | Value | Confidence |
|---|---|---|
| Package name | `@testcontainers/postgresql` (npm) — **UNVERIFIED** | UNKNOWN |
| Current stable version | UNKNOWN (must check npm registry) | UNKNOWN |
| License | UNKNOWN (must check package.json + transitive) | UNKNOWN |
| Source repo | https://github.com/testcontainers/testcontainers-node (inferred) | INFERRED |
| API: start container | `new PostgreSQLContainer("postgres:16").start()` (inferred from docs) | INFERRED |
| API: connection string | `.getConnectionString()` (inferred) | INFERRED |
| API: stop | `.stop()` (inferred) | INFERRED |
| Transitive deps | UNKNOWN | UNKNOWN |
| Maintenance status | UNKNOWN (last release date) | UNKNOWN |

### What must be verified before adoption
1. Exact package name and latest stable version on npm registry.
2. License (SPDX) of the package AND all transitive dependencies.
3. Whether it supports the Node 26 LTS runtime and pnpm 12.19.0.
4. Whether it requires Docker (and whether Docker is available in CI — GitHub Actions runners have Docker).
5. Whether it can provide a per-run isolated PostgreSQL instance with automatic cleanup.
6. Whether `getConnectionString()` returns a URL usable by the existing `pg` Pool and Drizzle.
7. Whether it supports custom database name / username / password for test isolation.

### Integration method (proposed, pending verification)
- **Method:** ADAPT (direct import of `@testcontainers/postgresql` + thin glue)
- **Glue surface:** New file `src/test/db-lifecycle.ts` (~50 lines) wrapping container start/stop/getConnectionString. Replace `verifyDisposableDb` usage in test files with container-managed lifecycle.
- **Files to modify:** `src/persistence/migrate.test.ts`, `src/persistence/persistence.test.ts`, `src/commands/contract.test.ts`, `tests/wp1a/contract.test.ts`, `package.json` (add dependency + test entries).
- **Rollback:** Remove dependency from package.json, revert test files to use manual DB_URL (but keep guard). No production code affected.

### If Testcontainers is incompatible
- Alternate candidate: `pg-mem` (in-memory PostgreSQL emulator) — but it does not test real PG behavior (migrations, CASCADE, etc.), so it is a weaker oracle.
- Alternate candidate: Docker Compose test fixture with per-run DB name + nonce — but this is still self-managed, not a mature module.
- If no mature module fits, submit a BUILD exception request to Coordinator with concrete reproducer.

## 3. Negative preflight design (before any destructive integration)

Run these non-destructive checks first. They must pass with zero data changes on any target.

| # | Test | Target | Expected |
|---|---|---|---|
| N1 | Guard refuses DB without `WP1A_TEST_OPT_IN=true` | any DB | `{ ok: false }`, zero queries executed |
| N2 | Guard refuses DB without `DATABASE_URL`/`WP1A_TEST_DB` | any DB | `{ ok: false }` |
| N3 | Guard refuses non-prefixed DB (e.g., `postgres`, `mydb`) | real PG | `{ ok: false }`, zero data change |
| N4 | Guard refuses same-prefix but unowned DB (e.g., `wp1a_test_production`) | real PG | `{ ok: false }` (name prefix ≠ ownership) |
| N5 | Guard refuses when nonce set but DB name lacks it | real PG | `{ ok: false }` |
| N6 | All committed test files discoverable by CI | package.json | `src/commands/contract.test.ts` included |
| N7 | No `DROP DATABASE ... WITH (FORCE)` on non-container DB | code audit | only inside container lifecycle |
| N8 | Container cleanup on test failure | integration | container removed after failure |

## 4. Gate 0 completion definition (per docs/47 §6)

- [ ] Mature module adopted with upstream version/license/API evidence (CONFIRMED, not INFERRED)
- [ ] All destructive callsites inventoried (this document §1)
- [ ] Per-run isolated resource with ownership proof
- [ ] Negative preflight zero side-effects (N1-N8)
- [ ] CI exact job/test discovery including previously omitted file
- [ ] Independent reviewer verdict (not self-pass)

**Gate 0 remains REJECTED until Coordinator independently verifies.**
