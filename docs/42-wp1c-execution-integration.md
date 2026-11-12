# 42 — WP1-C: Execution Integration (End-to-End Product Loop)

- **ID:** WP1-C
- **Owner:** W3 (Orchestration & Autonomy) for Assignment/Run; W5 (Delivery & Governance) for Artifacts/Review/Approval; W1 for Task/Project state updates; W2 for Session binding integration; W0 for contracts.
- **Workstream:** W3 + W5 + W1 + W2 (integration), W0 contracts.
- **Status:** DRAFT (PROPOSED). MRG NOT PASSED — see §15.
- **Depends on:** `WP1-A` (`docs/40`) stable interfaces (Project/Task/dependency/Current State) and `WP1-B` (`docs/41`) stable interfaces (Session/Provider/Runtime). PC-1..PC-5 (PC-6 inherited via WP1-B). Tech stack and license gates.
- **Personal-only:** single human Personal Owner; Agent is execution actor, never accountable owner.
- **Source of truth:** this document; `docs/27`–`docs/41`.

## 1. Goal

Complete the first end-to-end product loop:

> Personal Owner → create Project → create Task → assign Agent (Assignment) → execute (Run over a Session) → produce Artifact → Review → update Project Current State.

This slice integrates `WP1-A` (project/task substrate) and `WP1-B` (local session foundation) into one coherent flow. It proves Project-first orchestration works end-to-end on one real local Provider before broadening.

## 2. User journey (target)

1. Owner creates a Project + Task (from `WP1-A`).
2. Owner assigns the Task to a connected local Agent: an Assignment is created and a Run is dispatched over a Session (from `WP1-B`).
3. Agent executes in an isolated workspace; events stream to the client; an Artifact (commit/patch/doc/report) is produced.
4. Owner (or independent reviewer) Reviews the Artifact against the Task's acceptance criteria.
5. If changes requested, a new Run is created (Task stays `in_progress` via revision); Task identity/history preserved.
6. On accept (plus human approval if high-risk), Task state becomes `accepted`; dependent Tasks become `ready`; Project Current State reflects the accepted outcome.
7. Owner closes/reopens the app; Project, Task, Assignment, Run, Session, Artifact, Review restore without duplicate side effects.

## 3. Scope (F-groups touched, subset)

- F13 — Agent Delegation and Assignment (create/dispatch/cancel/retry).
- F15 — Run, Event, and Execution Lifecycle subset (Run states, checkpoints, handoff, failure, cancel, reconcile; durable events + replay).
- F24 — Deliverables and Artifacts subset (immutable reference: commit SHA/PR/patch/report/file; lineage to Task/Assignment/Run/Session/Agent).
- F25 — Review and Acceptance minimal (acceptance criteria + evidence; human review; accept/request changes/reject/defer; verify external state rather than trusting report).
- F26 — Permission, Risk, and Approval (high-risk actions require Owner approval bound to exact action+target+artifact).
- F07 — Task lifecycle full subset (`in_progress`, `in_review`, `accepted`, `rejected`, `blocked` transitions).
- F03 — Project Current State update on acceptance.
- F06 — dependency readiness on acceptance (`blocks` → successor `ready`).
- F10 — minimal Owner↔Agent communication (comments/messages with provenance) where needed for handoff.
- F09 — participants (Owner accountable vs Agent executor separation).

## 4. Non-scope (explicitly excluded)

- Multi-agent coordination (F14) — deferred.
- Workflow automation/triggers (F17), planning intelligence (F18), autonomous execution (F19) — deferred.
- Knowledge/memory (F20/F21), skills (F22), plugins/connectors beyond one Provider (F23) — deferred.
- Portfolio/initiative (F02), intake/triage (F08) — deferred.
- Web/Mobile full clients (F28 beyond desktop), universal search (F32), full attention center (F29 beyond minimal) — deferred.
- Multi-provider support (one Provider only, inherited from `WP1-B`).

## 5. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| `WP1-A` stable interfaces | DRAFT (not passed) | Project/Task/dependency/Current State persistence + recovery. |
| `WP1-B` stable interfaces | DRAFT (not passed) | Session/Provider/Runtime streaming + reconnect. |
| PC-1 authority invariant | Accepted 2026-11-12 | Daemon execution node; single Control Plane writer. |
| PC-2 cardinalities (Assignment/Run/Session/Review/Approval) | DRAFT | This WP exercises them end-to-end. |
| PC-3 state machines (Assignment/Run/Review/Approval/Task full) | DRAFT | Full Task states + Run/Review/Approval. |
| PC-4 (command/event/outbox/receipts) | DRAFT | Dispatch/cancel/checkpoint/handoff idempotency; external effect receipts. |
| PC-5 (mandate/approval) | DRAFT | High-risk approval bound to exact action+target+artifact. |
| PC-6 | Inherited from WP1-B | Session binding integration. |
| Tech stack / license | OPEN | Gate D0/D2. |

## 6. Domain model (integration)

### 6.1 Entities (new in this slice)

- **Assignment** — durable delegation record: Task → Agent (executor) + Runtime Node + scope/authority/acceptance contract. At most one active Assignment per Task.
- **Run** — one concrete execution attempt for an Assignment; idempotency key scoped to (Assignment, attempt); new Run for each genuine retry/revision.
- **SessionBinding** — now exercised: (session_id, task_id, run_id?, created_at, scope); at most one active binding per Session; audit trail.
- **Artifact** — durable output/immutable external pointer (commit SHA, PR, patch, report, file version) with lineage to Task/Assignment/Run/Session/Agent.
- **Review** — assesses a candidate Run/Artifact against acceptance criteria; states pending/in_progress/accepted/changes_requested/rejected/deferred.
- **Approval** — single-use, bound to exact (action, target, artifact content hash, policy version); invalidates if artifact hash changes.

### 6.2 Cardinalities (per PC-2)

- Task 1 → 0..N Assignment (at most one active).
- Assignment 1 → 0..N Run (attempts); Run belongs to exactly one Assignment.
- Run 0..N Session via SessionBinding; Session 0..1 Run at a time.
- SessionBinding: separate object; 0..N over time per Session; at most one active.
- Task 1 → 0..N Review (each binds a candidate Run/Artifact).
- Review 1 → 0..N Approval (single-use, content-hash bound).

### 6.3 State integration

- Task: `ready` → `in_progress` (Assignment dispatched + Run started) → `in_review` (Run produces Artifact + HANDOFF) → `accepted` (Review accept + approval if high-risk) | `rejected` | `changes_requested` (new Run, Task stays `in_progress`) | `blocked` | `cancelled`.
- Assignment: `pending` → `dispatched` → `running` → `completed` | `failed` | `cancelled`.
- Run: `created` → `started` → `checkpointed` (0..N) → `completed` | `failed` | `interrupted` | `cancelled`.
- Review: `pending` → `in_progress` → `accepted` | `changes_requested` | `rejected` | `deferred`.
- Approval: `pending` → `approved` | `denied` | `expired`; `approved` → `consumed` (single-use).
- Dependency readiness: when a Task becomes `accepted`, successor Tasks in `backlog` with all blockers resolved move to `ready`.

### 6.4 Invariants

- Project is the durable center; Task, Assignment, Run, Session are different objects.
- Human accountability ≠ Agent execution; Owner ≠ Executor always recorded.
- Agent completion (Run `completed`/HANDOFF) ≠ Task acceptance; Review required.
- Approval is single-use and bound to content hash; artifact change invalidates approval.
- External systems own live facts (e.g., GitHub PR/CI); store references and verified projections only.
- Run handoff is not Task acceptance.
- Session may only be reused across Runs/Tasks via explicit binding + context re-evaluation; never implicit.

## 7. API / Command / Event contracts (integration)

### 7.1 Commands

All commands carry the full PC-4 envelope (`command_id`, `idempotency_key`, `actor`, `workspace_id`, `project_id?`, `task_id?`, `intent`, `payload`, `expected_version`, `requested_effects`, `created_at`, `correlation_id`, `causation_id`).

- Assignment: `CreateAssignment`, `DispatchAssignment`, `CancelAssignment`, `ReassignTask`
- Run: `DispatchRun`, `CancelRun`, `RecordCheckpoint`, `RecordHandoff`, `RetryRun` (creates new Run)
- Artifact: `CreateArtifactRef`, `RefreshArtifact` (read-back external truth)
- Review: `SubmitReview`, `AcceptTask`, `RejectTask`, `RequestChanges`
- Approval: `RequestApproval`, `GrantApproval`, `DenyApproval`, `ConsumeApproval`
- Integration: `BindSessionToRun`, `UnbindSession`, `UpdateProjectCurrentState` (on acceptance), `ResolveDependency`

### 7.2 Events

- `AssignmentCreated`, `AssignmentStateChanged`
- `RunStarted`, `RunCheckpointed`, `RunCompleted`, `RunFailed`, `RunInterrupted`, `RunCancelled`
- `ArtifactCreated`, `ArtifactRefreshed`
- `ReviewSubmitted`, `TaskAccepted`, `TaskRejected`, `ChangesRequested`
- `ApprovalRequested`, `ApprovalGranted`, `ApprovalDenied`, `ApprovalConsumed`, `ApprovalInvalidated`
- `SessionBound`, `SessionUnbound`
- `ProjectCurrentStateUpdated`, `DependencyResolved`

### 7.3 Outbox / external side effects

- Domain state write + Outbox entry (pending external effect) in the same DB transaction.
- Background worker executes external effects (e.g., GitHub PR/CI read-back) with idempotency keys and retries/backoff.
- Unknown external outcome → receipt `unknown`, require reconciliation before retry (no blind retry).
- Events replayable from cursor for client sync/recovery.

## 8. Module ownership

| Module (proposed) | F-group | Owner | Responsibility in this WP |
|---|---|---|---|
| `assignment-delegation` | F13 | W3 | Assignment create/dispatch/cancel/retry, active-assignment concurrency |
| `run-event-lifecycle` | F15 | W2 | Run states, checkpoints, handoff, failure, cancel, reconcile, durable events |
| `artifacts` | F24 | W5 | Artifact references, lineage, immutable pointers, external read-back |
| `review-acceptance` | F25 | W5 | Acceptance criteria/evidence, review verdicts, accept/reject/changes |
| `permission-approval` | F26 | W5 | Mandate, risk tiers, approval bind/consume/invalidate, revocation |
| `task-lifecycle-state` (full) | F07 | W1 | Full Task state transitions including in_progress/in_review/accepted/rejected |
| `project-lifecycle` | F03 | W1 | Project Current State update on acceptance |
| `task-dependency-graph` | F06 | W1 | Readiness on acceptance |
| `agent-session-workbench` | F12 | W2 | Session binding integration (BindSessionToRun) |
| `participants` | F09 | W1 | Owner (accountable) vs Agent (executor) separation |
| `collaboration-comms` (minimal) | F10 | W1 | Owner↔Agent messages with provenance for handoff |

Shared files/contracts: W0 sole writer.

## 9. Worktree / branch

- Branch (to be created when MRG passes and WP1-A/WP1-B merged): `feat/wp1c-execution-integration`.
- Worktree: dedicated; likely stacked on WP1-A + WP1-B merge commits.
- Integration branch coordination by W0; no shared mutable checkout between streams.

## 10. Tests (required before implementation claim)

- **E2E (full loop):** create Project+Task → assign Agent → stream execution → produce Artifact → Review → accept → Project Current State updated; on one real Provider.
- **Recovery:** close/reopen app; restore Project/Task/Assignment/Run/Session/Artifact/Review without duplicate side effects.
- **Idempotency:** dispatch run duplicate returns stored result; cancel/checkpoint/handoff idempotent.
- **Concurrency:** stale version rejected; at most one active Assignment per Task.
- **Approval:** high-risk action requires approval; approval invalidated on artifact hash change; single-use consume.
- **Dependency:** successor becomes ready on acceptance.
- **Negative:** unauthorized action rejected; event gap marked explicit; external side effect unknown → reconciliation before retry.
- **External read-back:** if GitHub used, verify PR/CI truth rather than trusting report.

## 11. Acceptance criteria (slice)

- Owner can complete the full loop: Project → Task → Assignment → Run → Artifact → Review → accepted → Project Current State updated.
- Restart/reconnect restores state without duplicate side effects.
- At least one negative/recovery path tested and evidenced.
- All side effects read back from external truth where applicable.
- No multi-agent/workflow/knowledge/web scope creep.

## 12. Security constraints

- Personal-only authorization; no team/RBAC.
- Per-Project/per-Agent/tool scopes enforced in code/runtime, not prompts.
- High-risk external effects (public write, merge, destructive) require human approval bound to exact action/target/artifact content hash.
- Approval single-use; invalidates on artifact change.
- Mandate revocation mid-Run pauses at next checkpoint.
- Secrets never in code/docs/logs; provider credentials user-supplied.
- External systems own live facts; no stale local overwrite.
- AWRP not copied; license gate (Gate D0) respected.

## 13. Rollback

- If integration is unstable: keep WP1-A and WP1-B intact; revert WP1-C branch; no partial product code merged. Worktree discarded after evidence archived.
- External side effects produced during testing must be reconciled/read back before rollback.

## 14. Next Work Packages (after this slice)

- WP2: Multi-Agent coordination (F14) + workflow triggers (F17).
- WP3: Knowledge/memory/context (F20/F21) + skills (F22).
- WP4: Web client + attention center (F28/F29) + search (F32).
- WP5: Plugin/connector ecosystem (F23) + portability (F31).

## 15. MRG status (honest)

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | User result/scope/non-scope explicit | MET | This doc §1–4 |
| 2 | Module Contract versioned & accepted | NOT MET | No module contract authored; depends on WP1-A/WP1-B contracts |
| 3 | P0 dependencies accepted or isolated behind stable port | NOT MET | Depends on WP1-A/WP1-B passing; PC-2/PC-3/PC-4/PC-5 still DRAFT |
| 4 | Runtime/build/test infra known | PARTIAL | Node 24/Python 3.12/PostgreSQL 17 known; no build system; tech stack not frozen |
| 5 | File ownership/worktree/branch explicit | MET | §8 + §9 |
| 6 | Contract fixtures & acceptance tests exist | NOT MET | None yet; E2E not run |
| 7 | Security/secret/license/side-effect boundaries explicit | PARTIAL | Approval + side-effect read-back defined; license not selected (Gate D0) |
| 8 | Independent reviewer + stop/rollback conditions | MET | W0 is reviewer; rollback §13 |

**MRG: NOT PASSED.** Blockers: criteria 2, 3, 6 (and partial 4, 7). This WP cannot start until `WP1-A` and `WP1-B` pass their MRGs and expose stable interfaces. No empty packages, placeholder APIs, or fake tests may be used to claim implementation.
