# WP1-A Safety Reuse Map — Disposable PostgreSQL (VERIFIED 2026-11-13)

**Owner:** W0-RECOVERY research subagent. **No source modified.** WP1-A worktree inspected read-only.
**Supersedes:** earlier draft in this path whose upstream facts were marked UNVERIFIED. Every upstream claim below was fetched this session and is labelled.
**Labels:** `CONFIRMED` = read from upstream registry/repo source this session · `INFERRED` = reasoning, not fetched · `UNKNOWN` = not established.
**Target of record:** WP1-A `feat/wp1a-personal-project-foundation` @ `b6b828af66b239e3a827b962bfa5d5b83b61ff61`.

## 0. Verdict

**ADOPT `@testcontainers/postgresql` as a DIRECT devDependency (not a fork, not a wrapper of our own logic).** It is the only candidate reviewed whose *ownership proof is structural*: the connection URI is a handle returned by `start()`, bound to a random host port of a container the library created. Gate 0's objection — "prefix/nonce does not prove disposable ownership" — disappears because ownership is carried by an object, not by a name convention.

**The adoption is only valid if the ambient-env fallback is deleted.** Adding containers *alongside* `DATABASE_URL` fallback keeps the Gate-0 hole: any test that still reads `process.env.DATABASE_URL` can be pointed at a production database by the operator. The fix is subtraction, not addition (§3.2).

**One host caveat blocks local verification today** (§5.1): Docker daemon is not running on this machine. CI is unaffected.

## 1. Candidate facts (all CONFIRMED from registry/API, not memory)

| Field | Value | Evidence |
|---|---|---|
| Package | `@testcontainers/postgresql` | registry.npmjs.org |
| Current stable | **12.2.1** (`dist-tags.latest`) | `registry.npmjs.org/@testcontainers/postgresql/latest` |
| License (SPDX) | **MIT** | npm `license` field + GitHub API `license.spdx_id` |
| Source repo | <https://github.com/testcontainers/testcontainers-node> | npm `repository` |
| Published | package 12.2.1; release **v12.2.1 published 2026-10-13T09:46Z** | GitHub Releases API |
| Maintenance | repo pushed **2026-11-11**, not archived, 94 open issues | GitHub Repos API |
| Adoption signal | **2,641 stars / 286 forks** | GitHub Repos API |
| Direct deps of module | **1** (`testcontainers ^12.2.1`) | npm `dependencies` |
| Direct deps of core | **15** (dockerode, tar-fs, archiver, undici, docker-compose, get-port, …) | npm `dependencies` |
| Transitive tree | **174 package entries** (resolved on this host via `npm install --package-lock-only`) | local lockfile probe |
| Engine | core declares `node >= 22.22`; repo requires `>=24`, CI Node 26 → compatible | npm `engines` + `package.json` |
| Transitive license audit | **UNKNOWN** — not individually audited; devDependency-only, not shipped | — |

Tradeoff to record honestly: this repo advertises "no production dependencies beyond Drizzle + pg". Testcontainers adds **174 packages, dev-only**. It is the price of a structurally-safe test resource; it does not touch the runtime artifact.

## 2. Real API (CONFIRMED from released 12.2.1 type declarations)

`unpkg.com/@testcontainers/postgresql@12.2.1/build/postgresql-container.d.ts` and the module source (`packages/modules/postgresql/src/postgresql-container.ts`, gitHead `a3465510` = 12.2.1) show the real surface. **There is no `getConnectionString()` and no `PostgreSQLContainer` class** — the earlier draft's inferred names were wrong. Export is exactly two classes.

```ts
// tests/wp1a/support/disposable-pg.ts  — new file, ~25 lines, the only glue
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export interface DisposablePg { uri: string; adminUri: string; stop(): Promise<void>; }

export async function startDisposablePg(): Promise<DisposablePg> {
  const c: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:17-alpine")
    .withDatabase("wp1a_test")     // defaults: database/user/password all "test"
    .withUsername("test")
    .withPassword("test")
    .start();                      // waits on healthcheck + listening port; 120s startup timeout
  const uri = c.getConnectionUri(); // postgres://test:test@127.0.0.1:<mapped-port>/wp1a_test
  const u = new URL(uri); u.pathname = "/postgres";   // same container, maintenance DB
  return { uri, adminUri: u.toString(), stop: () => c.stop() };
}
```

Constructor takes the **image string as a required argument**; `start()` returns `StartedPostgreSqlContainer` extending `AbstractStartedContainer`, which supplies `stop()`, `getHost()`, `getMappedPort()`, `exec()`. Mapped port is random — that randomness *is* the ownership token. `snapshot()` / `restoreSnapshot()` exist (template-DB fast reset) but internally run `DROP DATABASE ... WITH (FORCE)`; acceptable because it targets the container's own DB, and required only if per-test reset is wanted. Do **not** use `withReuse()` — reuse re-breaks disposability.

## 3. Integration

### 3.1 Method: DIRECT

No fork, no patch, no reimplementation of safety logic. Only a lifecycle helper (§2) plus deletions.

| Surface | Action | Detail |
|---|---|---|
| `package.json` | edit | add `@testcontainers/postgresql` to `devDependencies`; extend `test` script to include `dist/src/commands/contract.test.js` (currently omitted) |
| `pnpm-lock.yaml` | regenerate | CI runs `pnpm install --frozen-lockfile`; stale lockfile fails the build |
| `pnpm-workspace.yaml` | edit | `onlyBuiltDependencies` gains `cpu-features`, `ssh2`, `protobufjs` (the only 3 tree entries with install scripts) or accept pnpm's ignore warning |
| `tests/wp1a/support/disposable-pg.ts` | **new** | helper from §2 |
| `src/persistence/migrate.test.ts` | rewrite | delete `ADMIN_URL` derivation (line 13), `CREATE DATABASE` (24), `DROP TABLE` block (30-36), `DROP DATABASE ... WITH (FORCE)` (43) — container DB starts empty, so none are needed |
| `src/persistence/persistence.test.ts` | rewrite | `before()` takes `uri` from helper; `DELETE FROM` block retained (now unambiguously container-scoped) |
| `tests/wp1a/contract.test.ts` | rewrite | same; drop `assertDisposableDb` |
| `tests/wp1a/restart.test.ts` | small edit | child env already built as `{...process.env, DATABASE_URL: dbUrl}` → pass container `uri`; child needs no change |
| `src/commands/contract.test.ts` | rewrite **or delete** | 7 unguarded `DROP TABLE ... CASCADE` (23-29). Never in the `test` script — dead code that compiles into `dist/`. Deleting is the lower-risk choice; it duplicates `tests/wp1a/contract.test.ts` |
| `src/test-guard.ts` | **delete** | self-researched guard; prohibited without a BUILD exception. Its absence is the point |
| `.github/workflows/ci.yml` | edit | remove the `services: postgres` block and the hand-written `CREATE TABLE` step; `WP1A_TEST_OPT_IN` / `DATABASE_URL` env no longer needed |

### 3.2 The deletion that makes Gate 0 pass

Every test file currently begins with `getDbUrl()` → `process.env.DATABASE_URL || process.env.WP1A_TEST_DB`, throwing only if both are absent. That fallback is the vulnerability. After integration, `DATABASE_URL` must not appear in any test file (`grep` gate, §7 N3). Tests receive the URI exclusively as a return value.

Open decision, not mine to settle: CI runs `postgres:17` while `package.json` describes PostgreSQL **18.6**. Image tag (`postgres:17-alpine` vs `postgres:18-alpine`) is a coordinator call; picking 18 also fixes the existing drift.

## 4. Rollback

Adoption is additive at the dependency level and deletive at the test level, in one commit.

- `git revert <sha>` restores the pre-integration tests — but **do not** restore `src/test-guard.ts`; it was rejected on merit and reverting it re-opens Gate 0. Accept that DB tests then require an externally provisioned DB, or skip them.
- Filesystem fallback: `git checkout b6b828a -- src/ tests/ package.json pnpm-lock.yaml pnpm-workspace.yaml .github/workflows/ci.yml`.
- Product code untouched: `src/persistence/{db,migrate,receipts}.ts`, `src/commands/*.ts` are not modified by this adoption, so no runtime rollback risk exists. `receipts.ts:95` (`DELETE FROM command_receipts`) is production code and stays.
- Cost of rollback is low and reversible in one commit — that asymmetry is why DIRECT beats EXTRACT here.

## 5. Incompatibility: concrete reproducer + alternates

### 5.1 CONFIRMED blocker on this host (not on CI)

```powershell
docker version  → failed to connect ... npipe:////./pipe/dockerDesktopLinuxEngine
Get-Service com.docker.service → Status: Stopped
```

Docker CLI present (`D:\Docker\resources\bin\docker.exe`), context `desktop-linux` configured, engine not running. **Consequence: Testcontainers cannot be executed on this workstation until Docker Desktop is started.** CI (`ubuntu-latest`) ships Docker — `INFERRED`, not fetched from GitHub docs. Cheap way to make it CONFIRMED: add `docker version` as a CI step before the test job.

Reproducer for the fallback path, to be run by whoever has Docker: start the daemon, then
`node -e "import('@testcontainers/postgresql').then(async m=>{const c=await new m.PostgreSqlContainer('postgres:17-alpine').start();console.log(c.getConnectionUri());await c.stop()})"`
Exit 0 + a `127.0.0.1:<port>` URI means the module works on this platform. Non-zero with "Could not find a working container runtime" means BUILD-exception territory.

### 5.2 Alternate, if Docker cannot be mandated

`embedded-postgres` — **CONFIRMED** from registry: latest `18.6.0-beta.19`, **MIT**, deps `pg ^8.23.1` + `exit-hook`, optional per-platform binary packages (`@embedded-postgres/windows-x64`, `linux-x64`, …), repo `github.com/leinelissen/embedded-postgres`. Runs a real PostgreSQL 18.6 process on a random port with a temp data dir — no Docker, works locally *and* in CI, and matches the declared 18.6 target. **Two caveats: it is a prerelease (`-beta.19`), and it is single-maintainer** — a weaker maintenance signal than Testcontainers' 2.6k stars. Viable second choice, not first.

Rejected: `pg-mem` (in-memory emulation; cannot oracle `CASCADE`, `WITH (FORCE)`, or migration semantics — a weaker oracle than the thing under test; `INFERRED`, not version-checked). A hand-rolled "per-run name + nonce" fixture is explicitly out of scope per coordinator directive.

## 6. Destructive callsite census (CONFIRMED — read-only `Select-String` over the WP1-A worktree)

| # | File:line | Statement | Guarded? | In `test` script? |
|---|---|---|---|---|
| 1-7 | `src/commands/contract.test.ts:23,24,25,26,27,28,29` | 7× `DROP TABLE IF EXISTS ... CASCADE` | **NO** — no guard import in file | **NO** |
| 8 | `src/persistence/migrate.test.ts:13` | `ADMIN_URL = DB_URL.replace(/wp1a_migrate_test\|wp1a_test/, "postgres")` | n/a — derived, unguarded | yes |
| 9 | `src/persistence/migrate.test.ts:21` | `new Pool({ connectionString: ADMIN_URL })` | **NO** | yes |
| 10 | `src/persistence/migrate.test.ts:24` | `CREATE DATABASE ${TEST_DB}` | NO | yes |
| 11-17 | `src/persistence/migrate.test.ts:30-36` | 7× `DROP TABLE IF EXISTS ... CASCADE` (in `before()`, not a migration) | via `assertDisposableDb(DB_URL)` only | yes |
| 18 | `src/persistence/migrate.test.ts:42` | `new Pool({ connectionString: ADMIN_URL })` | **NO** | yes |
| 19 | `src/persistence/migrate.test.ts:43` | `DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)` | **NO** — admin pool never guarded | yes |
| 20-28 | `src/persistence/persistence.test.ts:26-34` | 9× `DELETE FROM ...` (every table) | `assertDisposableDb` at :25 | yes |
| 29-37 | `tests/wp1a/contract.test.ts:31-39` | 9× `DELETE FROM ...` (every table) | `assertDisposableDb` at :29 | yes |
| 38 | `src/persistence/receipts.ts:95` | `DELETE FROM command_receipts` (no `WHERE`) | product code, `clear()` | n/a |

Notes that matter for Gate 0:

- The **admin connection string is derived by regex substitution and never guarded**. If `DATABASE_URL` does not contain `wp1a_test`, the replace returns the input unchanged, so `ADMIN_URL === DB_URL` and `DROP DATABASE ... WITH (FORCE)` runs against whatever server that URL names. Line 20's guard validates `DB_URL` only; line 42 opens a fresh pool the guard never sees.
- `src/commands/contract.test.ts` is unguarded *and* unreachable via `npm test`, yet `dist/src/commands/contract.test.js` exists — it is a loaded gun on the shelf, not a discharged one. Deleting it is part of the fix.
- Guard coverage is partial: `assertDisposableDb` is imported by 3 of 7 test files. No test file tests the guard itself — the "negative tests prove refusal" comment at `test-guard.ts:9` has **no corresponding test in the tree**. The rejection was correct.
- `tests/wp1a/restart.test.ts` reads `DATABASE_URL` at :11 (parent) and :29 (child script string) only to hand it to a spawned child (`:56` builds `env`), so it needs the container URI rather than removal.

## 7. Negative preflight (run before any destructive change; zero rows touched)

Non-destructive means: no statement that writes to, drops, or creates anything on a database we did not just start.

| # | Check | Needs Docker | Pass criterion |
|---|---|---|---|
| N1 | **Static census gate.** Text-scan `src/` + `tests/` for `DROP DATABASE`, `DROP TABLE`, `CREATE DATABASE`, `ADMIN_URL`, `WITH (FORCE)`. | no | zero matches outside an allowlist of `tests/wp1a/support/disposable-pg.ts` |
| N2 | **Ambient-env trap.** With `DATABASE_URL` set to a sentinel (`postgresql://x:x@127.0.0.1:1/nope`), start the helper; assert returned URI ≠ sentinel, host is loopback, mapped port ≠ 5432. | yes | helper never reads the env var |
| N3 | **Fallback-removal gate.** `grep -r DATABASE_URL src tests` | no | zero matches in test files |
| N4 | **Fail-closed on no runtime.** Point `DOCKER_HOST` at a dead socket; call helper. | no | throws; must not fall back to any env URL |
| N5 | **Cleanup on failure.** Throw inside a test after `start()`; then list containers by label. | yes | zero leftover containers |
| N6 | **Discovery gate.** Parse `package.json` `test` script; assert every `*.test.ts` in `src/` and `tests/` appears (or the file is deleted). | no | no orphan test files |
| N7 | **Legacy guard retirement.** Assert `src/test-guard.ts` is absent and unimported; assert its 3 former callers no longer call it. | no | absent |

N1/N3/N6/N7 run today with no Docker and are the ones that would have caught the current defects. Run them first.

## 8. Open items for the coordinator

1. Approve DIRECT adoption + dependency footprint (174 dev-only packages) — or approve a BUILD exception if the footprint is unacceptable.
2. Decide image tag (`postgres:17-alpine` vs `18-alpine`, §3.2 drift) and whether local developers must run Docker Desktop or may fall back to `embedded-postgres`.
3. Decide delete-vs-rewrite for `src/commands/contract.test.ts` (§6) — deletion recommended.
4. Transitive license audit (`pnpm licenses list`) before merge if SPDX compliance is in scope: **UNKNOWN** today.
5. Gate 0 sign-off requires an independent reviewer, not self-pass.

## 9. Evidence index

- `https://registry.npmjs.org/@testcontainers/postgresql/latest` — version 12.2.1, license MIT, dep set
- `https://registry.npmjs.org/testcontainers/latest` — 15 direct deps, `engines.node >= 22.22`
- `https://unpkg.com/@testcontainers/postgresql@12.2.1/build/postgresql-container.d.ts` — exact class/method surface
- `https://raw.githubusercontent.com/testcontainers/testcontainers-node/main/packages/modules/postgresql/src/postgresql-container.ts` — ctor, defaults, healthcheck, mapped-port URI
- `https://api.github.com/repos/testcontainers/testcontainers-node` — stars 2641, forks 286, MIT, pushed 2026-11-11
- `https://api.github.com/repos/testcontainers/testcontainers-node/releases/latest` — v12.2.1, 2026-10-13
- `https://registry.npmjs.org/embedded-postgres/latest` — 18.6.0-beta.19, MIT, alt candidate
- Local: `npm install --package-lock-only @testcontainers/postgresql@12.2.1` → 174 entries; `docker version` → daemon down
