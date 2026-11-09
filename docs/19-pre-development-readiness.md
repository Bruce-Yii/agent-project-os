# 19 — Pre-development Readiness Plan

**Status:** Plan recorded; G0–G5 have not started.  
**Snapshot:** 2026-11-10  
**Purpose:** Prepare the existing product and architecture design for implementation by checking consistency, closing critical architecture gaps, assessing reusable modules, defining engineering contracts, and producing an executable development-document package.

## 1. Decision and phase boundary

The design-stage product decision is already **GO — worth developing**. This phase does not reopen that decision and does not require a prototype, full competitor installation, or full E2E run before product/design feasibility can be assessed.

The work sequence is:

**G0 Design Baseline → G1 Architecture Review → G2 Reuse Assessment → G3 Engineering Decomposition → G4 Release Roadmap → G5 Documentation Handoff**

These are pre-development preparation gates. They are distinct from the product implementation stages in [12 — Development Sequence](12-development-roadmap.md). Passing G5 means the documentation is ready for implementation; it does not mean code or a release exists.

## 2. Product constraints to preserve

1. **Project is the stable center.** Project identity, goals, current state, decisions, knowledge, and delivery outlive any Agent, window, Session, Run, Provider, or machine.
2. **Execution resources are dynamic.** Agents, Assignments, Runs, Sessions, runtimes, and clients can be added, replaced, resumed, or run in parallel without replacing the Project.
3. **Keep identities separate.** Task, Assignment, Run, Session, ProviderSessionRef, RuntimeProcess, and SessionConnection are different objects.
4. **Direct Agent use and Coordinator-driven execution are both first-class.** A Coordinator must not become a mandatory bottleneck.
5. **People operate at Project level.** The system absorbs routine routing, handoff, status tracking, recovery, and context assembly instead of making users supervise every Agent conversation.
6. **Preserve the full 32-group product scope.** Implementation sequencing does not delete capabilities or redefine the product as a coding-agent launcher.
7. **Complete target vs release stages:** the full product target may be described as 10.0. Intermediate releases such as 1.0, 2.0, and later increments must each be independently usable. Stage contents are determined by dependency analysis.
8. **DeepSeek DSH is an architectural input, not the product boundary.** Study Trigger, Router/Coordinator, Ticket, Assignment, Worker, durable Effects/Outbox, recovery, and Watchdog. Do not port the prototype wholesale or force users into an Agent-centric workflow.
9. **Experience-to-Skill is a supporting capability.** Project conversations, execution traces, user corrections, and review outcomes can produce reusable Skill candidates that improve later execution. It is not a separate product or control plane.
10. **Memory ≠ Skill.** Memory preserves facts, context, decisions, and project history. Skill preserves reusable methods for a class of work. Skills do not grant permissions or override Project policy.
11. **Fair competitor comparison:** compare each competitor's relevant product/function subset with our corresponding capability. Never aggregate different competitors' strengths into a fictional composite competitor. Add beyond-parity capabilities only when their value justifies cost and complexity.
12. **Open source and free self-hosting remain product requirements.** Core capabilities must not require a mandatory subscription; users bear their chosen model, hardware, hosting, and third-party costs.

## 3. Relationship to existing repository documents

This phase adds a preparation layer; it does not create a second documentation hierarchy.

| Existing document | Authority / responsibility | Use in this phase |
|---|---|---|
| 00 — Product Charter | Product purpose, users, value, scope, principles | Product source of truth |
| 01 — Functional Catalog | Full 32-group scope | Trace all capabilities into architecture and roadmap |
| 02 — Domain Model | Durable objects, relations, ownership, state | Main input to architecture and contracts |
| 03–11 | Capability specifications | Review module responsibilities and gaps |
| 12 — Development Sequence | Product implementation dependency order | Reconcile with independently usable release stages; do not duplicate |
| 13 — Competitor and Reuse Analysis | Existing product/project evidence | Reassess candidates against current code, license, compatibility, and integration cost |
| 14 — Open Decisions | Confirmed direction, proposals, unresolved decisions | Record material decisions and blockers; use ADRs for architecture changes |
| 15–16 | Glossary and source traceability | Maintain terminology and provenance |
| 17 — Agent Development Contract | Parallel execution, ownership, integration, review | Governs implementation collaboration |
| 18 — Local Agent Session Subsystem | Local Session product/runtime contract | Preserve as a first-class Desktop capability |
| templates/ | ADR, module contract, work package templates | Reuse existing templates |

Update the document that owns a subject. Add a new document only when a distinct responsibility cannot be placed cleanly in an existing one. Do not copy whole contracts across files.

## 4. G0 — Existing design and repository baseline

**Objective:** Establish one reliable inventory of existing assets, their authority, and their status.

**Work**
- Read the actual repository state: default branch, README, AGENTS, docs, templates, manifest, changelog, and status.
- Read the current Notion project home, product definition, system architecture, design discussions, reuse research, and relevant confirmed decisions.
- Map Notion design areas to their owning Git documents.
- Separate confirmed requirements, proposals, open decisions, and historical material.
- Identify stale copies, missing content, contradictions, duplicate contracts, and unlinked decisions.
- Record exact repository/document baseline.

**Deliverables**
- Design asset inventory and authority map.
- Notion-to-Git traceability map.
- Consistency/discrepancy register, distinguishing confirmed conflict, stale copy, missing decision, and non-blocking difference.
- List of documents to update in place versus genuinely new documents.

**Exit condition:** Every product/domain/architecture/engineering rule has an identifiable authority. No implementation-critical contradiction is hidden in an old discussion or duplicate document.

## 5. G1 — Architecture review and completeness audit

**Objective:** Confirm the current design can support the full product without ambiguous ownership or missing lifecycle paths.

**Review**
- Map core user journeys to modules and domain objects.
- Review Project, Task, Assignment, Run, Session, Agent, Provider, Runtime, Artifact, Evidence, Review, Approval, Knowledge, Memory, Skill, Workflow, Trigger, and Connector boundaries.
- Check identity, ownership, lifecycle, authority, relations, and state machines.
- Review retries, handoffs, cancellation, recovery, command/event contracts, causality, idempotency, Outbox/Inbox, receipts, replay, and external side effects.
- Review Control Plane, Execution Plane, Integration Plane, clients, and data responsibilities.
- Review Local Daemon, Provider adapters, continuous Session streaming, event gaps, reconnect/reconciliation, and cross-device control.
- Review permissions, secrets, workspace isolation, plugin trust, and approval boundaries.
- Review Context Pack, Project Memory, decisions, and Skill delivery into execution.
- Inspect failure/degraded paths as well as happy paths.

**Deliverables**
- Architecture review matrix: area, current design, source/evidence, gap, severity, resolution, owning document.
- User-journey-to-module/object map.
- State/lifecycle/authority gap list.
- ADRs for material choices; non-blocking unknowns remain in docs/14.

**Exit condition:** Every critical journey has a clear module owner and state authority. Critical ambiguities are resolved or explicitly owned and blocked from leaking into parallel implementation.

## 6. G2 — Mature-module reuse assessment

**Objective:** Avoid rebuilding mature infrastructure when direct reuse or a thin adapter is more efficient.

Assess candidate capabilities independently; do not assume any project should be adopted wholesale:

- Agent Runtime / Harness / Provider adapters;
- local Session creation, attachment, streaming, and reconnect;
- Coordinator / Worker / task execution;
- durable scheduling, events, Outbox, retry, recovery, and Watchdog;
- workflow / trigger engines;
- Memory, retrieval, Context Pack, and Skill systems;
- plugin SDK and connector frameworks;
- Desktop shell, Mobile, Web UI, terminal, diff, and workspace handling;
- database, event transport, notifications, observability, backup, and deployment.

Inspect official docs, source, tests, releases, open/closed Issues, PRs, maintainer responses, and licenses. Lock exact commits/package versions where relevant.

**Classification**

| Choice | Meaning |
|---|---|
| Direct reuse | Adopt an existing module/package with limited configuration |
| Adapt / wrap | Keep the implementation behind our own adapter/contract |
| Reference design | Reuse the design, implement our own boundary |
| Build ourselves | No suitable mature option, or reuse cost/risk exceeds value |

**Evaluation dimensions:** capability fit; license; maintenance/release stability; API/protocol stability; security and isolation; platform/deployment assumptions; data coupling and migration; adaptation and maintenance cost; tests and known Issues; upstream exit strategy.

**Deliverables**
- Reuse matrix: candidate, capability, source/version, classification, rationale, license, integration boundary, risks, cost, fallback.
- Explicit exclusions from wholesale adoption.
- Prioritized reuse decisions and ADRs where architecture changes.

**Exit condition:** Every major subsystem has a defensible reuse/adapt/reference/build decision. No large subsystem is marked self-build without checking mature alternatives; no candidate is adopted merely because it is popular or associated with DeepSeek.

## 7. G3 — Engineering decomposition and contracts

**Objective:** Turn the reviewed architecture into bounded work that independent windows/Agents can execute without inventing incompatible interfaces.

**Work**
- Define module responsibility and ownership boundaries.
- Define shared domain types/IDs, schemas, state machines, command/event envelopes, API, Provider contracts, and error semantics.
- Define data ownership, canonical authority, migration boundaries, and external-system truth.
- Define module inputs/outputs, dependencies, failure behavior, security constraints, and observability.
- Identify shared files/contracts that require a single owner.
- Create Work Packages with Goal, Scope, Non-scope, Dependencies, Interfaces, Hard Constraints, Acceptance, Tests, Deliverables, and Handoff.
- Build dependency graph, concurrency plan, integration checkpoints, and independent review ownership.

**Multi-window model**
- W0 is overall control/integration: cross-module alignment, shared contracts, dependency gates, integration, and independent review.
- W1–W7 are potential bounded work windows. Assign their exact modules only after G1/G2/G3 reveal real boundaries; do not preassign arbitrary roles.
- The user gives requirements to ChatGPT. ChatGPT is accountable for planning, dispatch quality, prevention, review, correction, and acceptance. Execution Agents implement bounded packages.
- Use 5–7 parallel windows only where dependencies and file ownership permit. Parallelism never justifies starting dependent work early.
- One owner per shared schema/interface/config file; isolated branch/worktree per independent coding stream; no concurrent edits to the same shared contract.
- Follow docs/17; do not duplicate its full rules here.

**Deliverables:** module ownership map; domain/API/event/Provider contracts with examples; Work Package backlog and dependency DAG; file ownership/parallelization map; integration/review/test strategy.

**Exit condition:** Every Work Package is independently understandable within its scope; dependencies, interfaces, owners, acceptance evidence, and integration gates are explicit.

## 8. G4 — Independently usable implementation roadmap

**Objective:** Sequence the complete product without sacrificing its full design.

**Work**
- Reconcile the architecture dependency graph with docs/12.
- Define stages toward the complete product target (10.0), with intermediate releases such as 1.0, 2.0, and later increments as appropriate.
- Each stage must be independently installable, runnable, and useful. Development can stop after any delivered stage without leaving an unusable system.
- Define each stage's capability subset, prerequisites, migrations, integrations, user journey, and acceptance.
- Identify cross-cutting foundations required early: identity, authorization, persistence, events, observability, and migrations.
- Distinguish deferred implementation from removed product scope. Nothing is removed from the 32-group catalog without an explicit product-owner decision.
- Preserve the complete self-hosted path; core capability must not depend on a paid vendor service.

**Deliverables:** staged release map; dependency graph/critical path; per-stage scope, prerequisites, migration/compatibility and acceptance; stop-point analysis.

**Exit condition:** The sequence is dependency-correct, every stage has a coherent usable outcome, and full scope remains traceable.

## 9. G5 — Development documentation package and handoff

**Objective:** Make the repository an executable specification for the implementation team.

**Work**
- Update existing docs in their owning locations; do not reorganize the repository for appearance.
- Add only contracts, ADRs, diagrams, module specs, and Work Packages shown to be missing by G0–G4.
- Give every document a status, scope, source/decision references, and separation between confirmed requirements, proposals, and unresolved choices.
- Align README reading order, AGENTS instructions, manifest, changelog, and checksums with the actual document set.
- Check consistency across PRD, functional catalog, domain model, architecture, roadmap, open decisions, local Session contract, and Agent development contract.
- Produce a clear handoff: ready work, intentionally open items, decisions required before each package, and actions not yet authorized.

**Deliverables:** linked development-document package; updated index/status/manifest/changelog/checksums; accepted ADRs; initial dependency-ready Work Packages; final handoff report.

**Exit condition:** A new implementation Agent can follow README/AGENTS, read its Work Package and referenced contracts, know exactly what to change/not change, test, and return as evidence without asking the user to repeat product context.

## 10. Cross-cutting rules

- No duplicate source of truth; update the owning document and link to it.
- A proposal does not become confirmed merely because it is documented.
- Distinguish official documentation, source-confirmed behavior, Issue reports, maintainer confirmation, and inference.
- Public research first: docs, source, tests, Issues, PRs, releases, and discussions. Real-machine tests are targeted tools for unresolved implementation facts, not a prerequisite for product value or design feasibility.
- Research only when it can change a decision. Do not expand it indefinitely.
- No premature stack freeze or microservices; establish module boundaries before choosing deployment topology.
- No scope reduction disguised as sequencing.
- No parallel implementation before relevant G3 contracts and ownership boundaries pass.
- Agent self-report is not acceptance; W0 independently reviews evidence.

## 11. Gate status

Writing this plan does not mark any gate complete.

| Gate | Status | Completion evidence |
|---|---|---|
| G0 — Design Baseline | NOT STARTED | Inventory, authority map, discrepancy register |
| G1 — Architecture Review | NOT STARTED | Journey/module map, review matrix, critical gaps resolved |
| G2 — Reuse Assessment | NOT STARTED | Reuse matrix, license/version checks, adopt/adapt/build decisions |
| G3 — Engineering Decomposition | NOT STARTED | Contracts, ownership map, Work Packages, dependency DAG |
| G4 — Release Roadmap | NOT STARTED | Independently usable staged release plan |
| G5 — Documentation Handoff | NOT STARTED | Consistent implementation-ready document package |

## 12. Explicit non-goals

- Reopening the design-stage GO decision without material new evidence.
- Requiring a working prototype, full competitor installation, or full E2E run before judging product/design feasibility.
- Replacing docs/00–18 with a second documentation hierarchy.
- Rewriting the architecture from scratch when targeted correction is sufficient.
- Freezing all technology choices before reuse assessment.
- Reducing full product scope to simplify the first release.
- Starting code, deployment, or public release merely because this plan has been written.

## 13. Completion and transition

G5 is complete when current specifications and implementation Work Packages are coherent, main contracts have owners, each release stage is independently usable, and remaining decisions are explicitly classified.

After G5, implementation may begin in dependency order under docs/17. The first implementation Work Package must still inspect the actual local repository/environment and current upstream versions before changing code; that is implementation bootstrap, not a substitute for this preparation phase.

**Current state:** this document records the preparation plan only. G0–G5 remain NOT STARTED. No code implementation is claimed.
