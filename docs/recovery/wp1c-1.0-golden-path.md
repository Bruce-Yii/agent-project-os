# WP1-C — 1.0 Golden Path: Acceptance Scenarios, API Surface, Minimal UI, Dependency Map

- **Status:** PROPOSED acceptance oracle, pre-implementation. Not a verdict, not a demo with results.
- **Date:** 2026-11-13. **Owner:** W0-RECOVERY (planning); implementation owners per docs/42 §8.
- **Scope:** the first end-to-end slice in docs/42 §1 and its acceptance criteria §11. "1.0" here means that slice; it is not Release Acceptance (docs/46 §5).
- **Freeze rule:** per docs/46 §1.1 these scenarios freeze before implementation; weakening or reinterpreting them requires a reviewed contract delta.
- **Grounding:** docs/27–28 (PC-1/PC-2), docs/36–39 (PC-3..PC-6), docs/40/41/42 (work packages), docs/43 (WP1-A contract, quarantined), docs/46, docs/09.

## 0. Honest position today (2026-11-13)

| Claim | Current fact |
|---|---|
| A runnable 1.0 loop exists | No. Recovery base `8f2b507` is docs-only; docs/23 §3 records no src/tests/build. |
| WP1-A is accepted | No. Gate 0 REJECTED; branch `b6b828a` quarantined (asset ledger §C; docs/47 §0/§3). |
| WP1-A "MRG PASSED" can be cited as acceptance | No. docs/46 §8: MRG is readiness, not Module Acceptance. |
| WP1-B is ready | No. MRG NOT PASSED; PC-6 DRAFT; no Provider E2E (docs/41 §15). |
| WP1-C is ready | No. MRG NOT PASSED; no module contract; waits on A+B (docs/42 §15). |

Consequence: every scenario below is an oracle to execute after gates pass. None is marked passed.

## 1. Acceptance scenarios

**Actors:** `Owner` = PersonalOwner (accountable human); `CP` = Control Plane (sole canonical writer, PC-1); `Daemon` = Local Runtime Node (execution only); `Agent` = executor; `Provider` = one real pinned Provider (WP1-B).

**Preconditions:** disposable PostgreSQL; one bootstrapped PersonalSpace; one discovered Provider; clean checkout at the submitted SHA; no seeded business state.

**Evidence minimum (all scenarios):** the docs/46 §6 packet — repo + full head/base SHA, changed paths, CI run whose head SHA equals the candidate, command receipts, event ids/cursors, read-back rows, independent reviewer verdict. Screenshots are supplementary only.

### GP-01 — Create PersonalSpace/Project/Goal/Task (positive)

- **Trigger:** fresh install with no PersonalSpace; Owner creates the first Project.
- **Actors:** Owner, CP.
- **Steps:** `BootstrapPersonalSpace` twice with the same idempotency key → `CreateProject` → `ActivateProject` → `CreateGoal` → `CreateTask` T1 with acceptance criteria → `CreateTask` T2 → read back Project, Goal, Tasks.
- **Expected state:** exactly one PersonalSpace; Project `draft`→`active` (guard: goal + at least one task); Goal under Project; T1/T2 `backlog`; versions advance once per aggregate; duplicate bootstrap returns the stored receipt and creates nothing.
- **Evidence:** two bootstrap receipts equal; Project/Task rows with versions; event sequence from cursor 0; restart read-back.

### GP-02 — Dependency and ready-work (positive)

- **Trigger:** T2 must not start until T1 is done.
- **Actors:** Owner, CP.
- **Steps:** `AddDependency(T1 blocks T2)` → attempt `AddDependency(T2 blocks T1)` → query ready work → later accept T1 (GP-06) → re-query.
- **Expected state:** edge stored with provenance; cycle rejected at creation with zero mutation and no partial edge; T2 stays `backlog` while T1 is non-terminal; on T1 `accepted`, T2 `backlog`→`ready`, with `DependencyResolved` + `TaskStateChanged` emitted once.
- **Evidence:** edge row; cycle rejection reason plus unchanged edge/version counts; ready-work query before/after; ordered events.

### GP-03 — Agent Session created and explicitly bound (positive)

- **Trigger:** T2 `ready`; Owner delegates it.
- **Actors:** Owner, Daemon, Provider, CP.
- **Steps:** `DiscoverProviders` → `GetProviderCapabilities` → `CreateSession` (direct, zero bindings) → `CreateAssignment(T2, Agent, RuntimeNode)` → `DispatchAssignment` (Assignment `dispatched`, Run `created`) → `BindSessionToRun(session, task, run)` → `DispatchRun` → Agent ACK (`Run started`).
- **Expected state:** Session keeps OS identity, `ProviderSessionRef`, `RuntimeProcess`, `SessionConnection` distinct (PC-2 §2.7, docs/39 §1); exactly one active binding; one active Assignment per Task; binding auditable with scope; no implicit rebinding.
- **Evidence:** capability matrix with native/emulated/unsupported/unknown; session/binding/assignment rows; `SessionBound`; proof Run `created` precedes bind and `started` follows ACK.

### GP-04 — Run execution, checkpoints, handoff (positive)

- **Trigger:** Assignment dispatched and session bound.
- **Actors:** Agent, Daemon, Provider, CP.
- **Steps:** stream `MessageDelta`/`ToolCallStarted`/`PermissionRequested` over WS → `RespondToPermissionRequest` → `RecordCheckpoint` (≥1) → Agent finishes → `RecordHandoff` → read Run, Assignment, Task.
- **Expected state:** Run `created`→`started`→`checkpointed`(0..N)→`completed` only after handoff is verified; Assignment `dispatched`→`running`→`completed`; Task `ready`→`in_progress`, not `in_review`/`accepted` (Artifact not yet registered); no second Run from retries at this point.
- **Evidence:** cursor-ordered events with provider provenance; checkpoint rows; handoff payload + verification; state read-back; exactly one Run per attempt key.

### GP-05 — Artifact registration and evidence chain (positive)

- **Trigger:** Run handoff references an output (commit SHA / report / patch).
- **Actors:** Agent, CP, Owner (read).
- **Steps:** `CreateArtifactRef` with immutable ref + lineage → `RefreshArtifact` read-back of external truth → attach evidence checklist to the candidate Review → Task moves to `in_review`.
- **Expected state:** Artifact immutable pointer with hash and lineage Task/Assignment/Run/Session/Agent (PC-2 §2.9, docs/42 §6.1); external truth read back and timestamped; duplicate create returns the same ref; Task `in_progress`→`in_review` only when Artifact + HANDOFF exist (docs/36 §2).
- **Evidence:** artifact row/hash; read-back result; `ArtifactCreated`/`ArtifactRefreshed`; Task version bump; no mutable copy of an external fact.

### GP-06 — Human review → accepted → dependency unblock → Current State (positive)

- **Trigger:** Task `in_review` with Artifact + evidence.
- **Actors:** Owner (reviewer), CP; Agent cannot self-approve.
- **Steps:** `SubmitReview` (`pending`→`in_progress`) → verify acceptance criteria, artifact hash, external CI/PR → `AcceptTask` → if risk tier is public_write/merge/destructive: `RequestApproval`→`GrantApproval`→`ConsumeApproval` → acceptance-driven `UpdateProjectCurrentState`.
- **Expected state:** Review `accepted`; Task `accepted`; T2 `ready` (GP-02); Project remains `active`; Current State structured fields + derived snapshot carry freshness/source and a new version; `AcceptTask` and `UpdateProjectCurrentState` are one logical unit (both effects visible on the receipt or neither, retry by idempotency key); events `ReviewSubmitted`, `TaskAccepted`, `DependencyResolved`, `ProjectCurrentStateUpdated` once each.
- **Evidence:** Review bound to the exact Run/Artifact; approval bound to (action, target, artifact hash, policy version) and consumed once; before/after Current State; event order; read-back.

### GP-07 — Persist and process restart (positive/recovery)

- **Trigger:** GP-06 done; Owner closes the app and the Control Plane is killed.
- **Actors:** Owner, CP, Daemon.
- **Steps:** record cursor + versions → `SIGKILL` CP (variant A; variant B also kills the Daemon) → restart CP → client reconnects from cursor → read all entities → replay events.
- **Expected state:** Project, Goal, Tasks, edge, Assignment, Run, Session, binding, Artifact, Review, Approval, Current State all restore; versions unchanged; no duplicate rows; idempotency records and receipts survive; no re-execution; client projection converges.
- **Evidence:** pre/post dumps (ids, versions, counts); exact PIDs and timestamps of what was restarted; empty replay diff; receipt/idempotency tables.

### GP-N1 — Stale version rejected (negative)

- **Trigger:** two clients hold Task version V; client A writes first.
- **Actors:** Owner (two connections), CP.
- **Steps:** both load V → A `UpdateTask(expected_version=V)` → B `UpdateTask(expected_version=V)` → B refreshes and retries at V+1.
- **Expected state:** A accepted at V+1; B rejected with `STALE_VERSION` (docs/37 §3) and the current version, zero mutation, no event append, no silent overwrite; retry at V+1 succeeds.
- **Evidence:** B receipt reason; row hash/event count unchanged after B; retry receipt.

### GP-N2 — Cross-space access rejected (negative)

- **Trigger:** fixture creates a second PersonalSpace S2; a command targets S1's Project/Task while declaring S2.
- **Actors:** Owner, CP.
- **Steps:** attempt `UpdateProject`, `CreateTask`, `TransitionTaskState`, `UpdateProjectCurrentState`, and a read by id with `personal_space_id=S2` against S1 objects.
- **Expected state:** fail-closed rejection (docs/40 §10/§12, docs/46 §8); zero mutation; audit entry; response leaks no S1 payload.
- **Evidence:** receipts; audit rows; unchanged S1 state hash; read denial.

### GP-N3 — Idempotency replay and conflict (negative)

- **Trigger:** at-least-once delivery duplicates a command.
- **Actors:** Owner, CP.
- **Steps:** `CreateTask` key K/payload P → resend identical → resend key K with different payload P'.
- **Expected state:** first creates one Task; replay returns the identical stored result/receipt with no new event/version; same key + different payload is rejected as a conflict (docs/46 §8), not merged or silently applied.
- **Evidence:** equal receipt/result; Task count 1; version unchanged; conflict rejection.

### GP-N4 — Run completion is not acceptance (negative)

- **Trigger:** Run `completed` with handoff; Owner tries to shortcut review.
- **Actors:** Owner, Agent, CP.
- **Steps:** `AcceptTask` while Task `in_progress` → `AcceptTask` from `in_review` with no Review/evidence → `SubmitReview` by actor `Agent` → `AcceptTask` by `Agent`.
- **Expected state:** all rejected with an exact reason (invalid transition / evidence required / unauthorized); Task unchanged; no Current State change; Agent cannot self-approve (docs/38 §5, docs/42 §6.4).
- **Evidence:** four rejection receipts; unchanged state; audit.

### GP-N5 — Approval binding, invalidation, single use (negative)

- **Trigger:** artifact is high-risk (public write/merge/destructive), or the artifact changes after approval.
- **Actors:** Owner, Agent, CP.
- **Steps:** `RequestApproval` for (action, target, hash) → replace artifact (new hash) → `GrantApproval` old hash → attempt execution → `ConsumeApproval` twice.
- **Expected state:** old approval `ApprovalInvalidated` and cannot authorize the new artifact; a grant is valid only for the exact hash; consume once; second consume rejected; execution blocked without a valid consumed approval (docs/38 §5, docs/42 §6.4).
- **Evidence:** approval rows/status; hash comparison; blocked execution receipt; invalidation event.

### GP-R1 — Crash mid-Run and reconciliation (recovery)

- **Trigger:** Provider process dies after `Run started`, before handoff.
- **Actors:** Owner, Daemon, CP.
- **Steps:** kill the Provider process → reconnect/reconcile → inspect Run/Assignment/Session → `RetryRun` or `CancelRun`.
- **Expected state:** `RuntimeProcess` `failed`/`exited` while the Session may stay attachable; Run `interrupted` (resumable) or `failed`; Assignment not silently duplicated; retry creates a new Run with a new attempt key while the old Run is retained; Task never `in_review` without a verified handoff; host truth shown, not simulated.
- **Evidence:** process exit record; Run transition history; one active Run; new Run id on retry; host offline/online truth.

### GP-R2 — Stream gap marked explicit (recovery)

- **Trigger:** WS drops mid-stream; Provider history is volatile.
- **Actors:** Owner, Daemon, Provider, CP.
- **Steps:** disconnect → reconnect with last cursor → `ReconcileHistory(cursor)` → compare transcript and state.
- **Expected state:** missed events replay from spool/history; if unrecoverable, an explicit `EventGap` event and UI gap marker; never claim a complete transcript; canonical state derives only from reconciled events.
- **Evidence:** cursor before/after; `EventGap`/`Reconciled` records; transcript diff; explicit gap surfaced.

## 2. API and command/event surface

Baseline: Fastify 5 + TypeBox REST/OpenAPI; SSE for Project/Task/Run/Review feeds; WebSocket for Session (ADR-045 §4/§15).

**Write path (single):** `POST /v1/commands` — every write is a PC-4 command. Body is the docs/37 §1 envelope: `command_id`, `idempotency_key` (scoped actor+intent), `actor`, `personal_space_id` (alias `workspace_id`), `project_id?`, `task_id?`, `intent`, `payload`, `expected_version`, `requested_effects`, `created_at`, `correlation_id`, `causation_id`. Response is a receipt: `{command_id, status, reason?, aggregate_version, event_ids[], result}`.

**Read paths (proposed canonical shape; become binding in WP1-C module contract v0.1):**

- `GET /v1/personal-space`, `/v1/projects`, `/v1/projects/{id}`, `/v1/projects/{id}/goals`, `/v1/projects/{id}/tasks`, `/v1/projects/{id}/current-state`, `/v1/projects/{id}/events?cursor=`
- `GET /v1/tasks/{id}`, `/v1/tasks/{id}/graph`
- `GET /v1/assignments/{id}`, `/v1/runs/{id}`, `/v1/runs/{id}/events?cursor=`
- `GET /v1/artifacts/{id}`, `/v1/reviews?state=pending`, `/v1/reviews/{id}`, `/v1/approvals/{id}`
- `GET /v1/providers`, `/v1/sessions`, `/v1/sessions/{id}`, `/v1/sessions/{id}/events?cursor=`
- `GET /v1/projects/{id}/events` = SSE; `WS /v1/sessions/{id}/stream` = interactive session channel.

**Commands — required exact set, by owner contract:**

- WP1-A (docs/40 §7.1): `BootstrapPersonalSpace`, `CreateProject`, `UpdateProject`, `ActivateProject`, `PauseProject`, `ResumeProject`, `ArchiveProject`, `RestoreProject`, `CloseProject`, `UpdateProjectCurrentState`, `CreateGoal`, `UpdateGoal`, `DeleteGoal`, `CreateTask`, `UpdateTask`, `ReparentTask`, `AddDependency`, `RemoveDependency`, `TransitionTaskState`, `ResolveDependency`.
- WP1-B (docs/41 §7.1): `DiscoverProviders`, `GetProviderCapabilities`, `CreateSession`, `AttachSession`, `ResumeSession`, `SendMessage`, `SteerActiveTurn`, `QueueFollowUp`, `InterruptTurn`, `CancelSession`, `CloseSession`, `SubscribeEvents`, `ReconcileHistory`, `AcquireControllerLease`, `ReleaseControllerLease`, `RespondToPermissionRequest`.
- WP1-C (docs/42 §7.1): `CreateAssignment`, `DispatchAssignment`, `CancelAssignment`, `ReassignTask`, `DispatchRun`, `CancelRun`, `RecordCheckpoint`, `RecordHandoff`, `RetryRun`, `CreateArtifactRef`, `RefreshArtifact`, `SubmitReview`, `AcceptTask`, `RejectTask`, `RequestChanges`, `RequestApproval`, `GrantApproval`, `DenyApproval`, `ConsumeApproval`, `BindSessionToRun`, `UnbindSession` (+ `UpdateProjectCurrentState`, `ResolveDependency` reused from A, emitted on acceptance).

**Events — required exact set:**

- WP1-A (docs/40 §7.2): `PersonalSpaceBootstrapped`, `ProjectCreated`, `ProjectUpdated`, `ProjectStateChanged`, `ProjectCurrentStateUpdated`, `GoalCreated`, `GoalUpdated`, `GoalDeleted`, `TaskCreated`, `TaskUpdated`, `TaskReparented`, `TaskStateChanged`, `DependencyAdded`, `DependencyRemoved`, `DependencyResolved`.
- WP1-B (docs/41 §7.2): `SessionCreated`, `SessionAttached`, `SessionResumed`, `SessionStateChanged`, `SessionClosed`, `HostOffline`, `MessageDelta`, `MessageFinalized`, `TurnStarted`, `TurnCompleted`, `Interrupted`, `Failed`, `ToolCallStarted`, `ToolCallResult`, `PermissionRequested`, `PermissionResolved`, `Checkpoint`, `Heartbeat`, `EventGap`, `Reconciled`.
- WP1-C (docs/42 §7.2): `AssignmentCreated`, `AssignmentStateChanged`, `RunStarted`, `RunCheckpointed`, `RunCompleted`, `RunFailed`, `RunInterrupted`, `RunCancelled`, `ArtifactCreated`, `ArtifactRefreshed`, `ReviewSubmitted`, `TaskAccepted`, `TaskRejected`, `ChangesRequested`, `ApprovalRequested`, `ApprovalGranted`, `ApprovalDenied`, `ApprovalConsumed`, `ApprovalInvalidated`, `SessionBound`, `SessionUnbound`, `ProjectCurrentStateUpdated`, `DependencyResolved`.

**Envelope note:** WP1-A omits `requested_effects` and WP1-B uses a minimal envelope (docs/40 §7.1, docs/41 §7.1). For the integrated path WP1-C requires the full envelope on all commands (docs/42 §7.1); the WP1-C contract must state that bound Session commands carry `project_id`/`task_id` as a compatible superset, not a new contract.

**Required rejection semantics:** `STALE_VERSION` (docs/37 §3); idempotent replay returns the stored result, same-key/different-payload conflicts (docs/37 §2, docs/46 §8); unauthorized/cross-space fail-closed with zero mutation (docs/40 §12, docs/46 §8); invalid transition/cycle (docs/36, docs/40 §10); unsupported capability shown unavailable, never simulated (docs/41 §6.3); unknown external outcome = receipt `unknown` + reconciliation before retry (docs/37 §8, docs/42 §7.3); approval single-use and invalidated on hash change (docs/38 §5).

## 3. Minimal navigable UI plan

Thin client over the API; never canonical (PC-1). Information architecture from docs/09 §2/§4 and the WP1-C journey only; no design system, no portfolio/command palette/attention center/full F29.

| View (route proposed) | Purpose | Must show | Actions |
|---|---|---|---|
| Project landing `/projects/{id}` | one Project's truth at a glance | lifecycle status, Current State summary + freshness, goals, task counts by state, review-queue count, recent runs | activate/pause/resume/archive; jump to board, Current State, reviews |
| Task board `/projects/{id}/work` | ready work and flow | list + board columns `backlog/ready/in_progress/in_review/accepted`, blocked-by/blocking badges, owner vs executor, task detail panel (criteria, deps, assignments, runs, artifacts, reviews) | create/edit task, add dependency, assign Agent, open session/run |
| Session workbench `/sessions/{id}` | live execution and binding | binding banner (Task/Run, scope), Session vs Process vs Connection vs Host status, provider capability matrix, cursor position, live stream, tool/permission events, gap marker, artifact links | send, steer, queue, interrupt, respond to permission, open artifact |
| Review inbox `/reviews` | human decision queue | pending/in_progress reviews, Task + evidence checklist, artifact ref/hash/diff, external read-back status, risk tier, prior runs/revisions | accept, request changes, reject, defer, request/grant/consume approval |
| Current State `/projects/{id}/current-state` | durable Project truth | structured fields + derived snapshot, source + freshness, version/history, accepted outcomes and links | read-only in 1.0 |

**Navigation:** landing → board → task panel → session/run → artifact → review → back to landing; after a review accept, the newly ready successor task and the Current State delta are visible without leaving context. Every screen keeps Project/Task context (docs/09 §4).

**Honesty rules in UI (docs/09 §7):** show actual state, never optimistic success; distinguish waiting/blocked/running/handoff/accepted; owner ≠ executor; one click to evidence/external source; explicit gap/unknown, never a fabricated complete transcript; desktop close ≠ session end; host offline ≠ agent running.

## 4. Dependency map: what must be accepted before each step

"Accepted" = an independent verdict at a remote SHA; readiness (MRG) is not acceptance (docs/46 §2/§5). As of 2026-11-13 no row is green.

| 1.0 step | Must be accepted first | Contract/gate | Current |
|---|---|---|---|
| GP-01, GP-02 | WP1-A module contract v0.1 re-issued after Gate 0; PC-1/2/3/4/5 for WP1-A scope; persistence + migrations | docs/43, docs/40 §7; Gate 0 + Module Acceptance | BLOCKED — Gate 0 REJECTED; docs/43 quarantined; no re-verdict |
| GP-03 | WP1-B Session/Provider/Runtime contract; PC-6 accepted or isolated behind a stable Port; provider E2E + license | docs/41 §6/§7/§10; PC-6 docs/39 | BLOCKED — MRG NOT PASSED; no provider E2E |
| GP-04 | WP1-B command/receipt + cursor; WP1-C Assignment/Run contract; PC-3 Assignment/Run states; PC-4 dispatch/checkpoint/handoff idempotency | docs/41 §7.3/§7.4, docs/42 §6.3/§7 | BLOCKED — WP1-C contract absent; PC-3/PC-4 DRAFT globally |
| GP-05 | F24 Artifact/lineage contract (WP1-C); external read-back rule | docs/42 §6.1/§7.3; docs/37 §8 | BLOCKED |
| GP-06 | F25 Review + F26 Approval contract; PC-5 mandate/approval accepted (only the Owner-only subset is accepted now); F06 readiness with `accepted` terminal | docs/42 §6.3/§6.4; docs/38 §5 | BLOCKED — approval slice not accepted |
| GP-07 | WP1-A persistence/recovery; WP1-B spool/cursor; WP1-C outbox/receipts; PC-1 | docs/40 §6.4/§7.3; docs/41 §7.3; docs/37 §6/§9 | BLOCKED |
| GP-N1..N3 | PC-4 command envelope/idempotency/expected_version; PC-2 cross-space boundary; PC-5 fail-closed | docs/37 §2/§3; docs/40 §12; docs/46 §8 | BLOCKED with WP1-A acceptance |
| GP-N4, N5 | PC-3 review/approval states; PC-5 approval binding; docs/42 invariants | docs/36 §6/§7; docs/38 §5 | BLOCKED |
| GP-R1, R2 | PC-6 reconnect/reconcile + EventGap; WP1-B provider spool; WP1-C unknown-outcome rule | docs/39 §4/§7; docs/37 §8 | BLOCKED |

Ordering: GP-01/02 → GP-03 → GP-04 → GP-05 → GP-06 → GP-07; negatives and recovery paths can run in parallel once the objects exist, but each must run on the same candidate SHA and appear in the same evidence packet.

## 5. Honest demo plan

**Can be demonstrated today (2026-11-13):** documentation and contracts only — 32-group scope, domain/state models, WP1-A/B/C boundaries, acceptance/evidence policy. No part of the 1.0 loop can be run: recovery base `8f2b507` has no `package.json`, `src/`, `tests/`, or migrations (docs/23 §3). WP1-A code at `b6b828a` is quarantined and Gate 0 REJECTED (asset ledger §C; docs/47 §3); it must not be presented as a working slice.

**Blocked, with the exact blocker:**

- Any WP1-A demo: Gate 0 (destructive-test isolation, complete CI test set, negative preflight) not passed; no Module Acceptance.
- Any Session/Run demo: WP1-B MRG not passed; PC-6 DRAFT; no real Provider E2E; no license-clean adapter.
- Any review/Current State demo: WP1-C has no accepted module contract, no implementation, MRG NOT PASSED.

**The first honest live demo becomes possible only when:** (1) Gate 0 PASS with an independent verdict at a new remote SHA; (2) WP1-A Module Acceptance on the real consumer journey; (3) WP1-B Module Acceptance including Provider E2E + reconnect/gap; (4) WP1-C module contract v0.1 accepted + MRG PASSED.

**Local startup command (once code exists):** none exists today. The repository's canonical command table records the dev entry point as `pnpm dev` with status NOT CONFIGURED (docs/23 §6); no `package.json` exists at the recovery base, so any other command would be invented. After WP1-C lands, the exact sequence must be the one written into docs/23 §6 and verified from a clean checkout at the submitted SHA (docs/46 §4.6). Expected form, to be confirmed there:

```powershell
pnpm install --frozen-lockfile
pnpm dev   # documented canonical entry point; NOT CONFIGURED today
```

`DATABASE_URL` and Provider credentials come from the environment/OS credential store, never from the repo (docs/41 §12). Acceptance runs use `pnpm test:contract`, `pnpm test:integration`, `pnpm test:e2e` (Playwright, ADR-045 §16) at the exact submitted SHA; a green suite is evidence for those cases only, not Module or Release acceptance (docs/46 §4).

**Demo script that would be honest today:** a five-minute document walkthrough of this plan and the gate status; state explicitly that no loop is runnable.
