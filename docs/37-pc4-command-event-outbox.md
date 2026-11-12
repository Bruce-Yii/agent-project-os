# 37 — PC-4 Command / Event / Outbox / Inbox / Receipt (Draft)

**Status:** ACCEPTED FOR WP1-A SCOPE (2026-11-12) — minimal command envelope, idempotency, expected version, command/event append. Outbox/Inbox deferred (no external effects in WP1-A). Global status remains DRAFT/PROPOSED.
**Issue:** YU-392 (P0-4). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner.

## 1. Command envelope

Every command carries: `command_id` (UUID), `idempotency_key` (client-generated, scoped to actor+intent), `actor` (Owner/Agent/Runtime), `personal_space_id` (alias `workspace_id`), `project_id?`, `task_id?`, `intent` (typed enum), `payload`, `expected_version` (optimistic concurrency), `requested_effects` (list of external effect descriptors), `created_at`, `correlation_id`, `causation_id`.

## 2. Idempotency

- A command with a previously seen `idempotency_key` returns the stored result without re-executing.
- Idempotency is scoped to (actor, idempotency_key). Different actors with the same key are not deduplicated.
- No exactly-once claim: at-least-once delivery with idempotent handlers. Duplicate commands are safe.

## 3. Expected version (optimistic concurrency)

- `expected_version` must match the current entity version or the command is rejected with `STALE_VERSION`.
- The client must refresh and retry with the new version. No silent overwrite.

## 4. Event envelope

Every domain event carries: `event_id` (UUID), `event_type`, `aggregate_type`, `aggregate_id`, `version` (monotonic per aggregate), `actor`, `occurred_at`, `payload`, `correlation_id`, `causation_id`, `source` (internal/external).

## 5. Ordering

- Events are ordered per aggregate by `version`. Cross-aggregate ordering is by `occurred_at` + `event_id` tiebreak.
- No global total order is guaranteed; consumers must be idempotent.

## 6. Transactional Outbox

- Domain state write + Outbox entry (pending external effect) are in the **same DB transaction**.
- A background worker reads pending Outbox entries and executes external effects.
- Outbox entry states: `pending` → `in_flight` → `acknowledged` | `failed` | `unknown`.
- Worker uses idempotency key when calling external systems; retries with backoff.
- If the worker crashes, entries remain `pending`/`in_flight` and are retried on restart.

## 7. Inbox (external event intake)

- External events (GitHub webhook, Notion change) are written to an Inbox table with dedup by (source, external_id).
- Inbox processing is idempotent: re-processing a duplicate is a no-op.
- Inbox events may produce Commands (intake flow, F08).

## 8. Receipts

- Every external effect produces a Receipt: `receipt_id`, `effect_id`, `status` (acknowledged/unknown/failed), `external_ref` (PR URL, commit SHA), `read_back_at`, `error`.
- `unknown` status requires reconciliation before retry (no blind retry of unknown-outcome effects).

## 9. Replay and reconciliation

- Events can be replayed from a cursor for client sync (reconnect recovery).
- Reconciliation: compare Project OS state with external live truth (GitHub PR/CI status). Discrepancies surface as Attention items.
- No automatic silent overwrite of external facts; user or Coordinator decides.

## 10. Failure recovery

- Crash during command processing: idempotency key ensures safe retry.
- Crash during Outbox execution: entry remains pending, retried on restart.
- Unknown external outcome: mark receipt `unknown`, require reconciliation, do not retry blindly.
- Stale version: reject, client refreshes.

## 11. Personal-only note

Single Personal Owner; no multi-actor contention on the same aggregate except Agent/Runtime execution actors, which operate via Commands with the Owner's authorization.

Naming: `PersonalSpace` is canonical; `Workspace`/`workspace_id` is accepted as a compatibility alias during the personal phase. No Organization semantics.

## 12. Evidence

- Notion 01 §9, docs/05 §9, docs/06, AWRP/DSH lineage (design evidence only).
