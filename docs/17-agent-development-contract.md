# 17 — Development Contract for Human and Agent Contributors

This contract is for the future implementation phase. It is included now because the product is expected to be developed through multiple parallel windows and subagents. It does not authorize code implementation by itself.

## 1. Responsibility model

- Product owner: goals, priority, and final product decisions.
- Architecture/integration owner: domain contracts, module boundaries, integration, and cross-module review.
- Workstream owner: one bounded module or package; accountable for implementation and evidence.
- Subagents: bounded research or implementation tasks; workstream owner reviews all output.
- Reviewer: independently verifies actual files, tests, side effects, and acceptance criteria.

A task is not complete because an Agent says it is complete.

## 2. Before implementation begins

Every work package must state:

- Goal;
- Scope and Non-scope;
- owning module and file boundaries;
- hard constraints;
- interfaces consumed and produced;
- data/state ownership;
- acceptance criteria;
- tests and verification commands;
- external side effects and approval requirements;
- dependencies and handoff format.

Use [Work Package Template](templates/work-package.md).

## 3. Parallel work rules

- One independent worktree/branch per workstream or task-run.
- No shared mutable checkout between concurrent coding Agents.
- One owner per schema/interface file during a work package.
- Shared contracts are changed only through an explicit contract update and impact review.
- A worker must not reset, stash, discard, force-push, or overwrite another worker's uncommitted work.
- Avoid multiple Agents editing the same UI page or core schema simultaneously.
- Parallelize implementation only after G0 contracts are stable.

## 4. Integration rules

- Integrate by stable interfaces, not by copying another window's local state.
- Run contract tests before merging module code.
- Run cross-module tests after integration.
- Verify migrations, event compatibility, permission checks, and external effects.
- Keep external system IDs and source links in the handoff.
- Do not silently change object names or state semantics in one module.
- Provider adapters must declare capability support (`native`, `emulated`, `unsupported`, `unknown`) and preserve raw event provenance.
- Local Session work must keep Project OS Session, Provider Session reference, Runtime Process, and client connection distinct.
- Streaming code must handle backpressure, cursors, reconnect/replay, deduplication, and explicit event gaps; never block a Provider process because a UI consumer is slow.
- A direct local Session may be unbound from Task/Run; do not force every Session into task dispatch.
- Session command retries must reconcile uncertain outcomes and use command identity/idempotency; do not duplicate user messages or external side effects.

## 5. Handoff report format

Every Agent handoff must include:

1. summary;
2. changed files;
3. exact branch and commit SHA;
4. tests run and observed output;
5. acceptance criteria mapped to evidence;
6. external side effects and current external truth;
7. known risks, incomplete items, and next action.

## 6. Prohibited shortcuts

- Do not claim tests passed without running them.
- Do not claim external operations succeeded without reading back the result.
- Do not widen task scope without approval.
- Do not add new top-level abstractions when an existing domain object can express the need.
- Do not duplicate a feature in two modules with competing ownership.
- Do not introduce secrets into code, docs, logs, or Agent prompts.
- Do not treat a design proposal as a confirmed product decision.

## 7. Review checklist

- Does the implementation match the module contract?
- Did it change only owned files and interfaces?
- Are state transitions valid and idempotent?
- Are authorization and external side effects enforced outside prompts?
- Are tests deterministic and relevant?
- Are real external states and artifacts verified?
- Did it create duplicate tasks, records, notifications, or side effects?
- Are docs and ADRs updated when behavior changed?
