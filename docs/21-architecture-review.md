# 21 — Architecture Review and Completeness Audit

**Status:** G1 complete as an architecture audit on this PR branch; PR #1 merge pending. Critical implementation decisions remain explicitly owned by G2/G3 and must not leak into parallel implementation.  
**Snapshot:** 2026-11-10  
**Purpose:** Review the full product journeys, module ownership, domain objects, state authority, lifecycle, execution, security, cross-device behavior, and degraded paths. This is an audit and gap-ownership record, not a frozen architecture or a substitute for ADRs.

## 1. G1 verdict

**G1: PASS — architecture review and gap ownership are complete.**

The existing design has a coherent Project-centered architecture skeleton. All six PRD journeys map to identifiable modules and state owners. The main unresolved issues are not hidden contradictions: they are explicitly listed in `docs/14`, assigned to their owning documents and later preparation gates, and blocked from parallel implementation until the relevant contracts are approved.

G1 does **not** mean the database schema, API, event contract, deployment topology, Provider choice, or technology stack is frozen. G2 reuse research and G3 contract/engineering decomposition remain required before implementation.

## 2. User journey to module and authority map

| PRD journey | Main modules | Canonical state / live truth | Review result |
|---|---|---|---|
| A — Long-lived Project | Project/work management, collaboration, knowledge, delivery, clients | Project OS owns Project/Task/Decision state; linked external systems own their original records | Covered. Project survives Agent/Session/client replacement. Current State fields and derived summary still need a precise boundary |
| B — Direct local Agent Session | Session Workbench, Execution Runtime, Provider Adapter, Local Daemon, Desktop | Project OS owns Session identity/binding; Provider owns native conversation/session data; Daemon owns process and local spool; connection state is runtime-owned | Covered. Direct Session without Task is explicit. Transcript policy, controller lease, first Provider, and binding cardinality remain open |
| C — Multi-Agent delegation | Work Packages, Assignment, Scheduler, Coordinator, Runtime, Review, Governance | Project OS Control Plane owns Task/Assignment/Run authority; Runtime executes; external systems own side effects | Covered. Parallel work requires isolated resources, bounded Assignments, evidence, and independent Review |
| D — Unified attention | Collaboration, Review/Approval, Attention Center, clients, notifications | Canonical Task/Run/Approval state remains authoritative; Inbox is a projection with actionable pointers | Partly covered. Inputs and intervention boundaries exist; ranking, deduplication, ownership, snooze/expiry, and notification policy need design |
| E — Cross-Provider/device continuation | Session, Context Pack, Knowledge, Daemon, clients, connectors | Project OS Project/Task state remains canonical; Provider owns native Session; external system owns its live records | Covered at principle level. Context Handoff, Session reuse, event reconciliation, and controller policy need contracts |
| F — Self-hosted install/recovery | Workspace, storage, secrets, runtime, backup/restore, portability | User-controlled deployment owns canonical Workspace state; optional hosted conveniences cannot become mandatory authority | Requirement is explicit. Topology, install path, restore procedure, and operational ownership remain validation/design work |

## 3. Functional scope coverage

All 32 functional groups in `docs/01` have an owning design area. No group is removed or reclassified as out of scope by this review.

| Functional groups | Owning documents | Architecture review |
|---|---|---|
| F01–F04 Workspace, portfolio, Project, structure | `docs/02`, `docs/03`, `docs/11` | Core boundary exists; team/workspace membership and cross-workspace sharing need a role/resource matrix |
| F05–F08 Task, dependencies, lifecycle, intake | `docs/02`, `docs/03` | Task boundary and semantic states exist; final transition table and Project Current State schema remain open |
| F09–F10 participants and communication | `docs/02`, `docs/04` | Accountability/execution separation exists; team participation and thread abstraction need further definition |
| F11–F16 Agent registry, Session, delegation, coordination, Run, Runtime | `docs/02`, `docs/04`, `docs/05`, `docs/10`, `docs/18` | Strongest design coverage; Session cardinality, Assignment/Run binding, Provider contract, and first runtime remain open |
| F17–F19 workflow, planning, autonomy | `docs/07`, `docs/11` | Control flow and bounded autonomy are defined; Trigger/Workflow lifecycle and Mandate/policy semantics need contracts |
| F20–F22 knowledge, Memory, Skills | `docs/08`, `docs/07` | Layers and extraction gate exist; source precedence, conflict handling, Skill lifecycle and evaluation need detail |
| F23 plugins/connectors | `docs/10`, `docs/11` | Contract direction exists; sandbox, signature, update and trust model remain open |
| F24–F26 artifacts, Review, governance | `docs/02`, `docs/06`, `docs/11` | Evidence and approval boundaries exist; final state transitions and revocation behavior need contracts |
| F27–F29 visualization, clients, Attention | `docs/09`, `docs/04` | Shared client model exists; Attention ranking and interaction policy need definition |
| F30–F31 observability, portability | `docs/11`, `docs/12` | Requirements exist; deployment/restore validation and operational metrics remain open |
| F32 search and command palette | `docs/01`, `docs/09`, `docs/11` | Capability is in scope; permission-aware indexing and command authorization must inherit the canonical policy model |

## 4. Core object and state authority map

| Object / fact | Intended authority | Owning documents | G1 assessment |
|---|---|---|---|
| Workspace, membership, roles, policy | Project OS Control Plane | `docs/02`, `docs/11` | Owner identified; role matrix and cross-workspace sharing remain open |
| Project, Goal, Milestone, Task, dependencies | Project OS domain store | `docs/02`, `docs/03` | Owner identified; Task ownership/cardinality and final state transitions remain proposed |
| Accountable owner, executor, reviewer, collaborator | Project OS collaboration domain | `docs/02`, `docs/04` | Semantics separated; exact team participation model remains open |
| Assignment and Run | Project OS execution/control domain | `docs/02`, `docs/05`, `docs/07` | Separate identities established; Assignment cardinality and transition/receipt contract need G3 |
| Project OS Session and SessionBinding | Project OS execution domain | `docs/02`, `docs/05`, `docs/18` | Identity boundary established; Session reuse and binding cardinality remain open |
| ProviderSessionRef and native transcript | Provider/runtime | `docs/02`, `docs/05`, `docs/18` | Provider owns native conversation data; transcript storage/retention/sync policy remains open |
| RuntimeProcess, SessionConnection, local event spool | Local Daemon / Runtime Node | `docs/02`, `docs/05`, `docs/18` | Distinct from Session; host lifecycle and recovery need real Provider validation |
| Canonical domain events, command receipts, Outbox/Inbox | Validated domain command layer and transactional store; runtime retains raw provider events | `docs/05`, `docs/07`, `docs/11`, `docs/18` | Authority direction exists; concrete envelope, transition guards and reconciliation contract need G3 |
| Artifact, Evidence, Review, Approval | Project OS governance domain; source system owns its original artifact/live facts | `docs/02`, `docs/06` | Boundary exists; full state/approval lifecycle and revocation semantics need G3 |
| Knowledge, Decision, Memory, Skill, Context Pack | Project OS knowledge layer; external provider owns its original page/record | `docs/02`, `docs/08` | Provenance and permission rules exist; conflict precedence and Skill validation need G2/G3 |
| Trigger, Source, Workflow, Subscription, Connector | Integration/workflow boundary; canonical domain writes remain inside Project OS | `docs/02`, `docs/07`, `docs/10`, `docs/11` | Boundary exists; lifecycle, retry and authorization contracts need G3 |

## 5. Critical architecture findings

Severity meanings:

- **P0 — implementation blocker:** must be resolved or explicitly held behind a Gate before schema/API/shared-contract work or side-effect execution.
- **P1 — subsystem blocker:** must be resolved before the corresponding subsystem is implemented or released.
- **P2 — later product validation:** can remain open during architecture preparation if it is visible and does not leak into implementation.

| ID | Finding | Severity | Owner / evidence | Required resolution and block |
|---|---|---|---|---|
| G1-01 | Preparation gates G0–G5 collided by name with implementation gates G0–G7 in `docs/12` | P0 process | `docs/12`, `docs/19` | Corrected on this branch: `docs/12` now names Stage 0–7 exit/acceptance gates, preserving G0–G5 for preparation. Keep this distinction in all task briefs |
| G1-02 | Canonical authority topology is not selected: local-first, self-hosted Hub, and hybrid are all candidates | P0 | `docs/11`, `docs/14` P-005/P-008 and platform questions | G2 compares mature deployment/storage options; G3 records an ADR and selects one canonical Workspace writer. Block database/API and sync implementation until then |
| G1-03 | Core object cardinalities are not frozen: Task-to-Project ownership, Assignment executor count, Session reuse across Tasks, and Session-to-Run/Assignment binding | P0 | `docs/02`, `docs/03`, `docs/05`, `docs/18`; `docs/14` P-001/P-003/P-004/P-010 | G3 must settle the minimal relationships and versioning rules with examples. Block shared schema and parallel module contracts |
| G1-04 | State machines are only candidate semantics; several durable objects have no explicit lifecycle or transition owner | P0 | `docs/02` §5–8, `docs/03`, `docs/05`, `docs/06`, `docs/07`, `docs/18` | G3 must produce transition tables for Project, Task, Assignment, Run, Session/Binding, Review, Approval, Trigger, Workflow, and external-effect receipts, including actor, guard, event, terminal/retry behavior |
| G1-05 | Command/event contract and unknown external-effect outcomes are principles, not a complete executable contract | P0 | `docs/06`, `docs/07`, `docs/11`; `docs/14` P-005/P-006 and execution questions | G3 must specify command IDs, expected versions, idempotency, event envelope/causality, Outbox/Inbox, receipt states, replay and reconcile-before-retry. Never claim exactly-once delivery |
| G1-06 | Authorization is directionally defined, but Mandate/scope evaluation, permission revocation during a Run, and approval consumption are not fully specified | P0 for side effects | `docs/06`, `docs/07`, `docs/11`; `docs/14` P-005 | G3 must define actor/resource/operation/scope/policy-version checks and approval binding. Block public/destructive effects and autonomous execution until then |
| G1-07 | Local Session data and control policy remain open: transcript ownership/retention, first real Provider, controller lease, event gaps, and cross-Task reuse | P0 for Session implementation | `docs/18` §7–15; `docs/14` P-010–P-013 | G2 validates official Provider APIs and limits; G3 freezes adapter, binding, retention and controller contracts. Do not start parallel Provider adapters before the shared contract |
| G1-08 | Context Pack has a field list and provenance rules, but source precedence and stale/conflicting instruction resolution are open; Skill extraction lacks a complete lifecycle/evaluation contract | P1 | `docs/08`, `docs/07`; `docs/14` P-009 and execution questions | G2 evaluates reusable Memory/Skill components; G3 specifies candidate → validation → user approval → versioning → execution → feedback/rollback. Skill never grants permission |
| G1-09 | Workspace isolation is concrete for code worktrees but generic for non-coding work | P1 | `docs/05` §7; `docs/11` §6; `docs/14` execution questions | G3 defines resource-specific isolation and conflict handling for documents, browser sessions, data and external records. Do not design the product as coding-only |
| G1-10 | Attention Center inputs are listed, but ranking, deduplication, ownership, snooze/expiry, and notification thresholds are not | P1 | `docs/04` §7; `docs/09`; F29 | Define the actionable attention model before F29 implementation; do not turn token/tool telemetry into user interruptions |
| G1-11 | Self-hosted core requirement is confirmed, but canonical topology, install/update/rollback, backup/restore, secret recovery and offline operation are not validated | P1 for distribution | `docs/11` §2/§8/§13; `docs/12` D0–D5; `docs/14` platform questions | G2 evaluates reusable deployment/data modules; G3 records topology and operations ADR; release gates must test clean install and restore |
| G1-12 | Plugin/connector trust model is incomplete: sandboxing, signature, compatibility, update/rollback, and effective permission introspection remain open | P1 | `docs/10`, `docs/11`; `docs/14` platform questions | G2 evaluates SDK/sandbox candidates; G3 defines trust and permission contract before marketplace or third-party plugin execution |
| G1-13 | Workspace/team membership and cross-workspace resource sharing do not yet have a complete role/resource matrix | P1 | `docs/02`, `docs/04`, `docs/11`; `docs/14` domain/platform questions | G3 defines minimum personal/team role and resource-scope matrix before shared Workspace implementation |

## 6. Degraded-path review

| Failure / transition | Existing protection | Remaining work |
|---|---|---|
| Client window closes | Session, RuntimeProcess and SessionConnection are separate; Daemon can outlive UI | Validate behavior against the first Provider and local OS process lifecycle |
| Provider process exits | Session may remain resumable; states are separate | Define provider-specific recovery and unknown state behavior |
| Provider stream disconnects or misses events | Event cursor, local spool, history reconciliation, explicit Event Gap | Pin Provider APIs and test replay/history completeness |
| Session command times out | Command identity/receipt; do not blindly resend | Define exact uncertain-outcome state and reconciliation protocol |
| Agent Run fails or is interrupted | New revision uses a new Run; handoff and evidence are durable | Finalize Assignment/Run transitions and retry guards |
| Worker loses ownership | Claims/leases, expected version, fencing | Define resource-specific lease expiry and stale-write rejection |
| External side effect has unknown outcome | Reconcile before retry; idempotency where supported | Define per-connector receipt and compensation policy |
| Offline client submits command | Server-confirmed canonical state; revalidate on reconnect | Select authority topology and conflict UX |
| Context becomes stale or conflicts | Provenance, freshness and explicit source references | Define source precedence and conflict presentation |
| Permission changes during execution | Authorization checked at runtime boundary | Define in-flight revocation and stop/continue semantics |
| Backup restore or Provider migration | Portability and Context Handoff requirements exist | Prove clean restore and accurate Provider limitations in release tests |

## 7. Architecture boundaries that should remain stable

These are sufficiently grounded to preserve through G2/G3; they do not require a specific technology choice:

1. Project is durable; Task, Assignment, Run and Session remain distinct identities and lifecycles.
2. Human accountability is separate from Agent execution.
3. Direct Agent Session use and Coordinator-driven work are both first-class.
4. Project OS owns canonical Project/Task/Assignment/Run state; external systems retain authority over their original records.
5. Provider-native transcript/session data, Project OS Session identity, RuntimeProcess and SessionConnection remain distinct.
6. Canonical domain writes go through validated command logic; connectors and Agents do not invent canonical state.
7. External effects use durable intent, idempotency and reconciliation; do not promise global exactly-once delivery.
8. Context is permission- and freshness-aware; Skill is a reviewed method input, never an authorization grant.
9. Parallel execution uses isolated mutable resources; stale writers fail closed.
10. Full product scope remains intact; delivery sequencing does not turn the product into a coding-only Agent launcher.

## 8. G1 gate result and next action

**G1: PASS as an architecture review.** Every PRD journey and functional group has an identified owning area and state authority. Critical ambiguities are explicitly recorded with severity, owner, resolution gate and implementation block. The only process-level collision found—the G0–G5 preparation labels versus docs/12 implementation gate labels—has been corrected on this branch.

**Next: G2 — Mature-module Reuse Assessment.** Evaluate modules against the exact product boundaries and unresolved contracts above. Reuse decisions must be made capability-by-capability; no competitor or framework is adopted wholesale. G3 will then freeze only the shared contracts and ADRs needed for safe implementation.

No parallel implementation is authorized by this G1 PASS.
