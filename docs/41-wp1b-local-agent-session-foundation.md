# 41 — WP1-B: Local Agent / Provider / Runtime / Session Foundation

- **ID:** WP1-B
- **Owner:** W2 (Agent Runtime & Sessions), consuming W0 contracts, W1 participant identity, W5 authorization port.
- **Workstream:** W2 (with W0 as contract sole writer).
- **Status:** DRAFT (PROPOSED). MRG NOT PASSED — see §15.
- **Depends on:** PC-1 authority invariant; PC-2 Session/ProviderSessionRef/RuntimeProcess/SessionConnection cardinalities (DRAFT); PC-3 Session/Binding states (DRAFT); minimal PC-4 (DRAFT); Owner-only PC-5 (DRAFT); **PC-6 (DRAFT)** — this WP is the validation vehicle for PC-6. Tech stack and license gates.
- **Personal-only:** single human Personal Owner; Session visibility is owner-scoped.
- **Source of truth:** this document; `docs/18`, `docs/27`–`docs/39`.

## 1. Goal

Deliver the local agent session foundation as a runnable, recoverable slice:

> Owner → discover one real local Provider → create Session → stream messages/events in real time → send follow-up → close/reopen client → reattach without duplicate → disconnect/reconnect → reconcile or mark gap → report host truth.

This slice proves that the product can open a real local Agent Session and continuously receive new messages, with honest capability reporting. It includes **no Project, Task, Run, or Artifact**. Direct Sessions have zero bindings and are first-class.

It is separately gated by a real Provider end-to-end test and by license constraints.

## 2. User journey (target)

1. Owner opens the app; the Local Runtime Daemon is available and reports version/health.
2. Daemon discovers one configured real Provider (Codex/OpenCode/Claude/Pi — selected by structured-API availability and pinned version) and reports its capability matrix (`native`/`emulated`/`unsupported`/`unknown`).
3. Owner creates a Session (select Agent/model/profile, working directory).
4. Owner sends a message; Agent message deltas and tool/permission/status events stream continuously into the workbench.
5. Owner sends a follow-up and the UI distinguishes **steer now**, **queue next message**, and **interrupt then send**.
6. Owner closes the Desktop UI while Daemon/Provider stay online; Session remains attachable.
7. Owner reopens Desktop and reattaches to the same Session without creating a duplicate.
8. Event stream disconnects and reconnects; local spool replays; Provider history reconciles; any unrecoverable gap is marked explicit (never silently presented as complete).
9. If the host sleeps/shuts down/loses connectivity, clients show Host Offline truthfully; they do not pretend a local process is running.

## 3. Scope (F-groups touched, subset)

- F11 — Agent Registry minimal (register one Provider family, capability matrix, health/version).
- F16 — Execution Environments / Runtime Nodes minimal (Local Daemon, process supervision, session discovery, host online/offline truth).
- F12 — Agent Session Workbench single Provider (create/attach/resume, continuous bidirectional streaming, reconnect/replay/reconcile, multi-client observation).
- F09 — participants minimal (Agent as execution actor identity).
- F26 — permission/approval subset for tool permission requests raised by the Provider.

No Project/Task/Run/Artifact/Review.

## 4. Non-scope (explicitly excluded)

- Project, Task, Run, Artifact, Review, Approval-for-deliverables (deferred to `WP1-C`).
- Multi-provider support (one Provider only in this slice).
- Assignment/delegation (F13) and multi-agent coordination (F14).
- Workflow automation (F17), planning (F18), autonomous execution (F19).
- Knowledge/memory (F20/F21), skills (F22), plugins/connectors beyond the one Provider (F23).
- Web/Mobile full clients (desktop-first; observation only if trivially available).
- Organization/team/multi-tenancy.

## 5. Dependencies

| Dependency | Status | Notes |
|---|---|---|
| PC-1 authority invariant | Accepted 2026-11-12 | Daemon is an execution node, never the canonical writer. |
| PC-2 Session identity layers | DRAFT | Session, ProviderSessionRef, RuntimeProcess, SessionConnection, SessionBinding distinct. |
| PC-3 Session/Binding states | DRAFT | Session + SessionBinding states subset. |
| PC-4 minimal (command idempotency) | DRAFT | Session commands serialized per Session. |
| PC-5 Owner-only (session visibility + tool permission approval) | DRAFT | PersonalOwner is sole approver. |
| PC-6 Local Session/Provider/Runtime | DRAFT | This WP validates PC-6 against one real Provider. |
| Provider E2E evidence | NOT YET RUN | Gated; no claim without observed run. |
| License (Gate D0) | NOT SELECTED | No code published under assumed license; no AWRP code copied. |
| Tech stack not frozen | OPEN | Provider adapter isolated behind Port; runtime choices PROPOSED. |

## 6. Domain model (minimal)

### 6.1 Entities

- **Agent** (registry minimal) — logical execution identity for one Provider family + version + capability matrix.
- **Provider** — adapter family (one selected Provider in this slice).
- **RuntimeNode** — the Local Daemon on the user's machine (host online/offline truth).
- **RuntimeProcess** — OS process for the Provider; may die independently of Session.
- **Project OS Session** — stable product identity; survives UI close and process restart.
- **ProviderSessionRef** — Provider-native thread/session ID + resumability metadata (Provider-owned).
- **SessionConnection** — transient client/daemon transport subscription.
- **SessionBinding** — defined as an object (per PC-2) but **not exercised** in this slice; direct Sessions have zero bindings. Binding to Project/Task/Run is `WP1-C`.
- **SessionEvent** — normalized event with source provenance and ordering.
- **SessionCommand** — command with identity + idempotency + receipt.
- **EventCursor / EventGap** — per-session cursor; gaps marked explicit.

### 6.2 Cardinalities (per PC-2, personal phase)

- Project OS Session 1..1 ProviderSessionRef.
- Project OS Session 0..1 RuntimeProcess.
- Project OS Session 0..N SessionConnection.
- SessionBinding: 0..N over time per Session, at most one active at a time; in this slice always 0 active.
- Session events ordered per Session by cursor/receive sequence; no global total order.

### 6.3 State subset

**Session:** `created` → `active` → `idle` → `closed` | `error` (per PC-3). `closed`/`error` terminal unless reattach succeeds.

**SessionConnection:** `connected` ↔ `reconnecting` → `disconnected`.

**RuntimeProcess:** `starting` → `running` → `exited` | `failed` | `unknown`.

**Provider capability:** each operation `native` | `emulated` | `unsupported` | `unknown`. Unsupported operations must be shown as unavailable, never silently simulated.

No Project/Task states in this slice.

### 6.4 Invariants

- Session, ProviderSessionRef, RuntimeProcess, SessionConnection are never collapsed into one "online/offline" flag.
- Desktop close ≠ Session end; process exit ≠ history loss.
- Direct Session is first-class with zero bindings.
- Host offline truth: if machine asleep/off, show Host Offline; do not pretend local Agent is running.
- Reconnect does not prove complete history; gaps must be reconciled or marked explicit.
- A Session command has identity/receipt; never blindly resent after uncertain timeout.
- No AWRP code copied; adapter uses official structured Provider API/SDK/protocol.

## 7. API / Command / Event contracts (minimal)

### 7.1 Commands

All commands carry the minimal envelope (`command_id`, `idempotency_key`, `actor` = PersonalOwner, `personal_space_id?`, `session_id?`, `expected_version`, `created_at`, `correlation_id`, `causation_id`).

- `DiscoverProviders`, `GetProviderCapabilities`
- `CreateSession`, `AttachSession`, `ResumeSession`
- `SendMessage`, `SteerActiveTurn`, `QueueFollowUp`
- `InterruptTurn`, `CancelSession`, `CloseSession`
- `SubscribeEvents(cursor?)`, `ReconcileHistory(cursor?)`
- `AcquireControllerLease`, `ReleaseControllerLease`
- `RespondToPermissionRequest`

Commands to one Session are serialized by default unless the Provider explicitly supports concurrency.

### 7.2 Events

- Session lifecycle: `SessionCreated`, `SessionAttached`, `SessionResumed`, `SessionStateChanged`, `SessionClosed`, `HostOffline`
- Conversation: `MessageDelta`, `MessageFinalized`
- Turn: `TurnStarted`, `TurnCompleted`, `Interrupted`, `Failed`
- Tool: `ToolCallStarted`, `ToolCallResult`
- Permission: `PermissionRequested`, `PermissionResolved`
- Recovery: `Checkpoint`, `Heartbeat`, `EventGap`, `Reconciled`

### 7.3 Streaming, backpressure, cursors

- High-volume deltas stream to attached clients with bounded buffers; slow consumers must not block the Provider process.
- Persist durable message/turn/permission/lifecycle boundaries; do not flood canonical event log with token deltas.
- Per-session event cursor; reconnect replays from cursor; gaps marked explicit.
- Deduplicate by provider event ID or stable content/turn identity.

### 7.4 Idempotency and uncertain outcomes

- Send-message commands are idempotent by key; duplicate submission returns stored result.
- If command outcome is unknown after disconnect, reconcile Provider Session state before retrying (no duplicate messages/side effects).

## 8. Module ownership

| Module (proposed) | F-group | Owner | Responsibility in this WP |
|---|---|---|---|
| `agent-registry` | F11 subset | W2 | Register one Provider family, capabilities, health/version |
| `runtime-node` | F16 subset | W2 | Local Daemon, process supervision, session discovery, host truth |
| `agent-session-workbench` | F12 subset | W2 | Session CRUD, streaming, reconnect/reconcile, controller lease |
| `participants` (Agent identity subset) | F09 subset | W1 | Agent as execution actor identity (consumed by W2) |
| `permission-approval` (tool permission subset) | F26 subset | W5 | Permission requests raised by Provider (consumed by W2) |

Shared files/contracts: W0 sole writer.

## 9. Worktree / branch

- Branch (to be created when MRG passes): `feat/wp1b-local-agent-session-foundation`.
- Worktree: dedicated.
- Provider choice must be pinned to a specific version and re-verified on real machines before implementation freeze.
- No implementation until PC-6 is accepted or isolated behind a stable Port, and Provider E2E evidence exists.

## 10. Tests (required before implementation claim)

- **Provider E2E (gated, must be observed):** detect Provider + version/capabilities; create Session + receive Provider Session ID; send message + display deltas continuously; display tool/permission/status events with provenance; send follow-up distinguishing queued vs steering; close/reopen Desktop with Daemon/Provider online → reattach without duplicate Session; disconnect/reconnect stream → reconcile missed messages or show explicit gap; keep direct standalone Session usable without Task; show unsupported capability as unavailable; verify permissions/credential isolation; report offline host/process truthfully.
- **Contract:** session command idempotency; event cursor replay; dedup; capability negotiation.
- **Negative:** unauthorized session access denied; host offline not pretended running; unsupported capability not simulated.
- **License:** verify no AWRP code copied; adapter uses official structured API.

## 11. Acceptance criteria (slice)

- One real Provider passes the full E2E list in §10 with observed evidence.
- Real-time streaming of messages/events works with backpressure.
- Close/reopen Desktop reattaches without duplicate Session.
- Disconnect/reconnect either reconciles or marks an explicit gap.
- Host offline truth reported honestly.
- No Project/Task/Run/Artifact/Review code or tables in this slice.

## 12. Security constraints

- Personal-only: Session visibility is owner-scoped; no multi-user sharing.
- Provider credentials are user-supplied and stored in OS credential storage; never synced as Project data; never logged.
- Local control interface binds to loopback/OS IPC by default; remote pairing requires explicit user approval + authenticated encrypted transport.
- Working directories and file access constrained; effective filesystem scope shown.
- High-risk tool actions (public write, destructive) require Owner approval via PC-5.
- Authorization enforced in code/runtime, not prompts.
- No secrets in code/docs/logs.
- License: exact OSS license not selected (Gate D0); do not publish under assumed license; AWRP is design evidence only.

## 13. Rollback

- If the chosen Provider is incompatible or license issue arises: revert to research/specification mode; worktree discarded after evidence archived; PC-6 remains DRAFT.
- No Project/Task state to reconcile (none produced).

## 14. Next Work Packages

- `WP1-C` (`docs/42`) depends on WP1-B stable Session/Provider/Runtime interfaces.
- Multi-provider support is post-slice.

## 15. MRG status (honest)

| # | Criterion | Status | Gap |
|---|---|---|---|
| 1 | User result/scope/non-scope explicit | MET | This doc §1–4 |
| 2 | Module Contract versioned & accepted | NOT MET | No module contract authored; PC-6 still DRAFT |
| 3 | P0 dependencies accepted or isolated behind stable port | PARTIAL | PC-1 invariant accepted; PC-2/PC-3/PC-4/PC-5/PC-6 still DRAFT |
| 4 | Runtime/build/test infra known | PARTIAL | Node 24/Python 3.12 known; no build system; tech stack not frozen |
| 5 | File ownership/worktree/branch explicit | MET | §8 + §9 |
| 6 | Contract fixtures & acceptance tests exist | NOT MET | Provider E2E not yet run; no fixtures |
| 7 | Security/secret/license/side-effect boundaries explicit | PARTIAL | Personal auth + credential rules defined; license not selected (Gate D0); side-effect receipts for tool calls not yet specified |
| 8 | Independent reviewer + stop/rollback conditions | MET | W0 is reviewer; rollback §13 |

**MRG: NOT PASSED.** Blockers: criteria 2, 3, 6 (and partial 4, 7). Additional gates: real Provider E2E evidence and license selection. No implementation may start until PC-6 is accepted or isolated behind a stable Port.
