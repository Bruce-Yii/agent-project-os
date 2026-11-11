# 39 — PC-6 Local Session / Provider / Runtime Contract (Draft)

**Status:** DRAFT (PROPOSED). Not accepted.
**Issue:** YU-392 (P0-6). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner.

## 1. Object separation (never collapse)

- **Project OS Session**: stable product identity; survives UI close, process restart.

- **ProviderSessionRef**: native ID (Codex thread, Claude session, OpenCode session, Pi session). Provider-owned.

- **RuntimeProcess**: OS process (CLI/server). May die independently.

- **SessionConnection**: client/daemon connection (transient).

- **SessionBinding**: Session↔Task/Run link (explicit, auditable).

## 2. Capabilities (per Provider)

Each capability is `native` | `emulated` | `unsupported` | `unknown`:

- createSession, resumeSession, getSession, listSessions

- dispatch, sendMessage, subscribeEvents

- pause, interrupt, cancel, handoff (if supported)

- getArtifacts, getDiff, getUsage (if supported)

## 3. Session lifecycle

- Create: Owner or Coordinator requests → Daemon discovers Provider → creates native session → Project OS Session created with ProviderSessionRef.

- Attach: connect to existing native session (if Provider supports).

- Resume: native resume if supported; otherwise restart-with-context (explicitly labeled, not mislabeled as native resume).

- Close: explicit close or process exit; history retained per transcript policy.

## 4. Event streaming

- Standardized events: started, message_delta, tool_call, tool_result, permission_request, artifact_created, checkpoint, heartbeat, interrupted, completed, failed.

- Raw Provider events retained for provenance; normalized events for UI/state.

- Backpressure: bounded buffers; slow UI consumer must not block Provider process.

- Cursors: per-session event cursor; reconnect replays from cursor; gaps marked explicit (never claim complete transcript if events missed).

## 5. Controller lease and command serialization

- One controller at a time per Session (lease). Control transfer is explicit and visible.

- Commands default serial per Session; distinguish "steer current turn", "queue next message", "interrupt then send".

- Command identity + idempotency; uncertain outcomes reconciled before retry (no duplicate messages/side effects).

## 6. Transcript ownership and retention

- Transcript stored per Session with retention policy (local-only vs shared).

- Sync controls: what syncs to Control Plane vs stays local.

- Explicit deletion/export policy.

## 7. Reconnect and reconciliation

- Desktop close ≠ Session end; process exit ≠ history loss.

- Reconnect: from local spool first, then Provider history (if supported), then mark gaps.

- Host offline truth: if machine asleep/off, show Host Offline; do not pretend local Agent is running.

## 8. Personal-only note

Single Personal Owner; Session visibility is owner-scoped. Multi-user session sharing out of scope.

## 9. Evidence

- docs/18, Notion 01 §5/§15, Codex App Server / Claude SDK / OpenCode Server / Pi RPC references (design evidence).
