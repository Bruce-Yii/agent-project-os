# 36 — PC-3 Core State Machines (Draft)

**Status:** ACCEPTED FOR WP1-A SCOPE (2026-11-12) — Project/Task state subset (backlog/ready/blocked/cancelled + Project lifecycle). Global status remains DRAFT/PROPOSED.
**Issue:** YU-392 (P0-3). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner.

## 1. Project states

States: `draft` → `active` → `paused` | `archived` | `closed`.

- `draft`→`active`: Owner activates (requires goal + at least one Task or explicit "empty project").

- `active`→`paused`: Owner pauses (no new Runs; in-flight Runs complete or cancel).

- `paused`→`active`: Owner resumes.

- `active`→`archived`: Owner archives (read-only; no new writes).

- `archived`→`active`: Owner restores.

- `active`→`closed`: Owner closes (terminal; requires all Tasks terminal or explicit override).

- Terminal: `closed`. No transition out of `closed`.

## 2. Task states

States: `backlog` → `ready` → `in_progress` → `in_review` → `accepted` | `rejected` | `blocked` | `cancelled`.

- `backlog`→`ready`: dependencies satisfied (all blockers accepted).

- `ready`→`in_progress`: Assignment dispatched + Run started.

- `in_progress`→`in_review`: Run produces Artifact + HANDOFF.

- `in_review`→`accepted`: Review verdict accept (+ human approval if high-risk).

- `in_review`→`rejected`: Review requests changes → new Run (Task stays `in_progress` via revision).

- `in_progress`→`blocked`: external dependency / missing input.

- `blocked`→`ready`: blocker resolved.

- `*`→`cancelled`: Owner cancels (terminal for that Task; no new Runs).

- Terminal: `accepted`, `cancelled`. `rejected` is not terminal (loops to `in_progress`).

## 3. Assignment states

States: `pending` → `dispatched` → `running` → `completed` | `failed` | `cancelled`.

- `pending`→`dispatched`: scheduler selects Agent + Runtime, Run created.

- `dispatched`→`running`: Agent ACK received.

- `running`→`completed`: Run completes with HANDOFF.

- `running`→`failed`: Run fails (retry creates new Run, Assignment stays `running` until max retries).

- `*`→`cancelled`: Owner/Coordinator cancels; Run cancelled.

- Terminal: `completed`, `failed` (max retries exceeded), `cancelled`.

## 4. Run states

States: `created` → `started` → `checkpointed` → `completed` | `failed` | `interrupted` | `cancelled`.

- `created`→`started`: execution begins (ACK).

- `started`→`checkpointed`: checkpoint recorded (0..N).

- `started`/`checkpointed`→`completed`: HANDOFF received + verified.

- `started`/`checkpointed`→`failed`: unrecoverable error.

- `started`/`checkpointed`→`interrupted`: pause/interrupt (resumable).

- `interrupted`→`started`: resume.

- `*`→`cancelled`: cancel (terminal).

- Terminal: `completed`, `failed`, `cancelled`.

## 5. Session / Binding states

Session: `created` → `active` → `idle` → `closed` | `error`.

- `created`→`active`: first message/event.

- `active`→`idle`: no activity for threshold.

- `idle`→`active`: new message.

- `*`→`closed`: explicit close or process exit (terminal).

- `*`→`error`: unrecoverable (terminal unless reattach succeeds).

SessionBinding: `active` → `released` (terminal). One active binding at a time per Session.

## 6. Review states

States: `pending` → `in_progress` → `accepted` | `changes_requested` | `rejected` | `deferred`.

- `pending`→`in_progress`: reviewer starts.

- `in_progress`→`accepted`: evidence verified.

- `in_progress`→`changes_requested`: revision needed (new Run).

- `in_progress`→`rejected`: not acceptable.

- `in_progress`→`deferred`: insufficient info.

- Terminal: `accepted`, `rejected`.

## 7. Approval states

States: `pending` → `approved` | `denied` | `expired` | `consumed`.

- `pending`→`approved`: approver approves exact action+target+artifact.

- `pending`→`denied`: approver denies.

- `pending`→`expired`: timeout.

- `approved`→`consumed`: action executed (single-use).

- Terminal: `denied`, `expired`, `consumed`. `approved` is not terminal until consumed.

## 8. Trigger / Workflow states

Trigger: `received` → `deduplicated` | `duplicate` → `evaluated` → `dispatched` | `ignored`.
Workflow: `created` → `running` → `paused` | `completed` | `failed` | `cancelled`.

- `running`→`paused`: manual pause.

- `paused`→`running`: resume.

- Terminal: `completed`, `failed`, `cancelled`.

## 9. External-effect receipt states

States: `pending` → `submitted` → `acknowledged` | `unknown` | `failed` | `reconciled`.

- `pending`→`submitted`: side effect sent.

- `submitted`→`acknowledged`: read-back confirms.

- `submitted`→`unknown`: no read-back (timeout/crash).

- `unknown`→`reconciled`: manual/automatic reconciliation.

- `submitted`→`failed`: explicit failure.

- Terminal: `acknowledged`, `reconciled`, `failed`.

## 10. Personal-only note

Naming: `PersonalSpace` is canonical; `Workspace`/`workspace_id` is accepted as a compatibility alias during the personal phase. No Organization semantics.

Single Personal Owner; no multi-owner contention. Approval gates remain for high-risk external effects (public writes, destructive actions, merges) even in personal mode.

## 11. Evidence

- Notion 01, docs/02, docs/03, docs/05, docs/06.

- AWRP/DSH lineage (design evidence only).
