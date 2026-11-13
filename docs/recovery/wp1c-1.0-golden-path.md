# WP1-C 1.0 Golden Path — Acceptance Tests & UI Plan (PREPARATION ONLY)

**Owner:** W0-RECOVERY (planning; no implementation)
**Date:** 2026-11-13
**Status:** PREPARATION. WP1-C may begin only after WP1-A + WP1-B Module Acceptance.
**Source:** docs/29, docs/41, docs/42, docs/46, docs/09, docs/36-39, docs/27-28.

## 1. 1.0 acceptance test scenarios

Each scenario must pass (positive + negative + recovery) before 1.0 Release Acceptance.

### S1: Create Project + Goal + Task
- **Trigger:** Personal Owner creates a Project, then a Goal, then a Task.
- **Steps:** POST project → POST goal (linked to project) → POST task (linked to project+goal) → GET project current state.
- **Expected:** All objects persisted; task belongs to project; current state updated atomically.
- **Negative:** Task with nonexistent project → 404; task with stale expectedVersion → 409.
- **Recovery:** Process restart → all objects survive (restart.test.ts pattern).

### S2: Task dependency (wouldCreateCycle)
- **Trigger:** Owner adds dependency edge Task A → Task B.
- **Steps:** POST dependency(A,B) → GET task A deps → attempt dependency(B,A) (cycle).
- **Expected:** First succeeds; second rejected (cycle detected).
- **Negative:** Self-dependency (A→A) rejected; duplicate edge rejected (idempotency).

### S3: Agent Session bind to Task
- **Trigger:** Owner binds a direct Session to a Task (explicit, auditable).
- **Steps:** Create Session (no task) → POST binding(session, task) → GET session bindings.
- **Expected:** Binding persisted; Session identity distinct from Task identity.
- **Negative:** Binding across PersonalSpace boundary → 403; binding to nonexistent task → 404.

### S4: Run execution + artifact + evidence
- **Trigger:** Owner assigns Task to Agent → Run starts → Agent produces artifact + evidence.
- **Steps:** POST assignment(task, agent) → Run created → Agent executes → artifact uploaded → evidence recorded → Run completed.
- **Expected:** Run state transitions: pending→running→completed; artifact linked to Run; evidence attached.
- **Negative:** Run without assignment rejected; artifact without evidence rejected for acceptance.

### S5: Human review + acceptance
- **Trigger:** Owner reviews Run output and accepts or rejects.
- **Steps:** POST review(run, decision=accept) → Run state → accepted; OR decision=reject → Run state → rejected (with reason).
- **Expected:** Review bound to exact artifact content hash (single-use); acceptance ≠ Agent completion.
- **Negative:** Review with changed artifact hash → 409 (approval bound to content).

### S6: Current State persist + restart recovery
- **Trigger:** After acceptance, Project Current State updated.
- **Steps:** Accept run → Current State updated (atomic dual-table) → kill process → restart → GET current state.
- **Expected:** Current state survives restart; no swallowed errors (no `.catch(() => {})`).
- **Negative:** If current_states write fails → transaction rollback, not OK.

### S7: Idempotency replay
- **Trigger:** Duplicate command with same idempotency key.
- **Steps:** POST command (key=K) → 200 + result → POST command (key=K) again → same result, no duplicate side effect.
- **Expected:** Second returns cached result; no duplicate Run/Session/artifact.
- **Negative:** Different key → new execution; expired key → re-execution.

### S8: CAS / stale version
- **Trigger:** Concurrent updates to same Task.
- **Steps:** GET task (version=V) → two concurrent PUT (version=V) → one succeeds (V+1), other gets 409.
- **Expected:** No lost update; 409 with current version in response.

### S9: Cross-space authorization
- **Trigger:** Actor from space B tries to update object in space A.
- **Steps:** POST update(task in space A, actor from space B) → 403.
- **Expected:** Fail-closed; no state change.

### S10: Process crash + receipt replay
- **Trigger:** Kill process mid-Run → restart → reconcile.
- **Steps:** Start Run → kill process → restart → GET Run status → reconcile receipts → resume or fail.
- **Expected:** Receipt replay detects in-flight Run; no silent loss; idempotency records survive.

## 2. API surface needed (from PC-4 command/event contract)

### Commands (write)
- `CreateProject`, `CreateGoal`, `CreateTask`, `UpdateTask`, `AddDependency`, `BindSession`, `CreateAssignment`, `StartRun`, `CompleteRun`, `UploadArtifact`, `RecordEvidence`, `SubmitReview`, `UpdateCurrentState`

### Queries (read)
- `GetProject`, `GetGoal`, `GetTask`, `ListTasksByProject`, `GetDependencies`, `GetSession`, `GetRun`, `GetArtifacts`, `GetCurrentState`

### Events (outbox)
- `ProjectCreated`, `TaskCreated`, `TaskUpdated`, `DependencyAdded`, `SessionBound`, `RunStarted`, `RunCompleted`, `ArtifactUploaded`, `ReviewSubmitted`, `CurrentStateUpdated`

### Key invariants (from PC-3 state machines)
- Task: draft→active→completed/cancelled (no skip)
- Run: pending→running→completed/failed (no skip)
- Review: pending→approved/rejected (single-use, content-hash bound)
- Idempotency: at-least-once step, no exactly-once claim

## 3. Minimal navigable UI plan (information architecture only)

### Pages (1.0 minimum)
1. **Project Landing** — Project name, current state summary, active tasks, recent runs, attention items.
2. **Task Board** — Task list by status, dependency graph view, create/edit task.
3. **Session Workbench** — Session list, message stream, tool/permission events, reconnect status.
4. **Review Inbox** — Pending reviews, artifact preview, approve/reject with reason.
5. **Run Detail** — Run status, steps, artifacts, evidence, receipt timeline.

### Navigation
- Global Command Palette: navigation + search + quick-create (Project/Task/Session). High-risk actions (delete, external publish) require contextual confirmation, NOT palette.
- Portfolio view: list of Projects with current state snippet (deferred to post-1.0 if not needed).

### Data flow
- All writes go through Command API → Policy/Approval → Domain Store → Outbox → Event Stream → Client.
- No client-side canonical write bypass (per YU-396 PowerSync constraint).

## 4. Dependency map (WP1-A / WP1-B → 1.0 steps)

| 1.0 Step | Requires from WP1-A | Requires from WP1-B |
|---|---|---|
| S1 Create Project/Goal/Task | Project/Task repos, migrations, CAS, CurrentState atomicity | — |
| S2 Task dependency | wouldCreateCycle, dependency_edges table | — |
| S3 Session bind | personal_spaces, ownership check | Session identity, binding contract (PC-6) |
| S4 Run execution | Task state machine | Provider Session create/resume, message stream |
| S5 Human review | Review state machine, approval bound to content hash | — |
| S6 Current State + restart | Dual-table atomicity, restart recovery | — |
| S7 Idempotency replay | idempotency_records table, DB-backed store | — |
| S8 CAS / stale version | expectedVersion in save() | — |
| S9 Cross-space auth | space ownership check | — |
| S10 Crash + receipt replay | receipts table, replay logic | Daemon restart survival |

## 5. Honest demo plan

### Can demonstrate today (docs only)
- Product architecture (32 groups, domain model, state machines)
- G2 reuse assessment (DBOS, Paseo, Activepieces, PowerSync, Skills)
- Acceptance contract (docs/46) and remote evidence rules

### Blocked until WP1-A Gate 0 PASS
- Any destructive test on real DB
- WP1-A A1-A6 (idempotency durability, CAS, migration, CurrentState atomicity, restart recovery, CI discovery)

### Blocked until WP1-B Module Acceptance
- Real Provider Session create/resume/stream/reconnect
- Permission decision reason surfacing

### Blocked until WP1-A + WP1-B accepted
- WP1-C end-to-end integration
- Actual bootable 1.0 vertical slice
- Real UI or Web workbench

### Local startup command (future, once code exists)
```
# (placeholder — to be filled when scaffold exists)
pnpm install
pnpm db:migrate
pnpm dev
# Open http://localhost:3000
```

## 6. Next actions

1. Keep this as preparation. Do NOT implement until WP1-A Gate 0 PASS + WP1-B Module Acceptance.
2. Refine API surface (§2) against PC-4 accepted contract when available.
3. Derive UI wireframes from §3 once 1.0 scope is confirmed by product owner (YU-400).
4. Update this document when WP1-A/WP1-B contracts change.
