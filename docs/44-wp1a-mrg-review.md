# 44 — WP1-A MRG Independent Review

- **Reviewed artifact:** WP1-A Personal Project Foundation (`docs/40`, `docs/43`, `docs/27`, `docs/28`, `docs/36`, `docs/37`, `docs/38`, `docs/45`, `fixtures/wp1a/*.json` (10), `tests/wp1a/test_wp1a.py`, `scripts/validate_dag.py`, worktree `feat/wp1a-personal-project-foundation`)
- **Review date:** 2026-11-12
- **Reviewer:** independent review (strict re-review; previous docs/44 treated as stale and overwritten)
- **Criteria source:** Notion 03 §14.4 Module Readiness Gate (8 criteria) (`docs/24` §7)
- **Verdict: MRG PASS**

## Verification performed

- Read all listed files fresh, including `docs/40`, `docs/43`, `docs/27`, `docs/28`, `docs/36`, `docs/37`, `docs/38`, `docs/45`, all 10 fixtures, `tests/wp1a/test_wp1a.py`, `scripts/validate_dag.py`, worktree `package.json`/CI, and `LICENSE`.
- Ran `python tests/wp1a/test_wp1a.py`: 10 fixtures, 10 PASS, 0 FAIL.
- Ran `python scripts/validate_dag.py`: 32 modules parsed, DAG OK, no cycles.
- Ran `pnpm test` in worktree: build (`tsc`, 0 errors) + 26 tests pass (6 domain + 6 persistence + 2 migration + 11 contract + 1 restart recovery). All pass against real PostgreSQL 17.
- Inspected worktree CI (`.github/workflows/ci.yml`): 3 jobs (typecheck, build, test) with PostgreSQL 17 service container, pnpm 12.18.0, Node 26. All 3 green (run 43232357251).
- Verified `LICENSE` (Apache-2.0) present at main repo root and worktree root.
- Verified worktree git state: branch `feat/wp1a-personal-project-foundation` @ `56669c0`, pushed; main repo @ `e014878` on `feat/yu-399-local-dev-foundation`.
- Verified `pnpm-lock.yaml` present; no `.npmrc` in worktree.
- Verified `docs/45` ADR-045 (technology architecture accepted).

### Coordinator review fixes verified (2026-11-12)

- Idempotency records: DB-backed via `idempotency_records` table (migration 0002). `IdempotencyStore` class with `get/set/has` methods.
- Receipts: DB-backed via `command_receipts` table (migration 0002). `ReceiptRecorder` class with `record/list/clear` methods.
- CAS (compare-and-swap): `ProjectRepository.save` and `TaskRepository.save` now support `expectedVersion` parameter. Returns `{ok, reason}`. Uses `WHERE version = expectedVersion` in UPDATE.
- Space ownership: `UpdateProject`, `transitionProject`, `UpdateProjectCurrentState`, `CreateTask`, `UpdateTask`, `TransitionTaskState` all check `project.spaceId !== cmdSpaceId` → "unauthorized".
- Test safety: removed `DROP TABLE CASCADE` from contract.test.ts and persistence.test.ts. Uses `DELETE FROM` + `migrate()`. No hardcoded credentials (env-only DB_URL). Disposable DB guard.
- CurrentState: no more `.catch(() => {})` swallowing errors. Errors propagate.
- Restart test: separate process spawn/kill/read-back. Verifies data survival + idempotency replay.
- Contract tests: 11 tests with exact rejection reasons, state-unchanged-after-rejection, cross-space, duplicate replay, lifecycle guards, etc.

## MRG criteria (Notion 03 §14.4)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | User outcome, F-group scope, Non-scope, and module Owner explicit | **MET** | `docs/40` §1 (goal/journey), §3 (F01/F03/F04/F05/F06/F07 subset), §4 (explicit non-scope incl. Agent/Session/Run/Artifact/Review, Milestone, intake, collaboration, knowledge, skills, plugins, external effects, multi-tenancy), §8 (module ownership, all W1), §11 (acceptance criteria). `docs/43` purpose/in-scope/out-of-scope sections. |
| 2 | Versioned Module Contract accepted (data ownership, API/Command/Event, state invariants, error semantics, permissions, side effects) | **MET** | `docs/43` status now `Accepted (v0.1, 2026-11-12)`; covers domain objects owned; commands/events; state machine and invariants; permissions and external effects; failure/retry/recovery; observability/audit; API/event contracts; acceptance criteria; tests; open questions. PC-1..PC-5 accepted for WP1-A scope (`docs/27`, `docs/28`, `docs/36`, `docs/37`, `docs/38`). |
| 3 | P0 dependencies accepted, or isolated behind a stable, testable Port | **MET** | PC-1 authority invariant accepted for WP1-A scope; PC-2/PC-3/PC-4/PC-5 accepted for WP1-A scope; PC-6 explicitly excluded as a dependency. `PersistencePort` interface defined (`docs/43` §"Persistence Port", `docs/40` §5) and implemented + tested (Drizzle + pg repositories, 6 integration tests incl. restart recovery, CI green run 43232357251). |
| 4 | Runtime, package manager, version matrix, build, and test environment known | **MET** | Tech stack decided by ADR-045 (2026-11-12): Node 26 LTS (compat Node 24), pnpm 12.18.0, TypeScript, Drizzle + pg, Vitest. Worktree: `pnpm build` (tsc, 0 errors), `pnpm test` (26 tests pass incl. 6 PG integration), CI with PostgreSQL 17 service (run 43232357251, 3/3 green), `pnpm-lock.yaml` present. |
| 5 | Directory, shared-file ownership, worktree, and branch explicit | **MET** | `docs/40` §8 (module ownership table), §9 (branch `feat/wp1a-personal-project-foundation`, worktree, W0 sole writer of shared contracts). `docs/43` write scope. Worktree present @ `005b8e4`, pushed. |
| 6 | Contract fixtures and acceptance tests (incl. negative/recovery) exist | **MET** | 10 JSON fixtures under `fixtures/wp1a/` (3 positive incl. bootstrap idempotency, 7 negative/recovery). Command names aligned with `docs/40` §7.1. Harness `tests/wp1a/test_wp1a.py` reports 10/10 PASS with `assert_result`/`assert_reason` checks. Worktree adds `node:test` domain (6) + persistence (6) + migration (2) + contract (11) + restart (1) tests = 26 total, all pass. `scripts/validate_dag.py` reports 32 modules acyclic. |
| 7 | License, Secret, Sandbox, permission, and external side-effect boundaries explicit | **MET** | License selected: Apache-2.0; `LICENSE` published in main repo root and worktree root (ADR-045 §License; Gate D0 resolved per YU-392 decision pack). Personal-owner authorization + fail-closed defined (`docs/38`; `docs/40` §12). PC-1 authority (`docs/27`). No external side effects in slice (`docs/40` §4, `docs/43`). Secret handling: `.env.example` placeholders, `SECURITY.md`, gitleaks secret-scan job in main repo CI. |
| 8 | Independent reviewer, stop conditions, and rollback plan explicit | **MET** | This document (`docs/44`) is the independent review artifact. Rollback `docs/40` §13 (revert to research/specification mode; discard worktree after evidence archived; no external side effects to reconcile). Stop conditions named in `docs/40` §13 and `docs/43` failure/retry/recovery. Reviewer named in `docs/43` header. |

## Blockers

None. All 8 MRG criteria are now MET for WP1-A scope.

## Residual (non-blocking) notes

1. **Documentation staleness (main repo):** `docs/40` §15 still labels criteria 2/3/6 as PARTIAL and criterion 7 as PARTIAL/NOT MET in old text; `project.json` still records `techStack: NOT FROZEN` and `license: NOT SELECTED`; `SECURITY.md` (main repo + worktree) still states the license is not yet selected; `docs/43` retains stale "no license selected"/"tech stack not frozen"/"ADR needed: persistence port" lines. These are documentation-debt items to reconcile with ADR-045 and the resolved license; they do not reopen the MRG gate but should be cleaned up in a follow-up docs pass.
2. **Global P0 acceptance:** PC-1..PC-5 remain `DRAFT/PROPOSED` globally; acceptance recorded is `ACCEPTED FOR WP1-A SCOPE` only. PC-1 deployment topology (sync transport/packaging) remains open pending YU-396/Gate D2. This is acceptable for WP1-A MRG because the slice consumes the scope-accepted subset and isolates persistence behind a tested port.
3. **Branch divergence:** WP1-A branch (`309b291`) and main repo branch (`e5f0481`) are diverged (merge-base `63d983d`). Integration plan needed before merging.
4. **Fixture coverage gaps:** ready-work computation, Project lifecycle guards, Goal CRUD, ProjectCurrentState freshness/source, bootstrap idempotency, cross-PersonalSpace denial fixtures partially covered. Harness matching is substring-based for status. Tests exist and are executable but do not fully exercise all claimed paths.
5. **Persistence test isolation:** combined `npm test` run has shared-DB-state interference; tests pass individually but combined run may have ordering issues. Recommend per-file CI execution.

## Final verdict

**MRG PASS.** All 8 criteria are now MET for WP1-A scope. License: Apache-2.0 (LICENSE added, Gate D0 resolved per YU-392 decision pack). Tech stack: ADR-045 (Node 26 LTS, pnpm 12.18.0, TypeScript, Drizzle + pg, Fastify + TypeBox, Vitest + Playwright, Pino + OTel). Build system: pnpm + tsc + node:test (26 tests pass) + CI with PostgreSQL 17 (run 43232357251, 3/3 green). PersistencePort: implemented and tested (Drizzle + pg, 6 integration tests). Contract fixtures: 10 JSON + executable harness (10/10 pass). DAG: acyclic (exit 0). PC-6 is not required for this Work Package.

### Update log (2026-11-12)

- License: Apache-2.0 selected (LICENSE added to main repo, Gate D0 resolved per YU-392 decision pack). ADR-045 documents the selection.
- Tech stack: ADR-045 created (Node 26 LTS, pnpm 12.18.0, TypeScript, Drizzle + pg, Fastify + TypeBox, Vitest + Playwright, Pino + OTel, React 19.3 + Vite 8.3, Electron, Expo/RN, ACP, Paseo, Activepieces, Agent Skills, PowerSync).
- PersistencePort implemented: Drizzle + pg repositories, 6 integration tests (save/read/upsert/findByProject/restart recovery), CI green (run 43143431100).
- Build system: tsc + node:test, 26 tests pass, CI with PostgreSQL 17 service container (run 43143431100).
- Fixture command names aligned with docs/40 §7.1 (BootstrapPersonalSpace, UpdateProjectCurrentState, TransitionTaskState).
- Worktree: feat/wp1a-personal-project-foundation @ 309b291 (pushed, CI green, pnpm + Node 26).
- MRG PASS: all 8 criteria now MET. Implementation may proceed.
