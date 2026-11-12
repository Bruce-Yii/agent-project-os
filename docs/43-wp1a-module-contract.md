# Module Contract: WP1-A Personal Project Foundation

- **Module ID:** F01-subset / F03-subset / F04-subset / F05-subset / F06-subset / F07-subset / F26-subset (Owner-only)

- **Status:** Accepted (v0.1, 2026-11-12). WP1-A contract slice accepted by W0 for WP1-A scope. License: Apache-2.0 (selected per YU-392 decision pack, LICENSE file added). Tech stack: Node 26 LTS + pnpm 12.18.0 + TypeScript + Drizzle + pg + Vitest (ADR-045). PC-1 authority invariant accepted. PC-2/PC-3/PC-4/PC-5 accepted for WP1-A scope (global acceptance pending full G3 review). PersistencePort implemented and tested (Drizzle + pg, 6 integration tests, CI green in worktree). PC-6 excluded. Independent review: docs/44 (MRG PASS, 8/8 criteria MET, 2026-11-12).

- **Owner:** W1 (Project & Work Management), consuming W0 shared contracts and W5 Owner-only authorization port

- **Depends on:** PC-1 authority invariant (accepted for WP1-A scope), PC-2 PersonalSpace/Project/Goal/Task cardinalities (accepted for WP1-A scope), PC-3 Project/Task state subset (accepted for WP1-A scope), minimal PC-4 (accepted for WP1-A scope), Owner-only PC-5 (accepted for WP1-A scope). PC-6 NOT a dependency.

- **Source-of-truth document:** docs/40 (WP1-A), docs/27 (PC-1), docs/28 (PC-2), docs/36 (PC-3), docs/37 (PC-4), docs/38 (PC-5)

- **Write scope:** `personal-workspace`, `project-lifecycle`, `project-structure`, `task-work-package`, `task-dependency-graph`, `task-lifecycle-state`, `permission-approval` (Owner-only subset)

## Purpose and user value

One Personal Owner can create, mutate, query, and recover canonical Project/Task state with dependencies and Current State, without any Agent execution. This is the substrate for all later Work Packages.

## User scenarios

1. Bootstrap PersonalSpace → create Project → activate → create Goal → create Tasks → add `blocks` deps → view ready work → update Current State → restart → recover.
2. Pause/resume/archive/restore/close Project with guards.
3. Cancel a Task; dependency graph re-evaluates readiness.
4. Unauthorized actor attempts write → rejected (fail-closed).

## In scope

- PersonalSpace (single owner), Project, Goal, Task, DependencyEdge, ProjectCurrentState.

- Project lifecycle: draft/active/paused/archived/closed.

- Task lifecycle subset: backlog/ready/blocked/cancelled.

- `blocks` dependency edges, acyclicity validation, ready-work computation.

- Project Current State (structured + derived snapshot with freshness/source).

- Command envelope, idempotency, expected version, optimistic concurrency.

- Owner-only authorization (fail-closed).

- Persistence + basic recovery (restart without duplicates).

## Out of scope

- Agent, Assignment, Run, Session, Artifact, Review, Approval (WP1-B/WP1-C).

- Task states: in_progress, in_review, accepted, rejected (WP1-C).

- Milestone, Subproject, portfolio (F02/F04 remainder).

- Intake/triage, collaboration/communication (F08/F10).

- Knowledge/memory, skills, plugins/connectors (F20-F23).

- External side effects, Outbox/Inbox (no external writes).

- Team/multi-tenancy/org (personal phase).

- PC-6 (Local Session) — not a dependency.

## Domain objects owned

- PersonalSpace, Project, Goal, Task, DependencyEdge, ProjectCurrentState.

- Commands: BootstrapPersonalSpace, CreateProject, UpdateProject, ActivateProject, PauseProject, ResumeProject, ArchiveProject, RestoreProject, CloseProject, UpdateProjectCurrentState, CreateGoal, UpdateGoal, DeleteGoal, CreateTask, UpdateTask, ReparentTask, AddDependency, RemoveDependency, TransitionTaskState, ResolveDependency.

- Events: PersonalSpaceCreated/Bootstrapped, ProjectCreated/Updated/StateChanged/CurrentStateUpdated, GoalCreated/Updated/Deleted, TaskCreated/Updated/Reparented/StateChanged, DependencyAdded/Removed/Resolved.

## Inputs and outputs

- Input: Owner commands (actor = PersonalOwner, personal_space_id, expected_version).

- Output: domain events (append-only, per-aggregate ordered), state projections, query results.

## Persistence Port (interface, tech stack not frozen)

WP1-A depends on a `PersistencePort` abstraction, not a concrete database:

- `save(entity) -> void`

- `load(id) -> entity | null`

- `list(filter) -> entity[]`

- `delete(id) -> void`

- `transaction(fn) -> result`

Concrete implementation is PROPOSED (P-021/P-022). Dev environment uses host PostgreSQL 17 (available at D:\12412\PostgreSQL). No production dependency introduced until tech stack ADR is accepted. The Port must be implemented and tested before WP1-A implementation begins.

## Commands and events

See docs/40 §7. All commands carry minimal envelope: command_id, idempotency_key, actor, personal_space_id, project_id?, task_id?, expected_version, created_at, correlation_id, causation_id. No requested_effects (no external effects).

## State machine and invariants

- Project: draft→active→paused|archived|closed; paused/archived→active; closed terminal. See docs/36 §1.

- Task: backlog→ready→blocked→cancelled; cancelled terminal. See docs/36 §2 (subset).

- Dependency: acyclic `blocks` edges; ready-work when all predecessors terminal.

- Invariants: Project durable center; PersonalSpace ownership boundary; Task ≠ Assignment ≠ Run ≠ Session; Owner is Personal Owner; no cross-PersonalSpace access; Project Current State has freshness/source.

## Permissions and external effects

- Owner-only: PersonalOwner is sole actor. Fail-closed: missing/ambiguous checks deny.

- No external side effects in this slice (no Outbox/Inbox).

- No license selected (Gate D0); no code published under assumed license.

## Failure, retry, and recovery behavior

- Crash during command: safe retry by idempotency key (at-least-once, no exactly-once claim).

- Stale version: reject (STALE_VERSION), client refreshes.

- Invalid state transition: reject, no partial write.

- Dependency cycle: reject at creation.

- Unauthorized: reject, audit log.

- Restart: restore from persisted state without duplicates.

## Observability and audit

- All state changes carry actor, timestamp, provenance.

- Audit log for unauthorized attempts.

- Project Current State includes freshness/source.

## API / event contracts

- Command envelope (minimal, per docs/37 §1, without requested_effects).

- Event envelope (per docs/37 §4).

- No Outbox/Inbox in this slice.

## Acceptance criteria

- Owner can bootstrap PersonalSpace and create Project + Goal + Task + blocks dependency.

- Dependency subset computes ready work.

- Project Current State updates and persists with freshness/source.

- Project lifecycle transitions enforce PC-3 guards.

- Restart/reopen restores all state without duplicate entities or commands.

- Unauthorized actions rejected.

- No Agent/Session/Run/Artifact/Review code, tables, or endpoints.

## Tests and verification evidence

Fixtures: `fixtures/wp1a/` (7 JSON fixtures: 1 positive, 5 negative, 1 recovery).

- WP1A-POS-01: create Project + Task (positive)

- WP1A-NEG-01: duplicate command idempotency

- WP1A-NEG-02: stale version rejection

- WP1A-NEG-03: invalid state transition

- WP1A-NEG-04: dependency cycle rejection

- WP1A-NEG-05: unauthorized write rejection

- WP1A-REC-01: crash restart recovery

## Open questions and ADRs

- ADR needed: persistence port (tech stack not frozen; host PG 17 available but product choice PROPOSED).

- ADR needed: PersonalSpace bootstrap idempotency mechanism.

- PC-1 deployment topology (sync transport) still open pending YU-396.
