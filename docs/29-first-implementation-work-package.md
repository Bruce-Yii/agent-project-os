# 29 — First Implementation Work Packages (Index)

**Status:** DRAFT (PROPOSED). MRG NOT YET PASSED — see the individual Work Packages.  
**Issue:** YU-392 (delivery target). **Owner:** W0.  
**Personal-only:** single human Personal Owner.  
**Naming (personal phase):** `PersonalSpace` is canonical; `Workspace`/`workspace_id` is accepted as a compatibility alias. No Organization semantics.  

This document is now an **index**. The former monolithic Work Package has been split into three genuinely separate Work Packages, each with its own scope, dependencies, contracts, tests, acceptance criteria, security constraints, rollback, and MRG assessment:

- [`docs/40-wp1a-personal-project-foundation.md`](40-wp1a-personal-project-foundation.md) — **WP1-A: Personal Project Foundation** (PersonalSpace + Project + Goal + Task + dependency subset + Project Current State; persistence + basic recovery; no Agent/Session/Run/Artifact/Review).
- [`docs/41-wp1b-local-agent-session-foundation.md`](41-wp1b-local-agent-session-foundation.md) — **WP1-B: Local Agent / Provider / Runtime / Session Foundation** (Agent Registry minimal, one real Provider, Local Runtime, Session create/resume, real-time event stream, disconnect/reconnect; no Project/Task/Run/Artifact).
- [`docs/42-wp1c-execution-integration.md`](42-wp1c-execution-integration.md) — **WP1-C: Execution Integration** (Assignment + Run + Artifact + Review + Approval + Project state update + end-to-end integration).

## 1. Summary table

| WP | Title | Scope (F-groups subset) | Depends on | PC-6? | Can start when |
|---|---|---|---|---|---|
| WP1-A | Personal Project Foundation | F01, F03, F04, F05, F06, F07 (subset) | PC-1 invariant, PC-2 PersonalSpace/Project/Goal/Task, PC-3 Project/Task subset, minimal PC-4, Owner-only PC-5 | No | PC-2/PC-3 (and minimal PC-4/PC-5) accepted + storage Port defined + fixtures exist |
| WP1-B | Local Agent / Provider / Runtime / Session Foundation | F09, F11, F12, F16, F26 (subset) | PC-1 invariant, PC-2 Session layers, PC-3 Session/Binding states, minimal PC-4, Owner-only PC-5, PC-6 | Yes | PC-6 accepted or isolated behind stable Port + Provider E2E evidence + license gate |
| WP1-C | Execution Integration (end-to-end loop) | F03, F06, F07 (full), F09, F10, F13, F15, F24, F25, F26 (subset) | WP1-A + WP1-B stable interfaces; PC-1..PC-5 (PC-6 inherited) | Inherited | WP1-A and WP1-B MRGs passed and interfaces stable |

## 2. Dependency order

1. **WP1-A** and **WP1-B** are independent of each other and may proceed in parallel once their respective P0 dependencies and gates are satisfied.
   - WP1-A does **not** depend on PC-6.
   - WP1-B **does** depend on PC-6 (and Provider E2E + license gates).
2. **WP1-C** depends on stable interfaces from both WP1-A and WP1-B and cannot start until both pass their MRGs.
3. All three depend on the PC-1 authority invariant (accepted 2026-11-12); deployment topology (sync transport, packaging) remains open and does not block the authority invariant.
4. Tech stack, database, and deployment topology are not frozen (P-021/P-022); each WP isolates behind Ports where a decision is open.

## 3. Cross-cutting invariants (all WPs)

- Personal-only: single human Personal Owner; Agent/Runtime/Connector are execution actors. No org/team/RBAC/multi-tenancy in current contracts, scope, or MRGs.
- Project is the durable center; Task ≠ Assignment ≠ Run ≠ Session.
- Human accountability ≠ Agent execution; Agent completion ≠ acceptance.
- External systems own their live facts; store references and verified projections only.
- OSS free self-hosted; no new production dependencies without approval; AWRP is design evidence only, not copied.
- Technology choices and proposed schema are not frozen unless an accepted ADR says otherwise.

## 4. MRG status (aggregate, honest)

No Work Package passes MRG yet. Each WP carries its own 8-criteria checklist with honest status and gaps:

| WP | MRG result | Primary blockers |
|---|---|---|
| WP1-A | NOT PASSED | Criteria 2 (module contract), 3 (P0 deps DRAFT), 6 (no fixtures); partial 4, 7 |
| WP1-B | NOT PASSED | Criteria 2, 3, 6; additional Provider E2E evidence + license selection; partial 4, 7 |
| WP1-C | NOT PASSED | Criteria 2, 3, 6; depends on WP1-A/WP1-B passing; partial 4, 7 |

**No implementation may start** until the relevant Work Package's MRG passes. No empty packages, placeholder APIs, or fake tests may be used to claim implementation.

## 5. Worktree / branch (aggregate)

- WP1-A branch (when MRG passes): `feat/wp1a-personal-project-foundation`.
- WP1-B branch (when MRG passes): `feat/wp1b-local-agent-session-foundation`.
- WP1-C branch (when MRG passes, stacked on WP1-A + WP1-B): `feat/wp1c-execution-integration`.
- One worktree per workstream; shared contract files remain W0 sole writer.

## 6. References

- Shared contracts: `docs/27` (PC-1), `docs/28` (PC-2), `docs/36` (PC-3), `docs/37` (PC-4), `docs/38` (PC-5), `docs/39` (PC-6).
- Local Session subsystem: `docs/18`.
- Local development/agent operations: `docs/23`.
- Module responsibility/DAG: `docs/24`.
- Work Package template: `docs/templates/work-package.md`.
- Module contract template: `docs/templates/module-contract.md`.
- Individual Work Packages: `docs/40`, `docs/41`, `docs/42`.
