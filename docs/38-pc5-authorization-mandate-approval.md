# 38 — PC-5 Authorization, Mandate, and Approval (Draft)

**Status:** DRAFT (PROPOSED). Not accepted.
**Issue:** YU-392 (P0-5). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner.

## 1. Actor types

- `PersonalOwner` (human): full authority over their workspace; accountable for all outcomes.
- `Agent` (execution actor): operates under a Mandate; cannot self-approve.
- `Runtime` (execution node): executes Agent Sessions; reports results.
- `Connector` (external integration): scoped read/write via approval.

## 2. Authorization model

- Every command is checked: actor × action × resource × scope × policy version.
- Fail-closed: if any check is missing or ambiguous, deny.
- Permissions are enforced in code/runtime boundaries, not prompts.

## 3. Mandate

- A Mandate is a bounded authorization grant: (actor, scope, allowed actions, resource boundaries, expiry, budget).
- Mandate is issued by the Personal Owner (or Coordinator on Owner's behalf, within Owner's mandate).
- Mandate can be revoked at any time; in-flight Runs check mandate validity at checkpoints.
- Autonomous execution (F19) operates only within an active Mandate; stops at authority boundary.

## 4. Risk tiers

- `read`: read-only, no side effects.
- `local_change`: modify local workspace files (reversible).
- `private_write`: write to private external (e.g., draft PR, private note).
- `public_write`: publish/merge/destructive (requires human approval).
- `destructive`: delete/force-push (requires human approval + confirmation).

## 5. Approval

- Approval is bound to exact (action, target, artifact content hash, policy version).
- Single-use: consumed on execution; re-execution requires new approval.
- Approval invalidates if the artifact content hash changes.
- High-risk actions (public_write, destructive, merge) require Owner approval before execution.
- Agent cannot self-approve; approval must come from Personal Owner (or delegated human).

## 6. Revocation during Run

- Mandate revoked mid-Run → Run pauses at next checkpoint; requires Owner decision (continue with new mandate or cancel).
- Approval revoked → pending action cancelled; already-executed action is not rolled back automatically (read-back + reconciliation).

## 7. Personal-only note

No team/RBAC. Single Owner is the sole approver. Future team extension adds multi-approver; out of scope now.

## 8. Evidence

- Notion 01 §8/§9, docs/06, docs/11, DSH lineage (design evidence only).
