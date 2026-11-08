# 12 — Development Sequence and Parallel Workstreams

**Purpose:** order the work from core to outer dependencies while preserving the full product scope. This is a development design, not an authorization to start coding or create execution issues.

## 1. Dependency order

### Stage 0 — Product and domain contracts

**Must settle first:**
- product invariants and full capability boundary;
- Workspace/Project/Task/Participant/Assignment/Run/Session/Artifact/Review identities;
- canonical authority and external truth rules;
- state machines and command/event contract;
- baseline identity, permission, and secret boundaries.

**Deliverables:** product charter, functional catalog, domain model, state transition tables, API/event contract draft, ADRs for unresolved choices.

**Gate G0:** no two parallel implementation streams can interpret the same object or state transition differently.

### Stage 1 — Project and Work Management core

Build:
- Workspace and membership;
- Project, Goal, Milestone, Project lifecycle;
- Task/Subtask, dependency graph, intake/triage;
- Project Current State and core views;
- human ownership and basic collaboration.

**Gate G1:** Project and Task remain stable across clients/restarts; dependencies and status semantics pass contract tests.

### Stage 2 — Agent identity and execution foundation

Build:
- Agent Registry and Provider capability model;
- Local Daemon lifecycle, Provider discovery/version/capability detection, and secure pairing;
- Workspace/worktree isolation;
- durable Session metadata separated from ProviderSessionRef, RuntimeProcess, and SessionConnection;
- Session creation and attachment to one real local Provider;
- continuous message/event streaming, send/steer/interrupt, local event spool, reconnect and history reconciliation;
- Assignment, Run, Session binding, checkpoint, handoff, and artifact references;
- direct Agent Session experience without mandatory Task creation.

**Gate G2:** one real local Provider can be discovered, launched, attached, and continuously observed from Desktop; the user can send a follow-up; UI restart/reconnect does not create a duplicate Session; missed events are replayed/reconciled or shown as an explicit gap; supported Session/Run operations are linked to a Project/Task while direct standalone Session mode also works. Provider limitations, credentials, and host offline truth are tested.

### Stage 3 — Review, approval, and safe delivery

Build:
- Artifact and Evidence model;
- Review and acceptance flow;
- authorization and risk tiers;
- scoped approval and audit;
- external truth refresh for GitHub or first selected forge.

**Gate G3:** Agent cannot self-accept; a review can verify the exact artifact/commit; high-risk effects are gated.

### Stage 4 — Multi-Agent coordination and workflows

Build:
- Coordinator plan and Work Package generation;
- Scheduler and capability matching;
- parallel Assignments and dependency-aware routing;
- Source/Trigger intake, workflow engine, Outbox/Inbox;
- bounded autonomous execution sub-capability;
- Personal Execution Skill integration as a method input.

**Gate G4:** multiple independent Tasks execute concurrently in isolated workspaces; failure/recovery does not duplicate external effects; autonomy cannot exceed its mandate.

### Stage 5 — Knowledge and Project context

Build:
- Resource/Knowledge/Decision records;
- provenance and versioning;
- retrieval and Context Pack assembly;
- selective memory extraction;
- one external Knowledge Provider (Notion is a candidate, not the only possible provider).

**Gate G5:** a new window/Agent can reconstruct the Project from current state and relevant sources without reading the full chat history.

### Stage 6 — Client breadth and plugin ecosystem

Build:
- Desktop full workspace and complete local Agent Session workbench (multi-Provider, multi-Session, terminal/diff/permission views);
- Web client and shared project experience;
- Mobile project control, review, approval, remote Agent interaction;
- plugin SDK, provider integrations, connector framework, plugin discovery.

**Gate G6:** same Project and Run state is consistent across Desktop/Web/Mobile; plugin permissions and compatibility are visible.

### Stage 7 — Operational maturity and expansion

Build:
- cost/usage dashboards and budgets;
- backup/restore, import/export, migration;
- enterprise/team controls as validated;
- plugin marketplace operations;
- reliability, performance, and scale improvements.

**Gate G7:** operational runbooks, recovery drills, security review, and data portability pass.

## 2. Cross-cutting foundations

Security, identity, event contracts, observability, migration strategy, and testing are not postponed until the final stage. They are defined at Stage 0 and implemented with every stage.

## 3. Parallelization strategy

Parallelize only after shared contracts are stable. Suggested streams:

| Stream | Ownership boundary | Can run in parallel after |
|---|---|---|
| W0 Architecture / integration | domain contracts, ADRs, integration tests, cross-module review | starts first; owns shared contracts |
| W1 Project & Task | Workspace, Project, Task, dependencies, Current State | G0 |
| W2 Agent Runtime | Provider adapters, Daemon, Runtime Node, Session, Run | G0 + execution interface draft |
| W3 Client experience | navigation, Project workspace, task views, session UI | domain/API view contracts |
| W4 Knowledge & connectors | resources, provenance, Notion/GitHub connector contracts | domain + plugin contracts |
| W5 Orchestration | Coordinator, Scheduler, Trigger, workflow, autonomy | Task/Assignment/Run/Policy contracts |
| W6 Quality & security | contract tests, failure tests, authorization, recovery, threat model | each module contract as it stabilizes |

A workstream may use subagents, but the parent window owns the output and must review it.

## 4. Parallel development rules

- Each workstream owns a clearly bounded directory/module.
- Do not let independent Agents edit the same files or shared schemas concurrently.
- Use one worktree/branch per workstream or task-run.
- Changes to domain contracts require an ADR and impact review before merge.
- Merge only after interface/contract tests pass.
- Do not treat a green unit test as proof of cross-module behavior.
- Integration owner verifies the assembled system, real external state, and side effects.
- Keep the complete feature catalog; mark deferred implementation, not deleted scope.

## 5. End-to-end acceptance path

A meaningful full-system E2E should eventually verify:

1. create Workspace and Project;
2. define Goal and Work Package with scope and acceptance criteria;
3. assign human accountability and one or more Agent executors;
4. connect local or remote Runtime;
5. dispatch unique Run(s) to isolated workspaces;
6. stream and persist execution events;
7. produce durable Artifacts/Evidence;
8. independently Review and request/accept changes;
9. update Project Current State and unlock dependencies;
10. inspect and intervene from a second client/device;
11. restart/reconnect and recover without duplicate side effects;
12. verify permissions, audit, and external live truth.

## 6. Do not do yet

- Do not freeze a frontend/backend/database stack based only on the current candidates.
- Do not create a microservice for every functional group.
- Do not copy AWRP's GitHub relay storage as the final database by default.
- Do not port DSH's entire runtime or product assumptions.
- Do not build the marketplace before plugin contracts and security are stable.
- Do not implement a broad autonomous loop before authorization, idempotency, Run recovery, and review are reliable.
- Do not delete full-product requirements merely to simplify the first release.

