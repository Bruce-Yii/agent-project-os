> [!CAUTION]
> **ARCHIVED / QUARANTINED LEGACY WP1-A — DO NOT CONTINUE DEVELOPMENT (2026-11-13).**
> This branch `feat/wp1a-personal-project-foundation` is an **unaccepted, unsafe historical implementation source**, not the active project workspace. Old W0 has been retired. It is retained for **read-only inspection and selective file-level migration** by the **new W0-RECOVERY** after independent checks, never wholesale merge/cherry-pick, never inheriting MRG 8/8 PASS as Module Acceptance.
> **Gate 0 = REJECTED; Gate 1/2 = STOP; WP1-A Module Acceptance = NOT ACCEPTED.** In particular, `src/commands/contract.test.ts` contains unguarded `DROP TABLE ... CASCADE`; `src/persistence/migrate.test.ts` uses admin DB deletion; and `src/test-guard.ts` uses unproven name-prefix/optional nonce matching. **Do not execute destructive tests or migrations from this old branch.** Do not push further implementation or rewrite historical evidence here.
> **New execution authority:** [Linear YU-392 recovery order](https://linear.app/yi383775/issue/YU-392/g3-w0engineering-decomposition-and-shared-contracts), comment `b3b8f356-e8e9-49b8-9321-5e068a32cf5b`. Canonical design source: PR #1 G0–G2 `8f2b50707fef30b47294ebbcd07fc17583abcb11`. Old docs PR #2 has been **closed/frozen**, source only. New W0 owns a separate recovery worktree and remote branch. This banner is an archival marker; do not confuse it with a safety fix or Gate PASS.

---

# Agent Instructions — Agent Project OS

## Read order

1. `README.md`
2. `docs/00-product-charter.md`
3. `docs/01-functional-catalog.md`
4. `docs/02-domain-model.md`
5. `docs/14-open-decisions.md`
6. `docs/17-agent-development-contract.md`
7. `docs/18-local-agent-session-subsystem.md` (when touching Provider adapters, Session, Daemon, message streaming, terminal, or cross-device Session control)
8. `docs/23-local-development-and-agent-operations.md` (new; local dev foundation, YU-399)

Before changing product behavior or shared contracts, also read the module-specific design document you are changing.

## Recursive Agent Execution (W0)

**Project Identity Lock — inherited by every spawned agent, unchanged:**

- Project: Agent Project OS｜AWRP Next (independent); Linear Project P-YU-18; canonical repo `Bruce-Yii/agent-project-os`.
- Product invariants: full 32 functional groups retained; Project is the durable center; Direct Agent Session and Coordinator-driven work are both first-class; human accountability is separate from Agent execution; Agent completion ≠ acceptance; external systems own their live facts; OSS free self-hosted; no new production dependencies without approval; AWRP is design evidence only, not copied.
- Authority: Notion 00–03 for product decisions; Linear for task identity/status; GitHub for code/branches/CI; official upstream sources for package/API/license facts. Resolve conflicts by the authority for that fact.
- Technology choices and proposed schema are **not frozen** unless an accepted ADR says otherwise.

**Recursion (root = depth 0):** D0 W0 root coordinator; D1 spawned by W0; D2 spawned by D1; D3 spawned by D2 = terminal leaves. D1 and D2 may spawn children; D3 MUST NOT. "Three layers" means up to three delegation layers below the root, not three agents. Fan-out is dynamic, bounded by useful independent work and runtime concurrency — not a fixed count.

**Task envelope (required for every spawn):** Project ID; Issue ID; parent task ID; objective; scope and non-scope; dependencies/blockers; source documents with exact SHAs; owned files/directories and output path; allowed and forbidden operations; acceptance criteria; test/evidence requirements; side-effect approvals; stop conditions; handoff format. Descendants may refine methods but cannot broaden a parent's authority or change product decisions.

**Parent review and stop conditions:** each parent reviews its direct children before accepting; W0 independently reviews material evidence. Stop when identity mismatches (reconcile the affected branch only), when a missing requirement is found (submit a Decision/Scope Change Proposal; do not implement until approved), on duplicate/overlap/contract conflict (escalate to parent/W0), or when evidence is insufficient (mark UNVERIFIED/PARTIAL). External/public/irreversible actions stay gated.

**Evidence:** report exact changed files, branch/commit, commands and observed output, CI runs, tests, side effects and read-back, risks, and next action. No unsupported "complete/tested/working" claims.

Full contract (do not duplicate here): `docs/17-agent-development-contract.md`.

## Product constraints

- The product is a complete, Project-centered OS for humans and multiple Agents. Do not narrow it into a coding-agent launcher, chat UI, Linear clone, DSH port, or a UI bundle of disconnected products.
- Product lineage is AWRP + our Linear Project/Current State operating model + DeepSeek DSH orchestration ideas. Preserve the distinct contribution and limitations of each; do not claim the product is a direct port.
- The product is open source and free to self-host for personal/team use. Do not introduce mandatory paid gates for core Project OS capabilities. Exact open-source license remains an explicit decision until selected and published.
- Users bring their own model/provider credentials and choose local/remote/cloud runtimes. Never imply that model inference, hardware, hosting, or third-party service usage is free.
- Unification must exist in canonical identities, state lifecycle, context, authorization, attention, and audit—not merely in one combined UI.
- Competitor analysis must acknowledge open-source/self-hosted overlaps such as Paperclip, Paseo, and OpenHands Agent Canvas. Do not claim free self-hosting is unique; prove differentiation through integrated Project continuity and workflow outcomes.
- Preserve the full 32-group functional scope. Implementation order may be staged; product scope may not be silently deleted.
- **Current phase is personal-only (confirmed 2026-11-12):** one human Personal Owner; Agent/Runtime/Connector are execution actors. Do not design or implement Organization, members, invitations, team roles/RBAC, shared-team workspaces, team collaboration flows, or multi-tenancy in current contracts, 1.0–10.0 scope, or MRGs. Personal authorization, per-Project/per-Agent/tool scopes, human approval, audit, and recovery remain. Keep future team extension out of current implementation gates.
- Project is durable. Task, Assignment, Run, and Session are different objects.
- Human accountability and Agent execution are separate.
- Direct Agent use and Coordinator-driven work both remain supported.
- Desktop must create/open local Agent Sessions and continuously receive new messages. Do not reduce this to a link-out or one-shot CLI invocation.
- Keep Project OS Session identity, ProviderSessionRef, RuntimeProcess, and SessionConnection distinct.
- Continuous streaming requires backpressure, event cursors, reconnect/reconciliation, deduplication, and explicit event-gap handling; never claim a complete transcript if events were missed.
- Prefer official structured Provider APIs/SDKs/protocols; terminal UI automation is an opaque fallback and must expose its limitations.
- A direct Session may exist without a Task; explicit Project/Task binding is auditable and cannot silently cross context/permission boundaries.
- Autonomous execution is a sub-capability. Personal Execution Skill is a supporting method input, not a separate product, state engine, or permission grant.
- A Run handoff is not Task acceptance. Review requires evidence.
- External systems own their live facts. Do not replace GitHub/Notion/Feishu truth with stale local copies.
- Technology choices and proposed schema are not frozen unless an accepted ADR says otherwise.

## Work discipline

- Before creating a new abstraction, search the existing domain model and feature catalog.
- Before creating a new Task, search for an existing Work Package with the same outcome boundary.
- Do not create a new Task/Issue for every Agent run, retry, or status refresh.
- Keep one owner per shared contract/schema file during parallel work.
- Use a separate branch/worktree for independent workstreams. Never share one mutable checkout between concurrent coding Agents.
- Do not reset, stash, discard, force-push, or overwrite another worker's uncommitted changes.
- Do not change a domain contract without an ADR and impact review.
- Enforce permissions in code/runtime boundaries, not only in prompts.
- Never place secrets in prompts, code, docs, logs, or artifacts.

## Evidence and completion

- Do not claim code, tests, or external actions succeeded without observing the actual result.
- Report exact changed files, branch/commit, tests and output, acceptance evidence, external side effects, remaining risks, and next action.
- Read back external writes when supported.
- If an external side effect has an unknown outcome, reconcile before retrying.
- Update the owning documentation and `docs/14-open-decisions.md` when a material decision changes.
