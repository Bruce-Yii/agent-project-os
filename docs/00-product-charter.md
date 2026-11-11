# 00 — Product Requirements Document (PRD) & Product Charter

**Version:** v0.3 product definition baseline  
**Status:** Product direction, design lineage, unified positioning, open-source direction, and free self-hosted use are confirmed. Target segment, detailed UX, exact license, technology stack, and release boundaries remain to be validated.  
**Last reviewed:** 2026-11-09

## 1. Executive summary

**Agent Project OS** is an open-source, free-to-self-host Project Operating System for people and teams working with multiple AI Agents.

It unifies long-lived Project management, human–Agent collaboration, multi-Agent execution, local Agent Sessions, knowledge and context, workflows, plugins, integrations, review, governance, and cross-device control in one coherent product.

The product is **Project-centered, not Agent-centered**. A Project is the durable identity and source of continuity. People own goals and consequential decisions. The system organizes work and shared state. Agents, Providers, Sessions, Runs, and Runtime Nodes are replaceable participants or execution resources.

The product should let a user run the complete core system on their own computer or infrastructure, connect their own Agent Providers and model accounts, and use the core capabilities without a mandatory hosted subscription or feature paywall.

**Positioning statement**

> An open-source, self-hosted Project OS that unifies people, projects, Agents, execution, knowledge, and delivery in one continuous workspace.

**Short promise**

> One Project OS. All your work, people, and Agents — connected.

## 2. Product origin and design lineage

This product emerged from the combination of three distinct bodies of experience. They are design sources, not products to copy wholesale.

### 2.1 AWRP — reliable coordination and execution

AWRP (Agent Work Relay Protocol) was our earlier engineering experiment for coordinating a human authority/coordinator with one or more coding workers.

It contributed practical lessons and proven protocol concepts:

- stable Project identity and durable Task identity;
- Task and Run are different: a Task survives multiple execution attempts;
- explicit dispatch, ACK, HANDOFF, review, approval, and recovery;
- append-only event facts, sequence/hash-chain validation, and read-after-write verification;
- one execution per Run identity, idempotency, claims/fencing, and conflict containment;
- durable Artifacts and exact evidence, rather than relying on prose claims;
- fail-closed behavior when identity, route, state, or authority is ambiguous;
- transport/connectors carry validated semantics; they do not invent canonical state.

AWRP was deliberately a small coordination protocol, not a full Agent platform. It had no general product UI, realtime streaming, database-backed Project OS, mobile clients, or full autonomous orchestration. Its GitHub relay and exact wire schema are historical implementation choices, not requirements for this product.

**Design contribution:** make Agent execution reliable, attributable, recoverable, and reviewable.

### 2.2 Our Linear operating model — persistent project governance

After AWRP, we used Linear as the operational layer for long-running Projects and bounded work packages. This means both Linear's product patterns and, more importantly, our actual Project OS design and working conventions.

It contributed:

- long-lived Projects that survive individual Agent windows and sessions;
- Project Current State as the compact operational truth: goal, phase, active work, waiting, blockers, review, last verified state, and next action;
- bounded Issues/Tasks with clear goal, scope, non-scope, constraints, acceptance criteria, and ownership;
- disciplined task creation and deduplication: a new Run, retry, status check, or small correction does not automatically create a new Task;
- explicit differences between Waiting, Blocked, In Progress, and Review;
- human accountability separated from Agent execution/delegation;
- research-to-execution transition, durable decisions, review evidence, and cross-window recovery;
- external systems such as GitHub remain the Live Truth for their own records.

We do not intend to inherit Linear's proprietary schema, SaaS-only architecture, plan limits, or the historical Notion/Linear split as mandatory technical boundaries.

**Design contribution:** make complex Projects understandable and operable over time, even when execution resources and windows change.

### 2.3 DeepSeek DSH Super-agent — event-driven autonomy and orchestration

The DeepSeek Super-agent / DSH prototype contributed a third set of architectural ideas:

- Source and Trigger as explicit event-intake concepts;
- Eval and Decision before creating or dispatching work;
- Mandate and scope as explicit authorization boundaries;
- Ticket and Assignment as different concepts;
- Executor and Runtime separation;
- Subscriptions, Channels, and context delivery;
- transactional Engine writes, Outbox/effect processing, and recovery of interrupted work.

DSH is a prototype and an architectural reference, not a complete production Project OS. Its domain model, harness assumptions, UI, deployment, and execution engine must not be copied without validation.

**Design contribution:** enable bounded, event-driven, recoverable Agent work without requiring the human to manually coordinate every step.

### 2.4 The synthesis — a new product, not a port

The three sources answer different questions:

| Design source | Core question | Contribution to this product |
|---|---|---|
| AWRP | How do multiple executors work safely and hand work back reliably? | Execution identity, event integrity, handoff, fencing, evidence, recovery |
| Our Linear operating model | How does a Project remain understandable and manageable over time? | Project, Work Package, Current State, lifecycle, ownership, review, continuity |
| DeepSeek DSH | How can a system evaluate events and continue bounded work autonomously? | Trigger, Eval, Mandate, Assignment, subscriptions, Outbox, runtime recovery |

The product is the **new unified model created by combining these lessons**. It is not AWRP v2, a Linear clone, a graphical DSH port, a generic Agent company simulator, or a collection of disconnected tools.

## 3. Core problem

As people adopt more Agents and Providers, their execution capacity increases faster than their ability to coordinate work.

A user may manage Projects in one system, Agent organization in another, local Sessions in several clients, knowledge in documents, code and delivery in GitHub, and automations elsewhere.

The user becomes the integration layer:

- translating goals into tasks across tools;
- carrying Project context between Agent Sessions;
- remembering which Agent is doing what and why;
- manually reconciling Agent output with Task and Project state;
- recovering work after a process, window, machine, or Provider changes;
- chasing approvals, blockers, and handoffs;
- validating completion against actual artifacts and external state;
- paying for and maintaining multiple products that each own only part of the workflow.

The problem is not merely that users need more Agent features. It is that **Projects, people, Agents, execution, knowledge, and delivery do not share one continuous operating model**.

## 4. Product positioning and differentiation

### 4.1 Product category

An open-source, self-hosted, Project-centered operating system for human and Agent work.

### 4.2 What “unified” must mean

Unified does not mean putting several unrelated tools inside one window, or adding connectors while leaving the user to synchronize everything manually.

The product must unify at these levels:

1. **Identity:** one durable Project and Work Package identity across clients, Agents, Providers, Sessions, Runs, and machines.
2. **Domain model:** Project, Goal, Task, Assignment, Run, Session, Context, Artifact, Review, and external references have explicit relationships and distinct lifecycles.
3. **State:** execution events and verified external facts update the same canonical Project/Task state through validated commands and projections.
4. **Context:** a shared, inspectable Context Pack is assembled from relevant Project knowledge, decisions, resources, task constraints, and permissions.
5. **Coordination:** messages, handoffs, approvals, blockers, and important events enter one attention and decision flow.
6. **Governance:** authorization, policy, review, audit, and evidence apply consistently across local Agents, remote Agents, plugins, and external actions.
7. **Clients:** Desktop, Web, and Mobile operate on the same canonical Project state; local execution remains on the machine/Runtime that owns it.

If an integration only embeds another product's UI without connecting its state and lifecycle to the Project OS, it is not sufficient to claim full unification.

### 4.3 Competitive thesis

The product does not claim that Project management, multi-Agent orchestration, local Agent Sessions, cross-device control, or open-source self-hosting are individually unique. Existing products already implement meaningful subsets, and some are themselves open-source and free to self-host.

Our differentiation hypothesis is the combination:

- Project-first rather than Agent-org-chart-first or coding-workspace-first;
- broad project lifecycle, including non-coding research, product, operations, documents, and delivery;
- direct local Agent Sessions and coordinated multi-Agent work in the same Project model;
- continuous Project state and context across Provider/session/runtime changes;
- one consistent permission, evidence, review, and handoff model;
- complete core product available as open-source software for free self-hosted use.

This is a hypothesis to validate through real workflows and competitor testing, not a claim of proven market leadership.

## 5. Target users and jobs to be done

### 5.1 Primary early user hypothesis

**High-frequency Agent users who manage multiple ongoing Projects.**

They use more than one Agent Provider, have multiple Sessions or local execution windows, and maintain meaningful Project context across days or months. They feel the cost of switching tools and manually synchronizing work.

Jobs to be done:

- When I start or resume a Project, show me the actual current state and next useful action.
- When I use a local Agent, let me open/attach a Session in the same workspace and continuously receive messages.
- When several Agents work in parallel, show their assignments, progress, outputs, blockers, and required decisions in one place.
- When I switch Provider or device, preserve the Project and transfer only the context needed to continue.
- When an Agent claims completion, help me inspect the exact deliverable and verify acceptance.
- When an external event arrives, evaluate whether it changes the Project and route it without creating duplicate work.

### 5.2 Secondary users

1. **Independent developers and builders:** coordinate multiple Agents, codebases, environments, and deliverables.
2. **AI Product Managers / Project Owners:** coordinate research, product, engineering, operations, and human/Agent contributors.
3. **Small cross-functional teams:** share Project state and governance while members retain their preferred execution tools.
4. **Agent platform builders and technical users:** self-host, extend Providers/plugins, and customize workflows.

### 5.3 Not the initial focus

- casual users who only need a single chatbot;
- organizations requiring a fully managed enterprise suite before the core self-hosted experience is proven;
- users seeking only a coding IDE or one specific Agent harness.

These are prioritization hypotheses, not permanent exclusions from the architecture.

## 6. Core value proposition

| Value | User-visible result |
|---|---|
| Project continuity | Project identity, decisions, tasks, and current state survive changes to Agent, Session, window, machine, and Provider |
| Unified work management | Goals, Tasks, dependencies, people, Agents, execution, review, and deliverables are connected |
| Direct + coordinated execution | Users can directly open an Agent Session or delegate bounded work to multiple Agents |
| Reduced coordination | One attention surface and automatic state reconciliation reduce manual checking and copy/paste |
| Trustworthy completion | Evidence, permissions, Run identity, and Review distinguish claimed success from accepted outcomes |
| Open and self-hosted | Users control source, data, runtime, Providers, and deployment without a mandatory hosted subscription |

## 7. Product principles and invariants

1. Project is the durable center; Agent, Provider, Session, Run, window, and machine are replaceable.
2. Task ≠ Assignment ≠ Run ≠ Session.
3. Human accountability is distinct from Agent execution.
4. Direct Agent use and coordinated multi-Agent work are both first-class.
5. Agent completion is not Task acceptance; acceptance requires evidence and applicable approval.
6. Project management is broader than coding.
7. Autonomous execution is a sub-capability, not the product identity. Personal Execution Skill is a supporting method input, not a separate product or permission grant.
8. Local Agent Session creation/attachment and continuous message reception are core Desktop requirements.
9. A direct Session can exist without a Task; Project/Task/Run binding is explicit.
10. Project Current State must reflect canonical state and verified external facts, not merely summarize chat.
11. External systems remain authoritative for their live facts.
12. The system absorbs coordination complexity instead of exposing protocol machinery as user work.
13. Full product scope remains visible; staged implementation does not silently delete capabilities.
14. Open-source self-hosting is a product requirement, not a future pricing experiment.
15. Core product capabilities must not be artificially split across mandatory paid tiers.
16. Model inference, user hardware, hosting, and third-party services may still incur costs paid to those providers.

## 8. Complete product scope

The full capability inventory remains the 32 functional groups in [01 — Complete Functional Catalog](01-functional-catalog.md). It includes:

- Workspace, organization, portfolio, Projects, goals, milestones, and Project lifecycle;
- Task hierarchy, dependencies, intake, triage, Current State, and scheduling;
- people, Agent participants, collaboration, discussions, responsibility, and delegation;
- Agent registry, direct Session workbench, multi-Agent coordination, Assignment, Run, and Runtime;
- local/remote/cloud execution, Daemon, Provider adapters, workflows, Trigger, Eval, and bounded autonomy;
- Project knowledge, memory, decisions, Skills, Context Packs, and bootstrap templates;
- plugins, service connectors, external integrations, and Provider handoff;
- deliverables, artifacts, evidence, review, approval, policy, and audit;
- Project/Agent visualization, Attention Inbox, universal search, Desktop, Web, and Mobile;
- observability, cost visibility, data portability, backup, recovery, and self-hosted operations.

The functional catalog defines full product capability. This PRD defines why those capabilities belong together and what user outcome they must produce.

## 9. Core user journeys

### Journey A — Create and operate a long-lived Project

Create a Project → define outcome and milestones → connect repositories/documents/resources → establish people and Agent participants → create bounded Work Packages → see Current State → coordinate work → review deliverables → accept outcomes → preserve decisions and next actions.

**Acceptance outcome:** the Project remains understandable and resumable after all current Agent Sessions and client windows are closed.

### Journey B — Direct local Agent Session

Discover a local Provider → inspect supported capabilities and permissions → choose working directory → create a Session or attach to an existing Session where supported → continuously receive messages/events → send follow-up or interrupt → reconnect after UI closure → optionally bind Session/Artifacts to a Project or Task.

**Acceptance outcome:** a real local Agent can be operated inside Desktop without treating the product as a mere link launcher; event gaps and unsupported Provider behavior are visible.

### Journey C — Multi-Agent delegation

Describe a bounded outcome → assemble authorized Project context → propose a task graph and acceptance criteria → approve required decisions → assign independent work to capable Agents/Runtimes → execute in isolated environments → collect artifacts → review evidence → update Task and Project state → unlock downstream work.

**Acceptance outcome:** parallel execution does not create ambiguous ownership, duplicate side effects, or hidden project-state drift.

### Journey D — Unified attention and human intervention

Aggregate new Agent messages, permission requests, review requests, blockers, failed Runs, external changes, and stale state → rank by actionability and Project impact → let the user inspect source/context → respond, approve, reassign, snooze, or dismiss → update canonical state.

**Acceptance outcome:** users do not need to poll every Session or project manually, and notifications are not generated for every low-value token delta.

### Journey E — Cross-Provider and cross-device continuation

A Project runs on Desktop with a local Agent → Web/Mobile displays the same canonical state → user reviews or sends an authorized instruction → command reaches the online Daemon/Runtime → Session events and artifacts return to the Project. If changing Provider, generate an explicit Context Handoff package rather than pretending native Session migration exists.

**Acceptance outcome:** device and Provider changes do not erase Project continuity or silently cross permission boundaries.

### Journey F — Self-hosted installation and recovery

Install locally or deploy on user-controlled infrastructure → configure storage and secrets → connect chosen Providers → create/import a Project → back up data → upgrade → restore from backup.

**Acceptance outcome:** a user can operate the complete core product without a mandatory vendor account or hosted control plane.

## 10. Open-source and free self-hosted product requirements

### 10.1 Confirmed distribution direction

- The product is open source; source code must be available for inspection, modification, and self-hosting under a clearly published license.
- The complete core product must be usable for free when self-hosted by an individual or team.
- Project management, multi-Agent coordination, local Agent Sessions, core workflows, knowledge/context, integrations framework, review, and essential observability must not be arbitrarily withheld behind a subscription.
- Users can run the system on their own computer, home server, or infrastructure they control.
- Users can bring their own model API keys, local models, Agent Providers, and third-party service accounts.
- A mandatory hosted account or proprietary cloud control plane must not be required for the self-hosted core path.

### 10.2 Cost boundary

Free software does not mean zero operating cost. Users may pay their chosen model Provider for inference, their infrastructure Provider for compute/storage/network, and third parties for external services. These are user-selected costs, not a Project OS subscription requirement.

The product should make these costs visible where possible and avoid silently proxying or marking up model usage.

### 10.3 Optional commercial services

Optional hosted convenience, managed relay, backup, enterprise support, or operations services may be considered later. They must not be used to create artificial feature fragmentation in the free self-hosted core.

No monetization model is frozen by this PRD.

### 10.4 License and distribution gate

The exact license has not been selected. Before the first public code release, choose a recognized open-source license after checking dependencies, plugin boundaries, trademarks, and contribution policy. Do not describe the product as OSI-approved until the selected license and repository contents support that claim.

Self-hosting is incomplete unless the product also provides documented installation, configuration, upgrade, backup, restore, data export, and secret management paths.

## 11. Experience requirements

- Default landing surface is a Project/Portfolio view, not a forced Agent chat.
- Project workspace brings overview, work, participants, Agent activity, knowledge, decisions, deliverables, and activity into one navigable space.
- Session workspace supports multiple sessions, live message stream, tool events, permission requests, terminal/diff where available, and Project context visibility.
- Unified Attention Inbox aggregates actionable work across Projects and Sessions.
- Global search/command palette spans Projects, Tasks, Sessions, decisions, knowledge, artifacts, and connected sources, with permission-aware results.
- Users can work manually, use a direct Agent Session, or delegate to coordinated Agents without switching product identity.
- UI should progressively disclose technical details; internal protocol states should not become mandatory user chores.
- Desktop is the primary local-runtime control surface. Web and Mobile can observe/control only when the relevant host/Runtime is online and paired.

## 12. Non-functional requirements

- **Self-hostability:** installation and operation on user-controlled hardware; no mandatory vendor-hosted dependency for core functionality.
- **Portability:** documented backup, restore, export, migration, and upgrade paths.
- **Security:** least privilege, scoped credentials, explicit pairing, auditable approvals, secure secret storage, no prompt-only authorization.
- **Reliability:** idempotent commands, optimistic concurrency, durable state, event replay/reconciliation, explicit unknown outcomes, and no false success claims.
- **Provider neutrality:** adapters negotiate capabilities; no Provider-specific semantics leak into canonical Project state.
- **Interoperability:** stable APIs, plugin contracts, and external source references.
- **Performance:** stream events without unbounded buffering; UI remains usable with many Projects and Sessions.
- **Privacy:** user controls what stays local versus becomes workspace-shared; telemetry, if any, is transparent and opt-in by default (final policy requires ADR).
- **Accessibility and usability:** keyboard operation, readable dense views, progressive disclosure, responsive layouts.
- **Maintainability:** modular monolith or equivalent clear boundaries before microservices; no premature service explosion.

## 13. Product success measures

Primary north-star hypothesis:

**Accepted Project outcomes per unit of human coordination time and total execution cost.**

Candidate measures:

- human minutes spent coordinating Agents per accepted deliverable;
- time to reconstruct Project Current State after switching window/Provider/device;
- percentage of Sessions that reconnect without duplicate Session creation or silent event loss;
- percentage of delegated Work Packages accepted against criteria;
- rate of duplicate Tasks, duplicate side effects, stale Project states, and failed handoffs;
- time from Agent handoff to human review/acceptance;
- actionable-notification precision and missed-action rate;
- installation-to-first-successful-Project time for self-hosted users;
- percentage of core workflows usable without vendor-hosted services;
- retention of active Projects and repeat weekly use by target users.

Baselines and target thresholds must be measured with design partners; do not invent success numbers.

## 14. Main risks and mitigations

| Risk | Why it matters | Mitigation / proof required |
|---|---|---|
| Feature aggregation without true unification | Users still manually reconcile systems | Shared canonical model, state transitions, context, permissions, and E2E journeys |
| Scope too broad | Delivery and maintenance become unmanageable | Preserve full scope but stage by dependency; reuse mature modules; prove one coherent end-to-end path first |
| Existing competitors already cover subsets | Feature checklist alone is not differentiation | Benchmark full user journeys, not isolated features; identify unmet integration and project-continuity gaps |
| Local Agent Provider fragmentation | Session capabilities differ | Capability negotiation, version pinning, native adapters, explicit degraded modes |
| Self-hosting friction | Free software can still be difficult to install and operate | Local quickstart, packaged Desktop/Daemon, Docker deployment, backup/restore, diagnostics |
| Security and data leakage | Local files, credentials, and external actions are high trust | Least privilege, OS credential store, scoped context, explicit remote pairing, audit |
| Coordination overhead | System can become more bureaucratic than the work | Automate low-risk transitions; expose only meaningful attention; no Task per Run |
| External system drift | Connected systems own their own live facts | Source authority, freshness timestamps, read-after-write, reconciliation |

## 15. Explicit non-goals and boundaries

- Not a clone of Linear, Jira, Paperclip, Paseo, or DeepSeek DSH.
- Not a chat launcher or terminal wrapper as the whole product.
- Not coding-only; coding is a high-value integration scenario.
- Not an Agent company simulator that forces CEO/org-chart metaphors.
- Not an autonomous system that bypasses human authority or executes outside mandate.
- Not a new model provider; users choose their own model/Agent/runtime.
- Not a replacement for GitHub, Notion, Feishu, or other external systems' authoritative records.
- Not a microservice for every feature group.
- Not a paid SaaS requirement disguised as an open-source client.

## 16. Confirmed decisions and unresolved choices

**Confirmed product-owner direction**

- Independent, complete Project OS with Project as the durable center.
- Design lineage is AWRP + our Linear operating model + DeepSeek DSH, synthesized into a new product.
- Human and Agent collaboration, multi-Agent execution, task hierarchy, dispatch, review, knowledge, integrations, visualization, and Desktop/Web/Mobile remain in scope.
- Desktop must create/open local Agent Sessions and continuously receive new messages.
- Direct Session use without a Task and Project/Task-bound execution both remain supported.
- Full product capability scope must not be weakened merely to simplify implementation.
- Product is open source and free to self-host for personal/team use; core features must not be split behind mandatory subscription tiers.
- Users can choose local/remote/cloud execution and bring their own model/provider accounts.
- Product value must come from real unification, not merely placing separate tools in one UI.

**Not frozen / validation required**

- Primary launch segment and first design partners.
- Exact license and contribution governance.
- Exact first coherent release boundary and platform order.
- Detailed information architecture and interaction design.
- Domain schema, API, event contract, and technology stack.
- Local vs self-hosted Hub vs hybrid authority topology.
- Optional hosted/enterprise service model.
- Privacy telemetry policy, data retention defaults, and sync defaults.
- Which integrations/Providers ship first.
