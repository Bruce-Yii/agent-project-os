# 28 — PC-2 Core Object Cardinalities (Draft)

**Status:** ACCEPTED FOR WP1-A SCOPE (2026-11-12) — PersonalSpace/Project/Goal/Task cardinalities. Global status remains DRAFT/PROPOSED.
**Issue:** YU-392 (P0-2). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner.

## 1. Object identity reminder

`Project`, `Task`, `Assignment`, `Run`, `Session`, `ProviderSessionRef`, `RuntimeProcess`, `SessionConnection`, `SessionBinding`, `Review`, `Approval` are distinct objects. Confusing them is a known failure mode (AWRP/DSH).

## 2. Cardinalities

### 2.1 PersonalSpace → Project

- One PersonalSpace (personal) owns 0..N Projects.
- Project belongs to exactly one PersonalSpace. Cross-PersonalSpace Project sharing is out of scope (personal phase).

### 2.2 Project → Task

- One Project owns 0..N Tasks (tree via parent_task_id).
- Task belongs to exactly one Project. Moving a Task between Projects requires explicit re-parenting + audit event (not a silent field update).

### 2.3 Task → Assignment

- One Task may have 0..N Assignments over its lifetime (reassignment, retry, replacement).
- One Assignment belongs to exactly one Task.
- At most one **active** Assignment per Task at any time (concurrency control). Historical Assignments remain.

### 2.4 Assignment → Agent / Runtime

- One Assignment targets exactly one Agent (executor) and one Runtime Node.
- Accountable Owner (human) is a separate field on Task/Assignment, not the executor. Owner ≠ Executor always recorded.

### 2.5 Assignment → Run

- One Assignment produces 0..N Runs (attempts). A new Run is created for each genuine retry/revision, never silent re-execution of the same Run.
- One Run belongs to exactly one Assignment.
- Run has an idempotency key scoped to (Assignment, attempt).

### 2.6 Run → Session

- One Run may reference 0..N Sessions (a Run may use a Session, and a Session may be reused across Runs only via explicit binding).
- One Session belongs to 0..1 Run at a time via SessionBinding; a Session can be unbound (direct mode) and later bound.
- Session is NOT owned by Run; Session lifecycle is independent (provider-native).

### 2.7 Session identity layers

- Project OS Session (stable identity) 1..1 ProviderSessionRef (native id) 0..1 RuntimeProcess (OS process) 0..N SessionConnection (client/daemon connections).
- These must never be collapsed into a single "online/offline" flag.

### 2.8 Session → Task binding

- SessionBinding is a separate object: (session_id, task_id, run_id?, created_at, scope). 0..N bindings per Session over time (audit trail), but at most one active binding at a time.
- A direct Session may have zero bindings. Binding is explicit and auditable; never implicit.

### 2.9 Review / Approval → Task / Run

- One Task has 0..N Reviews (each Review binds a candidate Run/Artifact).
- One Review has 0..N Approvals (scoped to exact action+target+artifact).
- Approval is single-use and bound to content hash; if the artifact changes, approval is invalidated.

### 2.10 Trigger / Workflow → Task

- A Trigger produces 0..N Tasks (intake). A Task may reference 0..1 triggering source event (optional provenance).

## 3. Concrete examples

Example A — Direct local Session (no Task):

- Session S1 created by Owner. Bindings: []. Runs: []. State: active. Valid. Direct mode is first-class.

Example B — Delegated work:

- Task T1 (Project P). Assignment A1 (Agent Codex, Runtime local-daemon). Run R1 (attempt 1) uses Session S2. Binding B1 (S2→T1/R1). Review Rev1 binds R1/Artifact. Approval Apr1 binds Rev1. On revision, Run R2 created; Session S2 reused via new binding B2 (audit trail preserved).

Example C — Session reuse across Tasks (allowed only with explicit binding):

- Session S3 first bound to Task T1 (Run R1). Later unbound, then bound to Task T2 (Run R3) with a new SessionBinding and Context Pack. The transcript is shared but scope/permission boundaries are re-evaluated at each binding. Never implicit.

## 4. Counter-examples (forbidden)

- A Task silently owning two active Assignments.
- A Run re-executed without a new Run record (silent retry).
- A Session bound to two Tasks simultaneously without distinct bindings.
- Collapsing ProviderSessionRef into Session identity (loses resume/reconnect semantics).
- Approval reused after the artifact content hash changes.
- Agent executor recorded as accountable Owner.

## 5. Personal-only note

Single Personal Owner means no multi-owner contention, but owner/executor separation still applies (Owner is human, Executor may be Agent). No team membership tables in this phase.

Naming: `PersonalSpace` is canonical; `Workspace`/`workspace_id` is accepted as a compatibility alias during the personal phase. No Organization semantics.

## 6. Evidence

- Notion 01 §4, docs/02, docs/03, docs/05.
- AWRP/DSH lineage (design evidence only).
