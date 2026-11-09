# 06 — Deliverables, Review, Approval, and Governance

## 1. Completion model

A completed Agent turn is not a completed Task. A Run can hand off a result; a Reviewer then checks the result against the Task's acceptance criteria and the current state of relevant external systems.

Recommended chain:

`Run → Handoff → Artifact/Evidence → Review → Approval (if required) → Task Accepted → Project Current State update`

## 2. Artifact and evidence requirements

For every meaningful handoff, preserve:

- immutable output reference where possible;
- source repository/document/system;
- exact version (commit SHA, PR URL, document revision, content hash);
- author/executor and Run lineage;
- verification steps and observed outcomes;
- known side effects;
- remaining risks and missing evidence.

Large raw logs and binaries should live in suitable artifact storage or the source system; the canonical event record should reference them.

## 3. Review workflow

A Review should answer:

1. Does the deliverable satisfy the stated acceptance criteria?
2. Is the reviewed artifact the exact artifact that was handed off?
3. Are the reported tests/CI/results independently observable?
4. Did execution remain inside Scope and authorization?
5. Did it create unintended side effects?
6. Are unresolved risks and follow-up work explicit?

Possible verdicts:

- `Accepted`;
- `Changes Required`;
- `Rejected`;
- `Needs Evidence`;
- `Deferred`.

A revision keeps the same Task when the outcome boundary is unchanged, but creates a new Run. A materially new outcome or ownership boundary may justify a new Task.

## 4. Approval model

Approval is a permission grant, not a generic thumbs-up.

It should bind to:

- approving actor;
- action type;
- target resource;
- exact artifact/commit/version when applicable;
- scope and constraints;
- expiration or consumption rule;
- policy version and audit record.

A later commit is not covered by approval of an earlier commit.

## 5. Risk tiers (starting proposal)

| Tier | Example | Default control |
|---|---|---|
| R0 Read-only | Read repo, issue, docs, public web | Allow within resource scope |
| R1 Local reversible | Edit local files, run tests, create local branch | Allow within isolated workspace |
| R2 Private durable write | Write private Project OS state or private repo branch | Allow only with scoped connector grant |
| R3 External/public write | Publish PR, comment upstream, send external message | Explicit task-scoped approval unless remembered permission is deliberately configured |
| R4 Merge / destructive | Merge, delete, overwrite, irreversible external action | Explicit human approval bound to exact target |

Final tiers must be refined through threat modeling. The important invariant is that permission is enforced outside the LLM prompt.

## 6. External Live Truth

- GitHub owns commit, PR, review, branch, and CI facts.
- Notion owns the content and permissions of Notion pages/databases.
- Calendar and other connected services own their records.
- Project OS stores linked references, event history, verified snapshots, and user-facing projections.

Before making a consequential decision from a cached external fact, refresh it or expose its freshness/unknown state.

## 7. Audit and incident handling

Record:

- actor and identity type;
- command and target;
- authorization decision and policy version;
- before/after state version;
- external effect idempotency key and receipt;
- exact artifact or source version;
- failure/recovery decision;
- human approvals and revocations.

A confirmed system-level coordination incident should have a reproducible description, evidence, containment action, root cause, and prevention measure. Ordinary source-project bugs are not Project OS incidents.

## 8. Acceptance criteria

- Run completion never automatically means Task acceptance.
- Review is bound to exact evidence and acceptance criteria.
- Approval is scoped and revocable; it does not grant broad future permission by accident.
- External truth can be refreshed and compared with cached state.
- Duplicate side effects are prevented or reconciled before retry.
- Public or destructive actions are gated by policy and human approval.

