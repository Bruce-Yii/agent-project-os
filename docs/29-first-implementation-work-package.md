# 29 — First Implementation Work Package (Personal Product Loop)

**Status:** DRAFT (PROPOSED). MRG NOT YET PASSED — see §9.
**Issue:** YU-392 (delivery target). **Owner:** W0.
**Personal-only:** single human Personal Owner.

## 1. Goal

Deliver the first runnable end-to-end product loop:

> Personal Owner → create Project → create Task → assign Agent (Assignment) → execute (Run over a Session) → produce Artifact → Review → update Project Current State.

This is a vertical slice, not the full 32-group product. It proves Project-first orchestration works end-to-end on one real local Provider before broadening.

## 2. User journey (target)

1. Owner opens app, creates a Project (name, goal, current state).
2. Owner creates a Task under the Project (scope, acceptance criteria).
3. Owner assigns the Task to a connected local Agent (Assignment + Run).
4. Agent executes in an isolated workspace; events stream to the client; an Artifact (e.g., commit/patch/doc) is produced.
5. Owner (or independent reviewer) Reviews the Artifact against acceptance criteria.
6. On accept, Task state updates; Project Current State reflects the accepted outcome; next dependent Task becomes ready.
7. Owner closes/reopens the app; Project and recoverable execution state restore without duplicate side effects.

## 3. Scope (F-groups touched)

- F01 (single Personal Owner workspace), F03 (Project lifecycle), F04 (Project structure subset), F05 (Task/work package subset), F06 (dependency subset — blocks/ready only), F07 (Task lifecycle/current state), F09 (Owner + Agent participants only), F10 (minimal Owner↔Agent communication), F11 (Agent registry minimal), F12 (local Session for one Provider), F13 (assignment), F15 (Run/event lifecycle subset), F16 (local runtime node minimal), F24 (artifact reference), F25 (review/acceptance minimal), F26 (personal authorization + approval for high-risk).

## 4. Non-scope (explicitly excluded from this slice)

- Organization/members/invitations/team roles/RBAC/multi-tenancy (personal phase).
- Multi-Agent coordination beyond single assignment (F14) — deferred.
- Workflow automation/triggers (F17), planning intelligence (F18), autonomous execution (F19) — deferred.
- Knowledge/memory (F20/F21), skills (F22), plugins/connectors beyond one Provider (F23) — deferred.
- Portfolio/initiative (F02), intake/triage (F08) — deferred.
- Web/Mobile clients (F28 beyond desktop), universal search (F32), attention center full (F29 beyond minimal) — deferred.
- Multi-provider support (one Provider only in this slice).

## 5. Dependencies

- P0 contracts (PC-1 authority topology, PC-2 object cardinalities, PC-3 state machines) must be accepted.
- One real local Provider available (Codex/OpenCode/Claude/Pi — pick one with structured API).
- PostgreSQL (host instance available) for canonical state + DBOS (if adopted).
- Local Runtime Daemon skeleton (process supervision, session discovery).

## 6. Domain model (minimal)

Entities: Workspace (personal, 1 owner), Project, Task, Assignment, Run, Session, SessionBinding, Artifact, Review, Approval (high-risk only), Participant (Owner | Agent | Runtime).
Invariants: Project is durable center; Task ≠ Assignment ≠ Run ≠ Session; Owner ≠ Executor; Agent completion ≠ acceptance; external systems own live facts.

## 7. API / Command / Event contracts (minimal)

Commands: CreateProject, UpdateProjectState, CreateTask, UpdateTask, CreateAssignment, DispatchRun, CancelRun, CreateArtifactRef, SubmitReview, AcceptTask, RejectTask.
Events: ProjectCreated, ProjectStateChanged, TaskCreated, TaskStateChanged, AssignmentCreated, RunStarted, RunCheckpointed, RunCompleted, RunFailed, ArtifactCreated, ReviewSubmitted, TaskAccepted, TaskRejected.
All commands carry actor, workspace/project/task id, idempotency key, expected version. Outbox for external side effects (GitHub PR/CI read-back).

## 8. Module ownership

- `workspace-personal` (F01) — W1
- `project-lifecycle` (F03/F04) — W1
- `task-work-package` (F05/F06/F07) — W1
- `participants` (F09/F10 minimal) — W1
- `agent-registry` (F11 minimal) — W2
- `session-workbench` (F12 single Provider) — W2
- `assignment-delegation` (F13) — W3
- `run-event-lifecycle` (F15) — W2
- `execution-environments` (F16 minimal, local daemon) — W2
- `deliverables-artifacts` (F24 minimal) — W5
- `review-acceptance` (F25 minimal) — W5
- `permission-approval` (F26 personal) — W5
- Desktop client (F28 subset) — W6

Shared contracts: W0 sole writer (PC-1..PC-6).

## 9. MRG status (honest)

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | User result/scope/non-scope explicit | MET | This doc §1–4 |
| 2 | Module Contract versioned & accepted | NOT MET | PC-1/PC-2 DRAFT; PC-3/PC-5/PC-6 not written |
| 3 | P0 dependencies accepted or isolated behind stable port | NOT MET | PC-1/PC-2 not accepted |
| 4 | Runtime/build/test infra known | PARTIAL | Node 24/Python 3.12 known; no build system; tech stack not frozen |
| 5 | File ownership/worktree/branch explicit | MET | This doc §8 + branch naming |
| 6 | Contract fixtures & acceptance tests exist | NOT MET | None yet |
| 7 | Security/secret/license/side-effect boundaries explicit | PARTIAL | Personal authorization defined; license not selected; side-effect read-back defined in PC-1 |
| 8 | Independent reviewer + stop/rollback conditions | MET | W0 is reviewer; stop/rollback in §11 |

**MRG: NOT PASSED.** Blockers: criteria 2, 3, 6 (and partial 4, 7). No implementation may start until PC-1/PC-2 (and PC-3) are accepted and contract fixtures exist.

## 10. Worktree / branch

- Branch: `feat/wp1-personal-product-loop` (to be created when MRG passes).
- Worktree: dedicated (one per workstream).
- Shared files: W0 sole writer for contracts; W1/W2/W3/W5/W6 own their modules.

## 11. Tests (required before implementation claim)

- Contract tests: command idempotency, expected-version stale rejection, duplicate event dedup, retry, crash recovery, offline reconciliation.
- E2E: journey §2 end-to-end on one real Provider, including restart/reconnect without duplicate side effects.
- Negative: unauthorized action rejected, approval bound to changed artifact invalidated, event gap marked explicit.

## 12. Acceptance criteria (slice)

- Owner can create Project + Task, assign to one local Agent, see streamed execution, produce Artifact, Review, accept → Project Current State updated.
- Restart/reconnect restores state without duplicate side effects.
- At least one negative/recovery path tested and evidenced.
- All side effects read back from external truth (GitHub) where applicable.

## 13. Security constraints

- Personal authorization only (no team/RBAC in this phase).
- Per-Project/per-Agent/tool scopes enforced in code/runtime, not prompts.
- High-risk external effects require human approval bound to exact action/target/artifact.
- Secrets never in code/docs/logs; provider credentials user-supplied.
- AWRP source not copied (license gate).

## 14. Rollback

- If PC-1/PC-2 rejected or Provider incompatible: revert to research/specification mode; no partial product code merged. Worktree discarded after evidence archived.

## 15. Next Work Packages (after this slice)

- WP2: Multi-Agent coordination (F14) + workflow triggers (F17).
- WP3: Knowledge/memory/context (F20/F21) + skills (F22).
- WP4: Web client + attention center (F28/F29) + search (F32).
- WP5: Plugin/connector ecosystem (F23) + portability (F31).

## 16. Conclusion

This Work Package defines the first runnable slice and its MRG gaps. **MRG is not passed** — blockers are P0 contract acceptance (PC-1/PC-2/PC-3) and contract fixtures. W0 must converge PC-1/PC-2 into accepted ADRs and produce fixtures before any implementation branch is created. No empty packages, placeholder APIs, or fake tests may be used to claim implementation.
