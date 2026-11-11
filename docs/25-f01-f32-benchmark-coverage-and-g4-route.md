# 25 — F01–F32 Benchmark Coverage and G4 Version Route (Draft)

**Status:** DRAFT / PROPOSED (YU-398). Not frozen. Product scope unchanged.
**Owner:** W0 (integration) with W1–W6 workstream input.
**Related:** [docs/01 functional catalog](01-functional-catalog.md), [docs/13 competitor and reuse analysis](13-competitor-and-reuse-analysis.md), [docs/12 development roadmap](12-development-roadmap.md), [docs/24 module responsibility](24-module-responsibility-and-dependency-dag.md), Notion 03 (G4), Notion 14.1/14.3.

## 1. Purpose

YU-398 closes two gaps identified in Notion 14.1:

1. **32-group benchmark coverage gap**: docs/13 and G2 (docs/22) compare complete products (OpenAgents, Paperclip, Paseo, OpenHands, Linear) and reuse candidates. They do **not** yet provide a traceable, per-functional-group (F01–F32) evidence table. This document starts that table.
2. **G4 version route gap**: docs/12 defines Stage 0–7 dependency order; Notion 03 requires a 1.0–10.0 independently usable route. This document proposes a draft route for W0/G4 to refine.

This is a **research/design deliverable**, not product code. No scope is added or removed.

## 2. Evidence rules (inherited from Notion 00 §12 / Notion 03 §08)

- Competitor comparison is **one complete product vs. our complete product**, per overlapping core scenario. Never sum competitors' local strengths into a fictional opponent.
- Public evidence first (docs, source, tests, issues/PRs, maintainer discussion). Real-machine testing only for decision-critical unknowns.
- Each row records source, date, status, and evidence strength. `UNVERIFIED` is an acceptable status; do not upgrade to `VERIFIED` without evidence.
- Free self-hosting is not unique (Paperclip/Paseo/OpenHands overlap). Differentiation must be proven via integrated Project continuity/outcomes.

## 3. Status legend

- `VERIFIED` — primary-source evidence (docs/source/tests/issues) recorded and reviewed.
- `PARTIAL` — some evidence exists (docs/13 or docs/22) but not group-level.
- `UNVERIFIED` — no group-level evidence yet.
- `NOT APPLICABLE` — internal capability with no direct competitor analogue (rare; justify).

## 4. F01–F32 benchmark coverage table (draft)

Columns: F# | Group | Workstream | Evidence status | Primary evidence source | Key open question / next action.

| F# | Group | WS | Status | Primary evidence | Open question / next action |
|---|---|---|---|---|---|
| F01 | Workspace and Organization | W1 | PARTIAL | docs/13 (Linear/Paperclip org model); docs/22 | Permission matrix details; multi-org switching evidence. |
| F02 | Project Portfolio and Initiative Management | W1 | PARTIAL | docs/13 (Linear initiatives) | Cross-project dependency + capacity view; competitor depth. |
| F03 | Project Lifecycle | W1 | PARTIAL | docs/13; docs/03 | Archive/restore + template bootstrap evidence. |
| F04 | Project Structure | W1 | PARTIAL | docs/02/03 | Multi-repo binding; external system relation evidence. |
| F05 | Task and Work Package Management | W1 | PARTIAL | docs/13 (Linear issues); AWRP | Work-package vs run separation; saved views. |
| F06 | Task Relationships and Dependency Graph | W1 | PARTIAL | docs/13 (Linear deps) | DAG validation, critical path; competitor depth. |
| F07 | Task Lifecycle and Current State | W1 | PARTIAL | docs/03; AWRP | Current-state snapshot + stale detection evidence. |
| F08 | Intake, Triage, and Deduplication | W1 | UNVERIFIED | — | Competitor intake flows (Linear triage); dedup approach. |
| F09 | Human and Agent Participants | W2 | PARTIAL | docs/13 (Paperclip org) | Participant-type model; permission scope evidence. |
| F10 | Collaboration and Communication | W2 | PARTIAL | docs/13 (Linear comments) | Agent-to-Agent messaging; provenance. |
| F11 | Agent Registry and Capability Management | W2 | PARTIAL | docs/22 (Paseo/S2); Notion 14 | Capability matrix (native/emulated/unsupported/unknown) evidence. |
| F12 | Agent Session Workbench (incl. Local Agent Sessions) | W2 | PARTIAL | docs/18; Notion 15; Paseo/S2 | Real Provider E2E (G2 gate); reconnect/replay evidence. |
| F13 | Agent Delegation and Assignment | W3 | PARTIAL | docs/13 (Paperclip) | Assignment vs Run separation; reassign/handoff. |
| F14 | Multi-Agent Coordination | W3 | PARTIAL | docs/13 (Paperclip/Paseo); DSH | Fan-out/isolation; conflict detection evidence. |
| F15 | Run, Event, and Execution Lifecycle | W2 | PARTIAL | AWRP; DSH; docs/05 | Idempotency + HANDOFF; event replay evidence. |
| F16 | Execution Environments and Runtime Nodes | W2 | PARTIAL | Paseo/S2; docs/18 | Daemon lifecycle; host offline truth; pairing. |
| F17 | Workflow and Event Automation | W3 | PARTIAL | DSH; Activepieces/S3 | Trigger dedup; workflow versioning evidence. |
| F18 | Intelligent Planning and Assistance | W3 | UNVERIFIED | — | Coordinator planning quality; competitor (Linear AI) depth. |
| F19 | Autonomous Execution (Sub-capability) | W3 | PARTIAL | DSH | Mandate/authority bounds; Personal Execution Skill. |
| F20 | Project Knowledge and Resources | W4 | PARTIAL | docs/08; Notion | Resource provenance; search. |
| F21 | Project Memory and Context Assembly | W4 | PARTIAL | docs/08; AWRP | Context Pack inspectability; freshness/conflict. |
| F22 | Skills, Templates, and Reusable Methods | W4 | PARTIAL | Agent Skills spec; S5 | Import/export; governance; scope. |
| F23 | Plugin and Connector Ecosystem | W4 | PARTIAL | docs/10; Activepieces/S3; MCP | Plugin sandbox; compatibility matrix. |
| F24 | Deliverables and Artifacts | W5 | PARTIAL | docs/06; AWRP | Artifact lineage; external refresh. |
| F25 | Review and Acceptance | W5 | PARTIAL | docs/06; AWRP | Independent review; evidence checklist. |
| F26 | Permission, Risk, and Approval Governance | W5 | PARTIAL | docs/11; DSH | Risk tiers; scoped approval; fail-closed. |
| F27 | Project Visualization | W6 | PARTIAL | docs/09; Linear/Paperclip | View model; filter; cross-client consistency. |
| F28 | Multi-platform Clients | W6 | PARTIAL | docs/09; Paseo | Desktop/Web/Mobile parity; pairing. |
| F29 | Attention Center and Notifications | W6 | PARTIAL | docs/09; Linear | Inbox grouping; notification policy. |
| F30 | Observability, Cost, and Operations | W5 | PARTIAL | docs/11; P/D | Trace model; cost attribution. |
| F31 | Data Portability and Lifecycle | W4 | UNVERIFIED | — | Export/import; migration from Linear/Notion. |
| F32 | Universal Search and Command Palette | W6 | UNVERIFIED | — | Search index; permission-aware results. |

**Summary:** 0 VERIFIED at group level; 28 PARTIAL; 4 UNVERIFIED (F08, F18, F31, F32). This confirms the gap. Group-level verification is a P1 workstream task (per workstream owner), not a W0 blocker.

## 5. G4 version route draft (PROPOSED)

Inherited principle (Notion 13.6): not "divide features into ten equal parts" but plan by dependency + complete user journey. Each version must be installable, runnable, recoverable, and stoppable.

### Proposed 1.0 — Golden Path (PROPOSED, not frozen)

**Personal-only (confirmed 2026-11-12):** single human Personal Owner; Agent/Runtime/Connector are execution actors. No Organization, members, invitations, team roles/RBAC, shared-team workspaces, team collaboration flows, or multi-tenancy in 1.0. F01 implemented as single Personal Owner workspace.

Goal: prove Project-first main loop end-to-end on one real local Provider.

Scope (candidate):

- Workspace + Project + Goal + Task + dependency (F01,F03,F04,F05,F06,F07 subset)
- Human/Agent participants + basic collaboration (F09,F10 subset)
- Agent Registry + Session Workbench for one local Provider (F11,F12 subset) with continuous messages
- Assignment/Run/Event lifecycle (F13,F15 subset)
- Execution environment local daemon (F16 subset)
- Artifact + Review + basic approval (F24,F25,F26 subset)
- Local desktop client (F28 subset) + basic visualization (F27 subset)
- Basic attention (F29 subset) + basic observability (F30 subset)
- Knowledge/context minimal (F20,F21 subset)
- Portability basic export (F31 subset)

Deferred to later versions (with rationale): multi-Agent coordination (F14), workflow automation (F17), planning intelligence (F18), autonomous execution (F19), skills (F22), plugin/connector ecosystem beyond one Provider (F23), portfolio/initiative (F02), intake/triage (F08), multi-platform Web/Mobile (F28 beyond desktop), universal search (F32). These are **deferred implementation, not deleted scope**.

### Proposed 2.0 — Coordination + Knowledge

Add: multi-Agent coordination (F14), workflow/triggers (F17), knowledge/memory/context (F20,F21), skills (F22), review hardening (F25,F26), Web client (F28), attention center (F29).

### Proposed 3.0 — Integration + Portability + Platform breadth

Add: plugin/connector ecosystem (F23), artifact lineage (F24), observability/cost (F30), data portability/migration (F31), mobile client (F28), search (F32), portfolio (F02), intake (F08), planning intelligence (F18), autonomous execution (F19).

### 10.0 — Full scope

All 32 groups fully implemented per MRG. G4 freezes final route after G3 contracts stabilize.

## 6. Dependencies / sequencing constraints

- 1.0 requires G3 P0 contracts (canonical writer, object cardinality, state machines, command/event, policy/approval, local session) — currently IN PROGRESS, not frozen.
- No module may claim IMPLEMENTATION READY until its MRG passes (Notion 14.4).
- Cross-cutting foundations (security, identity, event contracts, observability, migration, testing) defined at Stage 0 and implemented every stage (docs/12 §2).

## 7. Open questions (to be resolved before G4 freeze)

1. Should 1.0 include a second (remote) Provider or stay single-Provider? (affects F11/F16/F28)
2. Is Web client in 1.0 or 2.0? (affects F28/F27)
3. Autonomous execution (F19) minimum viable slice for 1.0 or defer? (Notion: sub-capability, mandate-gated)
4. Knowledge extraction gate (F21) threshold for 1.0?
5. Plugin SDK (F23) minimal vs full in 1.0?

## 8. Next actions

- W0: refine this draft with workstream owners; freeze G4 route after G3 contracts stabilize.
- Each workstream: fill group-level evidence rows (§4) as research progresses; do not block implementation on unverified rows.
- Update docs/12 if G4 route changes materially (single source of truth for stage order).

---

*This document is a draft proposal. Nothing here is a confirmed product decision or frozen technology choice.*
