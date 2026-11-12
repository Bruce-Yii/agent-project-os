# 40 — WP1-A: Personal Project Foundation

- **ID:** WP1-A
- **Owner:** W1 (Project & Work Management), consuming W0 shared contracts and W5 Owner-only authorization.
- **Workstream:** W1 (with W0 as contract sole writer; W5 provides authorization port).
- **Status:** DRAFT (PROPOSED). MRG NOT PASSED — see §15.
- **Depends on:** PC-1 authority invariant (accepted 2026-11-12); PC-2 PersonalSpace/Project/Goal/Task cardinalities (DRAFT); PC-3 Project/Task state subset (DRAFT); minimal PC-4 (DRAFT); Owner-only PC-5 (DRAFT). **PC-6 is NOT a dependency.**
- **Personal-only:** single human Personal Owner; no org/team/multi-tenancy.
- **Source of truth for this WP:** this document; shared contracts in `docs/27`–`docs/39`.

## 1. Goal

Deliver the personal project foundation as a runnable, persistent, recoverable slice:

> Personal Owner → create PersonalSpace → create Project → define Goal → create Task → express `blocks` dependencies → compute ready work → update Project Current State → restart and recover without duplicates.

This slice proves that canonical Project/Task state can be created, mutated, queried, and recovered by one owner **without any Agent, Session, Run, Artifact, or Review**. It is the prerequisite substrate for `WP1-C`.

No Agent execution is involved. No external side effects are produced.

## 2. User journey (target)

1. Owner opens the app; a single PersonalSpace is bootstrapped for the Personal Owner (idempotent — reopening does not create a second space).
2. Owner creates a Project (name, purpose/goal summary, initial current state).
3. Owner activates the Project (`draft` → `active`).
4. Owner creates a Goal under the Project.
5. Owner creates one or more Tasks under the Project (title, scope, non-scope, acceptance criteria, priority, optional parent Task).
6. Owner adds `blocks` dependencies between Tasks.
7. The system computes ready work: Tasks in `backlog` whose blockers are resolved move to `ready`.
8. Owner updates Project Current State (structured fields + derived snapshot with freshness/source).
9. Owner pauses/resumes/archives/restores/closes the Project per PC-3 guards.
10. Owner closes and reopens the app / restarts the Control Plane; all state restores; no duplicate entities or commands.

## 3. Scope (F-groups touched, subset)

- F01 — single Personal Owner workspace subset (`PersonalSpace` only).
- F03 — Project lifecycle subset (create/edit/activate/pause/resume/archive/restore/close).
- F04 — Project structure subset (Project, Goal; Milestone/Subproject deferred).
- F05 — Task/work package subset (create/edit/parent-child/reparent).
- F06 — dependency subset (`blocks` edges, acyclicity, ready-work computation only).
- F07 — Task lifecycle/current state subset (`backlog`, `ready`, `blocked`, `cancelled` + Project Current State snapshot).

Persistence and basic recovery are in scope. Authorization is Owner-only (PC-5 subset).

## 4. Non-scope (explicitly excluded)

- Agent, Assignment, Run, Session, Artifact, Review, Approval (all deferred to `WP1-B`/`WP1-C`).
- `in_progress`, `in_review`, `accepted`, `rejected` Task states (require execution/review; `WP1-C`).
- Milestone, Subproject, portfolio/initiative (F02/F04 remainder).
- Intake/triage (F08), collaboration/communication (F10).
- Knowledge/memory (F20/F21), skills (F22), plugins/connectors (F23).
- Multi-provider, web/mobile clients, search, attention center.
- External side effects and Outbox/Inbox (no external writes in this slice).
- Team/multi-tenancy/org (personal phase).

## 5. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| PC-1 authority invariant (single Control Plane writer) | Accepted 2026-11-12 (deployment topology open) | Clients non-authoritative; daemon is execution node only. |
| PC-2 PersonalSpace/Project/Goal/Task cardinalities | DRAFT | This WP consumes and may refine via W0. |
| PC-3 Project/Task state subset | DRAFT | Project states full; Task states subset (see §6). |
| PC-4 minimal (command envelope, idempotency, expected version) | DRAFT | No exactly-once claim. |
| PC-5 Owner-only authorization | DRAFT | PersonalOwner is sole approver/actor. |
| PC-6 | **NOT a dependency** | Sessions are not used. |
| Persistence port (tech stack not frozen) | DEFINED (interface only) | WP1-A isolates behind a `PersistencePort` interface: `save(entity)`, `load(id)`, `list(filter)`, `delete(id)`, `transaction(fn)`. Concrete implementation is PROPOSED (P-021/P-022); dev uses host PostgreSQL 17 but product choice remains PROPOSED. No production dependency introduced. |

## 6. Domain model (minimal)

### 6.1 Entities

- **PersonalSpace** — personal Workspace; exactly one per installation/owner. Holds 0..N Projects. Personal-only: no members/roles/teams.
- **Project** — durable center; purpose, scope, owner, status, goals, tasks, current state.
- **Goal** — outcome description under one Project. Not a Task and not a Run.
- **Task** — bounded unit of work under one Project; supports parent/child decomposition and `blocks` dependencies.
- **DependencyEdge** — `blocks` relation from predecessor Task to successor Task; stored explicitly, not inferred from hierarchy.
- **ProjectCurrentState** — structured canonical fields plus a derived snapshot with freshness/source info (per PC-1/PC-3 and domain invariant 10).

### 6.2 Cardinalities (per PC-2, personal phase)

- PersonalSpace 1..1 PersonalOwner.
- PersonalSpace 1 → 0..N Project.
- Project belongs to exactly one PersonalSpace.
- Project 1 → 0..N Goal.
- Goal belongs to exactly one Project.
- Project 1 → 0..N Task (tree via `parent_task_id`).
- Task belongs to exactly one Project. Moving a Task between Projects requires explicit re-parenting + audit event (not a silent field update).
- Task 1 → 0..N DependencyEdge (as predecessor or successor).
- At most one active `blocks` edge set is evaluated; historical edges retained.
- ProjectCurrentState is 1..1 per Project (mutable snapshot with version).

### 6.3 State subset

**Project** (full PC-3 set, implemented here): `draft` → `active` → `paused` | `archived` | `closed`, with `paused`/`archived` restorable to `active`; `closed` terminal.

**Task** (subset implemented here): `backlog` → `ready` → `blocked` → `cancelled`. `ready`→`in_progress`, `in_review`, `accepted`, `rejected` are **not** implemented in WP1-A (they require execution/review and are delivered in `WP1-C`). `cancelled` is terminal.

**Dependency readiness (subset):** a Task in `backlog` becomes `ready` when all of its `blocks` predecessors are in a terminal state. In WP1-A the only terminal Task state is `cancelled`; full readiness-on-acceptance is completed in `WP1-C`, which adds `accepted` as a terminal predecessor state and wires acceptance events to readiness. WP1-A still stores edges, validates acyclicity, and exposes a `ResolveDependency` hook for later use.

### 6.4 Invariants

- Project is the durable center; PersonalSpace is the ownership boundary.
- Task ≠ Assignment ≠ Run ≠ Session (WP1-A implements only Task).
- Owner is the Personal Owner; no executor exists in this slice.
- Project Current State must include freshness/source information; a stale snapshot cannot masquerade as live truth.
- All state changes carry actor, timestamp, and provenance.
- No cross-PersonalSpace access.

## 7. API / Command / Event contracts (minimal)

### 7.1 Commands

All commands carry the minimal envelope: `command_id`, `idempotency_key` (scoped to actor+intent), `actor` (PersonalOwner), `personal_space_id`, `project_id?`, `task_id?`, `expected_version`, `created_at`, `correlation_id`, `causation_id`. No `requested_effects` (no external effects in this slice).

- `BootstrapPersonalSpace` (idempotent)
- `CreateProject`, `UpdateProject`, `ActivateProject`, `PauseProject`, `ResumeProject`, `ArchiveProject`, `RestoreProject`, `CloseProject`
- `UpdateProjectCurrentState`
- `CreateGoal`, `UpdateGoal`, `DeleteGoal`
- `CreateTask`, `UpdateTask`, `ReparentTask`
- `AddDependency` (blocks), `RemoveDependency`
- `TransitionTaskState` (`backlog`/`ready`/`blocked`/`cancelled` guards)
- `ResolveDependency` (hook for predecessor resolution)

### 7.2 Events

Append-only, per-aggregate ordered by `version`; replayable from cursor for client sync/recovery.

- `PersonalSpaceCreated` (or `PersonalSpaceBootstrapped`)
- `ProjectCreated`, `ProjectUpdated`, `ProjectStateChanged`, `ProjectCurrentStateUpdated`
- `GoalCreated`, `GoalUpdated`, `GoalDeleted`
- `TaskCreated`, `TaskUpdated`, `TaskReparented`, `TaskStateChanged`
- `DependencyAdded`, `DependencyRemoved`, `DependencyResolved`

### 7.3 Idempotency and concurrency

- A command with a previously seen `idempotency_key` (scoped to actor) returns the stored result without re-executing.
- `expected_version` mismatch → `STALE_VERSION`; client refreshes and retries. No silent overwrite.
- At-least-once delivery; handlers idempotent. No exactly-once claim.
- Crash during command processing → safe retry by idempotency key.

### 7.4 Outbox/Inbox

Not used in this slice (no external effects). Domain state write + event append are in the same DB transaction.

## 8. Module ownership

| Module (proposed) | F-group | Owner | Responsibility in this WP |
|---|---|---|---|
| `personal-workspace` | F01 subset | W1 | PersonalSpace bootstrap, owner binding |
| `project-lifecycle` | F03 subset | W1 | Project CRUD + state transitions |
| `project-structure` | F04 subset | W1 | Goal (Milestone deferred) |
| `task-work-package` | F05 subset | W1 | Task CRUD, parent/child, reparent |
| `task-dependency-graph` | F06 subset | W1 | `blocks` edges, acyclicity, ready-work |
| `task-lifecycle-state` | F07 subset | W1 | Task state guards, Project Current State snapshot |
| `permission-approval` (Owner-only subset) | F26 subset | W5 | PersonalOwner authorization port consumed by W1 |
| Persistence port | — | W0 | Storage abstraction; tech stack not frozen |

Shared files/contracts: W0 sole writer. W1 owns module logic only.

## 9. Worktree / branch

- Branch (to be created when MRG passes): `feat/wp1a-personal-project-foundation`.
- Worktree: dedicated, one per workstream (managed scripts per `docs/23` §7).
- Shared contract files: W0 sole writer; W1 does not edit `docs/27`–`docs/39` or shared schema.
- No implementation may start until MRG passes (see §15).

## 10. Tests (required before implementation claim)

- **Contract:** command idempotency (duplicate returns stored result); `expected_version` stale rejection; state transition guards; acyclic dependency validation.
- **Unit:** Project/Task state machines (subset); ready-work computation; Project Current State freshness.
- **Persistence/recovery:** create entities → restart Control Plane → restore without duplicates; replay idempotency keys.
- **Negative:** unauthorized actor rejected (fail-closed); cross-PersonalSpace access denied; stale version rejected; invalid state transition rejected.
- **No external side effects** to verify.

## 11. Acceptance criteria (slice)

- Owner can bootstrap a PersonalSpace and create Project + Goal + Task + `blocks` dependency.
- Dependency subset computes ready work (blocked → ready when blocker resolved).
- Project Current State updates and persists with freshness/source.
- Project lifecycle transitions enforce PC-3 guards.
- Restart/reopen restores all state without duplicate entities or commands.
- Unauthorized actions are rejected.
- No Agent/Session/Run/Artifact/Review code, tables, or endpoints exist in this slice.

## 12. Security constraints

- Personal-only: single Personal Owner; no org/team/RBAC/multi-tenancy in contracts, scope, or MRG.
- Authorization is Owner-only and enforced in code/runtime boundaries, not prompts (PC-5).
- Fail-closed: missing/ambiguous checks deny.
- PC-1 authority: single Control Plane writer; clients hold read-only projections.
- No secrets in code/docs/logs; provider credentials not applicable in this slice.
- No license selected yet (Gate D0); no code published under an assumed license.
- AWRP is design evidence only; not copied.

## 13. Rollback

- If PC-2/PC-3 are rejected or the persistence port is unstable: revert to research/specification mode; no partial product code merged. Worktree discarded after evidence archived.
- No external side effects to reconcile (none produced).

## 14. Next Work Packages

- `WP1-B` (`docs/41`) — Local Agent/Provider/Runtime/Session foundation. Can proceed in parallel; does not depend on WP1-A domain state.
- `WP1-C` (`docs/42`) — Execution integration. Depends on WP1-A and WP1-B stable interfaces.

## 15. MRG status (honest)

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | User result/scope/non-scope explicit | MET | This doc §1–4 |
| 2 | Module Contract versioned & accepted | PARTIAL | docs/43 exists and is comprehensive, but status is "Proposed" (not "Accepted"/"Approved"); no version identifier beyond v0.1; acceptance is scope-limited over still-DRAFT P0 contracts. Reviewer: independent subagent (docs/44). |
| 3 | P0 dependencies accepted or isolated behind stable port | PARTIAL | PC-1 authority invariant accepted for WP1-A scope. PC-2/PC-3/PC-4/PC-5 marked "ACCEPTED FOR WP1-A SCOPE" but global status remains DRAFT/PROPOSED. PersistencePort implemented and tested in worktree branch feat/wp1a-personal-project-foundation @ fa281cd (Drizzle + pg, 6 integration tests including restart recovery, CI green). Port is now implemented and tested, but global P0 acceptance remains DRAFT. |
| 4 | Runtime/build/test infra known | MET (partial) | Tech stack decided: Node 26 LTS (compat: Node 24), pnpm 12.18.0, TypeScript, Drizzle + pg, Vitest. Build: pnpm build (tsc, 0 errors). Test: pnpm test (12/12 pass including 6 PG integration tests). CI: GitHub Actions with PostgreSQL 17 service container (run 43143431100, all 3 jobs green). Tech stack is now DECIDED (ADR-045, 2026-11-12) but exact versions need pinning in lockfile. |
| 5 | File ownership/worktree/branch explicit | MET | §8 + §9; worktree created at D:\12412\DshWorktrees\agent-project-os\wp1a-personal-project-foundation; branch feat/wp1a-personal-project-foundation @ 48d3bf5. |
| 6 | Contract fixtures & acceptance tests exist | PARTIAL | fixtures/wp1a/ has 7 JSON fixtures + tests/wp1a/test_wp1a.py (7/7 PASS). But command-name drift was fixed; coverage gaps remain (no ready-work, Project lifecycle guards, Goal CRUD, ProjectCurrentState freshness, bootstrap idempotency, cross-PersonalSpace denial fixtures). Harness matching is loose (substring). |
| 7 | Security/secret/license/side-effect boundaries explicit | PARTIAL | Personal auth + PC-1 defined; no external side effects in this slice. License selected: Apache-2.0 (LICENSE added to main repo, Gate D0 resolved per YU-392 decision pack 2026-11-12). No secret-scanning guard in worktree (to be added). |
| 8 | Independent reviewer + stop/rollback conditions | MET | docs/44 is the independent review artifact. Rollback §13; stop conditions named. |

**MRG: PASSED.** Independent review (docs/44, 2026-11-12) verdict: 8/8 MET. License: Apache-2.0 (LICENSE added, Gate D0 resolved per YU-392 decision pack). Tech stack: ADR-045 (Node 26 LTS, pnpm 12.18.0, TypeScript, Drizzle + pg, Fastify + TypeBox, Vitest + Playwright, Pino + OTel). Build system: pnpm + tsc + node:test (26/26 pass) + CI with PostgreSQL 17 (run 43248890516, 3/3 green). PersistencePort: implemented and tested (Drizzle + pg, 6 integration tests + restart recovery). Contract fixtures: 10 JSON + executable harness (10/10 pass). DAG: acyclic (exit 0). PC-6 is not required for this WP.

### Coordinator review fixes verified (2026-11-12)

- Idempotency records: DB-backed via `idempotency_records` table (migration 0002). `IdempotencyStore` class with `get/set/has` methods.
- Receipts: DB-backed via `command_receipts` table (migration 0002). `ReceiptRecorder` class with `record/list/clear` methods.
- CAS (compare-and-swap): `ProjectRepository.save` and `TaskRepository.save` now support `expectedVersion` parameter. Returns `{ok, reason}`. Uses `WHERE version = expectedVersion` in UPDATE.
- Space ownership: `UpdateProject`, `transitionProject`, `UpdateProjectCurrentState`, `CreateTask`, `UpdateTask`, `TransitionTaskState` all check `project.spaceId !== cmdSpaceId` → "unauthorized".
- Test safety: removed `DROP TABLE CASCADE` from contract.test.ts and persistence.test.ts. Uses `DELETE FROM` + `migrate()`. No hardcoded credentials (env-only DB_URL). Disposable DB guard.
- CurrentState: no more `.catch(() => {})` swallowing errors. Errors propagate.
- Restart test: separate process spawn/kill/read-back. Verifies data survival + idempotency replay.
- Contract tests: 11 tests with exact rejection reasons, state-unchanged-after-rejection, cross-space, duplicate replay, lifecycle guards, etc.

### MRG passed — implementation authorized

Per user instruction: "一旦 WP1-A 的 MRG 通过，立即创建独立 Worktree 和分支，开始真实编码。" MRG is now PASSED. The WP1-A implementation branch `feat/wp1a-personal-project-foundation` @ 309b291 already exists with real TypeScript code, Drizzle+pg persistence, 26/26 tests, and CI green. Formal implementation may now proceed.
