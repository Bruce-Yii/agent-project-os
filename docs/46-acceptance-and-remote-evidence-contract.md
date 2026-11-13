# 46 — Acceptance and Remote Evidence Contract

- Status: **ACCEPTED — Coordinator quality policy, 2026-11-12**
- Applies to: Agent Project OS / AWRP Next; W0, every D1–D3 agent, every Work Package, module, integration and version gate
- Owner of this policy: ChatGPT project coordinator; W0 implements and enforces it in repo workflow and Linear
- Scope: review/acceptance evidence and remote handoff. Does **not** alter product scope, module contracts, issue identity or approval rights
- Authority: product decisions and acceptance intent follow accepted Notion decisions / the owning Work Package; Linear holds execution status; GitHub holds code, exact commits, CI and reviewable evidence; upstream systems hold their live state

## 1. Non-negotiable rules

1. **Acceptance criteria are frozen before implementation.** Every work package must identify its observable user/downstream outcome, exact contract/invariants, applicable failure paths, evidence source, verifier, and acceptance gate. A worker cannot weaken or silently reinterpret those conditions after starting. Changes require an explicit reviewed contract delta with reason and impact; preserve the original and new acceptance versions.
2. **Anything requiring independent review must first be available on a reviewer-accessible remote.** For code/tests/docs/fixtures, commit and push to the existing authorized GitHub branch, and cite the exact full commit SHA, branch, repository path and PR where applicable. A local path, screenshot, pasted summary, or "test passed" is not sufficient delivery evidence.
3. **A reviewer must inspect the exact remote artifact.** Independently read the files/diff/contract, check the current base and head and verify CI run *head SHA* equals the submitted candidate. Review the actual test target, assertions, skipped cases, environment and logs, not just a green check icon.
4. **No self-certification.** Developer/worker completion or its own tests do not equal acceptance. A reviewer independent from the implementation checks the promised outcome and important counterexamples. W0 reviews the reviewer and integration; ChatGPT independently accepts material module/integration/release claims.
5. **Readiness is not completion.** MRG passes *before work begins*. A green build, unit suite, passing MRG, report file, local demo, or merged PR does not prove a completed Task, Module, Integration or Release.
6. **Remote-first does not mean publishing secrets or unsafe data.** Use private authorized remotes or redacted, reproducible evidence; never push credentials, personal records, license-restricted third-party sources, or unsafe destructive test data. If safe remote evidence cannot be supplied, mark NOT VERIFIED and identify the blocker.
7. **Do not advance an unsupported verdict.** A missing remote file, mismatched SHA, unrun required check, mock standing in for production, stale evidence, or unresolved critical invariant means NOT VERIFIED / PARTIAL / REJECTED as appropriate, never ACCEPTED.

## 2. Distinct acceptance gates

| Gate | Question | Minimum proof |
|---|---|---|
| MRG — Module Readiness | Can this module safely start implementation? | Accepted bounded contract, dependencies or tested ports, environment, ownership, relevant planned tests, security/effects boundaries, reviewer and rollback |
| Task Acceptance | Has the assigned bounded change truly delivered its agreed outcome? | Correct remote diff, behavior against contract, relevant tests, negative paths, absence of regressions/unapproved side effects, independent review |
| Module Acceptance | Can its real consumer finish the promised module-local workflow? | Real implementation-level E2E, persisted business invariants, relevant negative/recovery paths, accepted contract, independently verified evidence |
| Integration Acceptance | Do the connected modules work together without violating contracts? | Actual cross-module journey, shared IDs/events/transactions/permissions, failure/recovery, version compatibility and no duplicate effects |
| Release Acceptance | Can the intended user independently operate the promised version? | Clean install/migration, usable journey, safety/security/rollback, availability/performance goals when relevant, explicit release/approval gates |

Passing a prior gate is necessary where applicable, but is never sufficient evidence for a later gate.

## 3. Task Acceptance — required structure

For each task, before implementation, record:

- **Outcome:** What is observably possible for an end user or downstream module after the work, including a concrete success example?
- **Scope/non-scope and affected interfaces:** Exact input/output, data ownership, state invariants, permissions and externally visible effects.
- **Test oracle:** Expected result **and exact failure reason/state** for positive, negative and recovery cases; choose a real implementation path, not a simulation designed by the implementer.
- **Critical risk gates:** Security, data loss, concurrency, billing/cost, irreversible effects, external write, migration, provider disconnect and compatibility as applicable. Mark irrelevant cases N/A with a reason.
- **Independent reviewer and artifact location:** The intended GitHub branch/PR path and immutable SHA plus the relevant authoritative contract version.

After implementation the reviewer checks the real diff and observable behavior, targeted regression tests, altered/unintended files, external truth/read-back, and any missing acceptance cases.

## 4. Module Acceptance — evidence, not test count

All critical applicable claims must hold:

1. A real consumer (user, API client or next module) can perform the **complete promised journey** using actual product code and durable state. A mock/spec-only harness is supporting evidence, not proof.
2. Domain invariants and persistence: cardinality, parentage, data ownership, state transitions, stale-version checks, duplicate commands, transaction rollback and data consistency.
3. Security: authorization enforced at real read/write boundaries; cross-scope access rejected with no hidden side effect; secrets and permissions not widened.
4. Failure/recovery: actual process restart/crash, duplicate/reordered inputs, unknown outcomes, retry/reconciliation and offline/disconnect as relevant; name what was *actually* restarted.
5. Integration/compatibility: real upstream/downstream contracts and supported runtime/database versions; no contradictory schemas or broken consumers.
6. Operability: clean-checkout install/build/migrate/run/test; clear failure diagnostics, auditable evidence and a reproducible rollback; user-visible behavior where UI is in scope.
7. Independent reviewer validates claims against the exact candidate SHA and identifies gaps. Reviewer can use selective fault injection/mutation on a disposable branch to prove targeted tests detect missing auth/CAS/idempotency/rollback, especially for high-risk logic.

No weighted average can compensate for an unproven **critical** requirement. Passing 26/26 or 100/100 tests only establishes that those test cases passed on the tested code/environment.

## 5. Integration and Release checks

- Every participating module has a separately accepted contract and appropriate module-level evidence. Integrate by stable interfaces, not by copying local state from another window.
- Cross-module tests must exercise event causality, identity binding, permission/approval inheritance, version migration, race/retry behavior, idempotent external effects, partial failure and recovery where applicable.
- For externally owned facts, verify live read-back or explicit reconciliation; "request sent" is not "effect happened."
- For a release, verify the intended user's full journey, installation/upgrade/rollback, security and secret hygiene, observability, supported clients and actual deployment environment. A module-accepted branch is not a released product.
- Public/destructive actions, irreversible migrations, publication and PR merge remain behind their existing explicit human/owner gates.

## 6. Reviewable remote evidence packet (mandatory before handoff)

Each implementation handoff provides:

1. Project name, existing Linear Issue, work package, acceptance-contract version, verdict requested (MRG / Task / Module / Integration / Release).
2. Canonical repository; **full head and base SHAs**, branch and PR; exact changed paths and meaningful diff summary. State whether local uncommitted/untracked changes remain.
3. Exact remote location of implementation, migration, fixtures, harness and review reports; include commit SHA for each artifact if on separate branches.
4. CI workflow run URL/ID with its actual head SHA and all required job conclusions; commands, test counts, skipped/flaky cases, environment and relevant raw output. A previous green run on a different SHA is invalid.
5. Claim-to-evidence matrix: acceptance ID → expected observation → actual observation → remote file/line/log/CI → independent reviewer verdict.
6. Real scenario evidence including reads after writes and restart/recovery, plus applicable negative and side-effect cases; clearly label mocks versus real targets.
7. Reviewer identity/independence, unresolved risk, impact, rollback and next gate. Report old-to-new delta only; do not recycle past work as the new run.

**Handoff gate:** If any essential implementation or test file is only on a local machine, first commit/push it safely to the existing branch. If pushing is impossible, record the failure and mark that claim NOT VERIFIED. Do not ask a remote ChatGPT reviewer to infer local files, or treat an old pushed scaffold as the latest implementation.

Use the existing branch/Issue; do not create a new Issue/PR simply to retry a test or report. Never force push, reset, overwrite another worker's changes, or merge to satisfy this evidence requirement.

## 7. Decision semantics and change control

- **ACCEPTED:** All applicable critical acceptance claims are substantiated at the exact reviewed SHA. Non-critical limitations are stated, bounded and owned.
- **PARTIAL:** Some results are demonstrated, but a critical piece or required integration remains incomplete.
- **REJECTED:** Demonstrated behavior violates an accepted contract, critical safety constraint or explicitly failed criterion.
- **NOT VERIFIED:** Remote code/evidence, current SHA, real test surface or independent evidence is missing. This is not proof that the local work never happened.
- **N/A:** Only for an individually justified non-applicable check; never to hide an unimplemented requirement.

A changed implementation SHA invalidates the previous overall acceptance unless the independent reviewer checks the delta, affected contracts and relevant regression tests and explicitly carries the verdict forward. Changing acceptance requirements after work started must have a versioned contract delta and independent impact review.

## 8. Initial application: WP1-A

Use WP1-A as the first proving ground. To claim **Module Accepted**, the actual pushed code must demonstrate:

- Bootstrap PersonalSpace → Project → Goal → at least two Tasks → dependency → ready-work result → ProjectCurrentState → persistent read-back through production command/API boundary.
- Same idempotency key/same payload returns the same receipt and one effect; same key/different payload conflicts. Stale expected version, unauthorized/cross-space writes and illegal transitions fail with exact reasons and **zero mutation**. Concurrent writers and mid-transaction failure preserve invariants.
- Migrations from empty, disposable PostgreSQL; process-level crash/restart with receipt/state/versions preserved; separate testing of database restart only when claimed.
- Clean checkout and CI on **the submitted SHA**; no destructive default database URL; no implicit test ordering or shared database interference; independent reviewer proves real assertions, not just green counts.

The existing WP1-A `docs/44` MRG verdict cannot, by itself, be cited as WP1-A Module Acceptance.

## 9. Enforcement in the repository and Linear

W0, as sole writer of shared engineering files, must wire this accepted policy into:

- `AGENTS.md` read order and mandatory handoff rule;
- `docs/17-agent-development-contract.md`, `docs/06-review-delivery-governance.md` where necessary;
- `docs/templates/work-package.md` and `docs/templates/module-contract.md`;
- CI/PR checks that detect missing remote evidence, mismatched SHAs and misleading or missing critical test execution where technically automatable;
- the existing YU-392/YU-399 Issue records; do not duplicate issues.

This policy itself is only the **documentary baseline** until W0 finishes and remotely verifies those enforcement changes. CI automation must not be claimed before it exists. W0 must update manifest/checksums and verify this document is tracked by whichever repository integrity policy is active.
