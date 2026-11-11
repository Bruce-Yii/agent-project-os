# 35 — YU-398 Benchmark/G4 Evidence (D1-G)

**Status:** DRAFT / EVIDENCE NOTE (D1-G). Not a product decision; does not modify docs/25.  
**Owner:** W0 (integration) with D1-G verification input.  
**Related:** [docs/25](25-f01-f32-benchmark-coverage-and-g4-route.md), [docs/13](13-competitor-and-reuse-analysis.md), [docs/22](22-mature-module-reuse-assessment.md), [docs/12](12-development-roadmap.md), [docs/24](24-module-responsibility-and-dependency-dag.md), [docs/19](19-pre-development-readiness.md).  
**Source baseline:** branch `feat/yu-399-local-dev-foundation`, commit `ceaf05c2774a49f34f28447d5b5fb6dd4d603af2`.  
**Scope note:** verification only. No F-group status was upgraded; no broad competitor research was repeated.

## 1. Method and evidence rules

- Evidence standard inherited from docs/25 §2–§3 and Notion 00 §12 / Notion 03 §08: `VERIFIED` requires primary-source evidence (docs/source/tests/issues/PRs) recorded and reviewed at group level.
- `PARTIAL` = some product/competitor/reuse evidence exists (docs/13 or docs/22) but not group-level verification.
- `UNVERIFIED` = no group-level evidence yet.
- Rule applied here: **no status was upgraded.** A PARTIAL row stays PARTIAL unless new primary-source evidence is recorded and reviewed. This note adds no such evidence.

## 2. F01–F32 coverage verification

Status column is taken verbatim from docs/25 §4 (2026-11-12 draft). Primary evidence column is the source named in docs/25 §4. Assessment column is D1-G's read of whether that source is primary-source and group-specific.

| F# | Group | WS | Status (docs/25) | Primary evidence (as recorded) | Assessment |
|---|---|---|---|---|---|
| F01 | Workspace and Organization | W1 | PARTIAL | docs/13 (Linear/Paperclip org); docs/22 | Product/competitor-level; no group-level verification |
| F02 | Project Portfolio and Initiative Management | W1 | PARTIAL | docs/13 (Linear initiatives) | Product/competitor-level; no group-level verification |
| F03 | Project Lifecycle | W1 | PARTIAL | docs/13; docs/03 | Product/doc-level; no group-level verification |
| F04 | Project Structure | W1 | PARTIAL | docs/02/03 | Doc-level; no group-level verification |
| F05 | Task and Work Package Management | W1 | PARTIAL | docs/13 (Linear issues); AWRP | Product/protocol-level; no group-level verification |
| F06 | Task Relationships and Dependency Graph | W1 | PARTIAL | docs/13 (Linear deps) | Product-level; no group-level verification |
| F07 | Task Lifecycle and Current State | W1 | PARTIAL | docs/03; AWRP | Doc/protocol-level; no group-level verification |
| F08 | Intake, Triage, and Deduplication | W1 | UNVERIFIED | — | **No primary source recorded** |
| F09 | Human and Agent Participants | W2 | PARTIAL | docs/13 (Paperclip org) | Product/competitor-level; no group-level verification |
| F10 | Collaboration and Communication | W2 | PARTIAL | docs/13 (Linear comments) | Product-level; no group-level verification |
| F11 | Agent Registry and Capability Management | W2 | PARTIAL | docs/22 (Paseo/S2); Notion 14 | Reuse-assessment-level; no group-level verification |
| F12 | Agent Session Workbench (incl. Local Agent Sessions) | W2 | PARTIAL | docs/18; Notion 15; Paseo/S2 | Subsystem-contract-level; real-Provider E2E still pending (G2 gate) |
| F13 | Agent Delegation and Assignment | W3 | PARTIAL | docs/13 (Paperclip) | Product/competitor-level; no group-level verification |
| F14 | Multi-Agent Coordination | W3 | PARTIAL | docs/13 (Paperclip/Paseo); DSH | Product/competitor-level; no group-level verification |
| F15 | Run, Event, and Execution Lifecycle | W2 | PARTIAL | AWRP; DSH; docs/05 | Protocol/product-level; no group-level verification |
| F16 | Execution Environments and Runtime Nodes | W2 | PARTIAL | Paseo/S2; docs/18 | Reuse/subsystem-level; no group-level verification |
| F17 | Workflow and Event Automation | W3 | PARTIAL | DSH; Activepieces/S3 | Reuse/competitor-level; no group-level verification |
| F18 | Intelligent Planning and Assistance | W3 | UNVERIFIED | — | **No primary source recorded** |
| F19 | Autonomous Execution (Sub-capability) | W3 | PARTIAL | DSH | Reference-level; no group-level verification |
| F20 | Project Knowledge and Resources | W4 | PARTIAL | docs/08; Notion | Doc-level; no group-level verification |
| F21 | Project Memory and Context Assembly | W4 | PARTIAL | docs/08; AWRP | Doc/protocol-level; no group-level verification |
| F22 | Skills, Templates, and Reusable Methods | W4 | PARTIAL | Agent Skills spec; S5 | Format/spec-level; governance not verified |
| F23 | Plugin and Connector Ecosystem | W4 | PARTIAL | docs/10; Activepieces/S3; MCP | Doc/protocol-level; no group-level verification |
| F24 | Deliverables and Artifacts | W5 | PARTIAL | docs/06; AWRP | Doc/protocol-level; no group-level verification |
| F25 | Review and Acceptance | W5 | PARTIAL | docs/06; AWRP | Doc/protocol-level; no group-level verification |
| F26 | Permission, Risk, and Approval Governance | W5 | PARTIAL | docs/11; DSH | Doc/reference-level; no group-level verification |
| F27 | Project Visualization | W6 | PARTIAL | docs/09; Linear/Paperclip | Doc/competitor-level; no group-level verification |
| F28 | Multi-platform Clients | W6 | PARTIAL | docs/09; Paseo | Doc/competitor-level; no group-level verification |
| F29 | Attention Center and Notifications | W6 | PARTIAL | docs/09; Linear | Doc/competitor-level; no group-level verification |
| F30 | Observability, Cost, and Operations | W5 | PARTIAL | docs/11; P/D | Doc/competitor-level; no group-level verification |
| F31 | Data Portability and Lifecycle | W4 | UNVERIFIED | — | **No primary source recorded** |
| F32 | Universal Search and Command Palette | W6 | UNVERIFIED | — | **No primary source recorded** |

**Summary (unchanged from docs/25 §4):** 0 VERIFIED at group level; 28 PARTIAL; 4 UNVERIFIED (F08, F18, F31, F32). D1-G confirms this count and does not upgrade any row.

## 3. Evidence gap list

### 3.1 Groups with no primary source (UNVERIFIED)

- **F08 — Intake, Triage, and Deduplication** (W1): no competitor intake flow or dedup approach evidence. Linear triage exists as a candidate primary source but has not been recorded at group level.
- **F18 — Intelligent Planning and Assistance** (W3): no coordinator planning quality or competitor (Linear AI) depth evidence.
- **F31 — Data Portability and Lifecycle** (W4): no export/import or migration-from-Linear/Notion evidence.
- **F32 — Universal Search and Command Palette** (W6): no search index or permission-aware result evidence.

### 3.2 Groups with product/competitor/reuse evidence but no group-level verification (PARTIAL, 28 groups)

F01, F02, F03, F04, F05, F06, F07, F09, F10, F11, F12, F13, F14, F15, F16, F17, F19, F20, F21, F22, F23, F24, F25, F26, F27, F28, F29, F30.

These have named sources in docs/13/docs/22/docs/02–11/docs/18, but the evidence is at product/protocol/reuse level, not per-group verification. Group-level verification remains a P1 workstream task per workstream owner and is **not a W0 blocker** (docs/25 §4 summary).

### 3.3 Evidence-boundary notes (do not over-claim)

- Free self-hosting is not unique (Paperclip/Paseo/OpenHands overlap) — docs/13 §9.1 and docs/25 §2. Any benchmark claim must not assert self-hosting uniqueness.
- `UNVERIFIED` is an acceptable status; do not upgrade without evidence (docs/25 §2).
- Real-machine testing is reserved for decision-critical unknowns; no such test is recorded here.

## 4. Version dependency verification (docs/25 §5 vs docs/12)

docs/25 §5 proposes four release levels: 1.0, 2.0, 3.0, 10.0. docs/12 defines implementation Stages 0–7. The mapping below is D1-G's verification; it does not freeze either document.

| Version (docs/25 §5) | F-groups named | Corresponding docs/12 stages | Verification result |
|---|---|---|---|
| 1.0 Golden Path | F01,F03,F04,F05,F06,F07,F09,F10,F11,F12,F13,F15,F16,F20,F21,F24,F25,F26,F27,F28,F29,F30,F31 (subsets) | Stage 1 (F01,F03,F04,F05,F06,F07,F09,F10), Stage 2 (F11,F12,F13,F15,F16), Stage 3 (F24,F25,F26), Stage 5 (F20,F21), Stage 6 (F27,F28), Stage 7 (F29,F30,F31) | **Dependency-correct only if every named group is explicitly a subset and its prerequisite P0 contracts (PC-1..PC-6) and upstream F-groups ship in the same release.** 1.0 already pulls in minimal slices of Stage 5/6/7 groups; this is acceptable as a vertical slice but must keep the "subset" label. |
| 2.0 Coordination + Knowledge | adds F14,F17,F20,F21,F22,F25,F26,F28 (Web),F29 | Stage 4 (F14,F17), Stage 5 (F20,F21), Stage 6 (F22,F28), Stage 3 hardening (F25,F26), Stage 6 (F29) | **Mostly consistent.** F25/F26/F20/F21 are already in 1.0 as subsets; 2.0 should state whether it delivers full (not subset) versions to avoid ambiguity. |
| 3.0 Integration + Portability + Platform breadth | adds F23,F24,F30,F31,F28 (Mobile),F32,F02,F08,F18,F19 | Stage 6 (F23,F28), Stage 7 (F30,F31), Stage 6 (F32), Stage 1 (F02,F08), Stage 4 (F18,F19) | **Consistent in stage order, but internal ordering is required:** F23 before F31 (F31 depends on F23 per docs/24); F27 before F28 Web/Mobile (F28 depends on F27); F14/F17/F22 before F19 (F19 depends on all three). |
| 10.0 Full scope | all 32 groups fully implemented per MRG | All stages 0–7 | **Gated, not automatic.** No module is `IMPLEMENTATION READY` today (docs/24 §7, docs/19 Gate status). 10.0 cannot be claimed until P0 contracts (PC-1..PC-6) are accepted and each module passes MRG. |

### 4.1 Findings requiring correction or clarification

1. **Missing intermediate versions.** docs/25 §5 defines 1.0, 2.0, 3.0, and 10.0 only. There is no 4.0–9.0. Either define them in G4 or state explicitly that 3.0→10.0 increments are TBD. Do not imply a contiguous 1.0–10.0 route exists today.
2. **Subset labeling must be preserved.** 1.0 includes F20/F21/F24/F25/F26/F27/F28/F29/F30/F31 as subsets while deferring F14/F17 (Stage 4). This is a vertical slice, not stage completion. The "subset" qualifier must stay on every later-stage group in 1.0; removing it would falsely claim Stage 4/5/6/7 completion.
3. **Intra-version ordering.** 3.0 must sequence F23 before F31, F27 before F28 (Web/Mobile), and F14/F17/F22 before F19 (per docs/24 §6.2). docs/25 §5 does not state this ordering.
4. **2.0 full-vs-subset ambiguity.** F20/F21/F25/F26 appear in both 1.0 (subset) and 2.0 (added). Clarify that 2.0 delivers the full versions of these groups.
5. **10.0 gating.** 10.0 is "all 32 groups fully implemented per MRG" (docs/25 §5). Because no module is `IMPLEMENTATION READY` (docs/24 §7), 10.0 is a scope statement, not a schedule commitment. Keep it marked PROPOSED/DRAFT.
6. **Stage 0 prerequisite.** docs/25 §6 already states 1.0 requires G3 P0 contracts (not frozen). This is correct and must remain.

### 4.2 Stage-order observations (informational, not errors)

- 1.0 includes minimal slices of Stage 5 (F20/F21) and Stage 6 (F27/F28) while deferring Stage 4 (F14/F17/F18/F19). This is justified by direct dependencies: F12 depends on F21 (docs/24) and F28 on F27. It is a vertical slice, not a stage skip. No correction needed beyond keeping the subset label.
- 1.0 includes F30 (Stage 7) basic observability, which depends on F28 (Stage 6) desktop subset — included. Acceptable as minimal.

## 5. Personal-only scope verification

Confirmed against docs/25 §5, docs/24 §1/§4, AGENTS.md product constraints, and docs/14 C-001..C-014.

- **1.0 (docs/25 §5)** explicitly states personal-only: single human Personal Owner; Agent/Runtime/Connector are execution actors; no Organization, members, invitations, team roles/RBAC, shared-team workspaces, team collaboration flows, or multi-tenancy in 1.0; F01 implemented as single Personal Owner workspace. **Verified: reflected.**
- **F01 (docs/24)** is implemented as a single Personal Owner workspace in this phase; team features deferred beyond current gates. **Verified: reflected.**
- **F09/F10 (docs/24)** personal-only: one human Personal Owner plus Agent/Runtime/Connector actors; no human-team collaboration flows. docs/25 §5 lists F09/F10 as subset in 1.0 but does not restate the personal-only restriction. **Gap: add explicit note that F09/F10 in 1.0 are Owner↔Agent and Agent↔Agent only.**
- **F26 (docs/24/docs/29)** personal authorization + approval for high-risk; no team RBAC. docs/25 §5 lists F26 subset. **Verified: consistent, but restating helps.**
- **F28 (docs/24)** cross-device serves one owner; no team workspace collaboration. docs/25 §5 says desktop subset. **Verified: consistent.**
- **2.0/3.0/10.0 (docs/25 §5)** do **not** restate personal-only. However, the project identity lock and AGENTS.md state the current phase is personal-only for contracts and 1.0–10.0 scope; team/org features are deferred beyond 10.0/current gates (docs/24 §1). **Gap: add a global personal-only statement to docs/25 §5 covering all versions, so 2.0/3.0/10.0 cannot be read as introducing team/org features.**

**Conclusion:** no team/org feature is introduced in 1.0 by docs/25 §5. The gap is documentation clarity (F09/F10 note + global personal-only statement), not scope leakage.

## 6. Recommendations (for W0 / G4 refinement)

1. **Do not upgrade any F-group status.** Keep 0 VERIFIED / 28 PARTIAL / 4 UNVERIFIED until group-level primary-source evidence is recorded and reviewed.
2. **Fill the 4 UNVERIFIED rows first** (F08, F18, F31, F32) using existing competitor/product sources already cited in docs/13 (Linear triage/AI, Paperclip, Paseo) without new broad research; record source + date + status per row.
3. **Workstream owners** to convert the 28 PARTIAL rows to group-level evidence as a P1 task (not a W0 blocker), per docs/25 §8.
4. **Refine G4 route (docs/25 §5):** add 4.0–9.0 definitions or mark TBD; add intra-version ordering (F23→F31, F27→F28, F14/F17/F22→F19); clarify full-vs-subset for F20/F21/F25/F26 in 2.0.
5. **Add personal-only global statement** to docs/25 §5 covering 1.0–10.0, plus an explicit F09/F10 Owner↔Agent-only note in 1.0.
6. **Keep 10.0 marked PROPOSED/DRAFT** and gated on P0 contract acceptance + MRG (docs/24 §5/§7, docs/19).
7. **Do not start implementation** until PC-1..PC-6 are accepted; this note changes no scope or status.

## 7. Stop conditions / non-goals

- This document is verification/evidence only. It adds no scope, no new research, and no status upgrades.
- It does not modify docs/25, docs/13, docs/22, or docs/12.
- Any status upgrade requires new primary-source evidence recorded and reviewed (docs/25 §2).

---

*End of D1-G evidence note. Report completion to the delegating agent with this file path.*
