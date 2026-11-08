# 01 — Complete Functional Catalog

**Status:** Candidate capability inventory v0.2. All 32 functional groups are retained as full-product scope; this is not a frozen implementation plan. F12/F16 now specify the local Agent Session capability in detail.  
**Source key:** `A` AWRP; `U` our Linear + Notion operating model; `L` Linear product; `D` DeepSeek DSH; `P` Paperclip; `S` Paseo; `O` other products / workflow infrastructure; `N` new product design synthesis.

## A. Workspace, Project, and Work Management

### F01 — Workspace and Organization

**Purpose:** establish the access, ownership, and collaboration boundary for personal and team use.

Capabilities:
- personal workspace and team workspace;
- multiple organizations/workspaces and workspace switching;
- member invitations, roles, teams, groups, and membership lifecycle;
- project-level membership and visibility overrides;
- workspace settings, policies, billing/usage boundary (commercial details TBD);
- shared resources and workspace-level Agent/Plugin registry.

**Sources:** `L/P/N`. **Dependencies:** identity, authorization, Project.

### F02 — Project Portfolio and Initiative Management

Capabilities:
- initiatives or portfolio-level goals grouping multiple Projects;
- portfolio overview, strategic priority, ownership, status, target dates;
- cross-project dependencies and shared milestones;
- resource/capacity view across Projects, including human availability, Agent concurrency, Runtime capacity, and budget constraints;
- calendar and scheduling views for milestones, deadlines, planned work, and external events;
- portfolio-level reports and health indicators.

**Sources:** `L/U/P/N`. **Dependencies:** Workspace, Project, Goal, Task aggregation.

### F03 — Project Lifecycle

Capabilities:
- create, edit, duplicate, pause, resume, archive, restore, and close Projects;
- project identity stable across sessions and devices;
- project lead, contributors, labels, target dates, status, and summary;
- liveness/current-state rules to distinguish active work from dormant importance;
- project templates and guided project initialization;
- bootstrap bundles may preconfigure goals/milestones, task structures, views, repositories/resources, Agent profiles, Skills, workflows, and permission defaults; every inherited permission is reviewed rather than silently granted.

**Sources:** `A/U/L/N`. **Dependencies:** Workspace, Project state model.

### F04 — Project Structure

Capabilities:
- Project, Subproject, Goal, Milestone, phase, and project area;
- project documents, external resources, repositories, environments, and linked services;
- multiple workstreams within one Project;
- project-level current state, decisions, and next actions;
- explicit relation between a Project and one or more repositories or external systems.

**Sources:** `U/L/N`. **Dependencies:** domain model, resources, task graph.

### F05 — Task and Work Package Management

Capabilities:
- create/edit/archive Tasks and Subtasks;
- task description, scope, non-scope, constraints, acceptance criteria, priority, estimate, labels, due date;
- responsible human/team, execution participant, reviewer, and observers;
- templates, bulk operations, search, filtering, saved views;
- task comments, attachments, external links, and activity history;
- task creation should represent a real bounded work package, not every Agent run.

**Sources:** `A/U/L/P/N`. **Dependencies:** Project, Participant, state machine.

### F06 — Task Relationships and Dependency Graph

Capabilities:
- parent/child hierarchy;
- blocking/blocked-by, related, duplicate, supersedes, and cross-project dependency;
- DAG validation and cycle detection;
- ready-work calculation and dependency-aware scheduling;
- dependency visualization, critical path, and impact analysis.

**Sources:** `U/L/N`. **Dependencies:** Task identity and lifecycle.

### F07 — Task Lifecycle and Current State

Capabilities:
- lifecycle states with explicit semantics;
- waiting for external dependency vs internally blocked vs awaiting review;
- state transition history and actor attribution;
- project-level Current State snapshot: goal, phase, active work, waiting, blockers, review, next action, last verified time;
- resume/recovery from Project → Current State → active Work Package → live external truth;
- stale Active/Review detection and dormant state handling.

**Sources:** `A/U/L/D/N`. **Dependencies:** event model, task graph, external truth.

### F08 — Intake, Triage, and Deduplication

Capabilities:
- manual inbox, external-event intake, requests, bugs, research findings;
- classify, enrich, prioritize, accept, decline, snooze, merge duplicates;
- candidate Work Package pool before durable Task creation;
- duplicate detection against active and historical Tasks;
- promote research to execution only when there is a real work boundary;
- intake policies per Source/connector.

**Sources:** `U/L/D/N`. **Dependencies:** Source/Trigger, Task, policy, search.

## B. Human–Agent Collaboration and Execution

### F09 — Human and Agent Participants

Capabilities:
- human users, teams, Agents, service identities, and runtime nodes as distinct participant types;
- owner/accountable person separate from Agent executor;
- multiple collaborators, reviewers, watchers, and observers;
- membership/permission scope and project participation history;
- Agent can participate in multiple Projects without becoming a fixed project member by default.

**Sources:** `U/L/P/N`. **Dependencies:** Workspace, Agent Registry, authorization.

### F10 — Collaboration and Communication

Capabilities:
- Project discussions and Task discussions;
- comments, mentions, replies, attachments, and threaded conversations;
- decisions and discussion outcomes linked to affected Tasks;
- Agent-to-human and Agent-to-Agent messages with provenance;
- activity timeline and notification preferences;
- conversation context can be attached to a Task without making every message a new Task.

**Sources:** `L/P/D/N`. **Dependencies:** Project/Task, event log, participants.

### F11 — Agent Registry and Capability Management

Capabilities:
- register local, remote, cloud, and custom Agents;
- provider, model, version, runtime, capability, cost profile, health, availability;
- capability negotiation: session create/attach/resume/fork, message send/steer, event subscription/replay, tool calls, permissions, interrupt/cancel, artifacts, usage, etc.;
- discover locally installed Agents and their versions; identify existing Provider sessions/processes where supported;
- distinguish native protocol, SDK, structured CLI stream, and opaque terminal fallback;
- user-defined Agent profiles, roles, instructions, model defaults, and workspace preferences;
- Agent enable/disable, authentication, connection health, compatibility and diagnostics;
- capability matrix with `native`, `emulated`, `unsupported`, and `unknown` support levels.

**Sources:** `A/S/P/N`. **Dependencies:** Plugin platform, Runtime Manager, permissions.

### F12 — Agent Session Workbench (including Local Agent Sessions)

**Product requirement confirmed:** the Desktop client must be able to create/open a Session with a local Agent and continuously receive newly arriving messages. This is a core Desktop capability within the wider Project OS, not a separate product identity.

Capabilities:
- discover local Agent Providers, create Sessions, attach to existing/running Sessions, and resume by Provider-native identity where supported;
- direct standalone Session mode that does not require a Task; optional explicit association to Project, Task, Assignment, and Run;
- continuous bidirectional interaction: send message, stream message deltas, steer an active turn, queue follow-up, interrupt, and respond to permission prompts where supported;
- stream structured Agent messages, turn lifecycle, tool calls/results, approval requests, status, artifacts, terminal output, diff, and usage;
- multiple Session tabs/panes, pinning, unread state, search, filters, rename, fork/branch, archive, and history;
- cross-Provider Context Handoff: package current goal, constraints, decisions, relevant transcript summary, workspace/artifact references, and open questions for a new Provider Session; distinguish this from native Session migration;
- reconnect to an existing Session after Desktop UI closure; replay locally spooled events and reconcile Provider history; mark unrecoverable event gaps explicitly;
- multi-client observation/control from Desktop, Web, and paired Mobile through an online Daemon/Runtime; show host offline truth;
- inspect the exact Project/Task Context Pack, working directory, selected resources, Skill versions, and permissions supplied at launch;
- distinguish native resume, process reattach, restart-with-context, and opaque terminal-only integration; never mislabel one as another;
- session transcript/metadata retention and sync controls, local-only vs shared visibility, and explicit deletion/export policy.

**Sources:** `A/S/N` plus official Codex App Server, Claude Agent SDK, OpenCode Server, and Pi RPC references. **Dependencies:** Agent Registry, Local Daemon, Provider Adapters, Event Ingest/Replay, Sync, Policy, Context Assembly. Detailed contract: [Local Agent Session Subsystem](18-local-agent-session-subsystem.md).

### F13 — Agent Delegation and Assignment

Capabilities:
- user-selected Agent assignment;
- Coordinator-selected Agent assignment;
- human remains accountable while Agent executes;
- reassign, handoff, retry, replace, or terminate an assignment;
- explicit assignment scope, permissions, and acceptance criteria;
- multiple independent assignments for parallel work.

**Sources:** `A/U/L/P/D/N`. **Dependencies:** Task, Agent, authorization, Scheduler.

### F14 — Multi-Agent Coordination

Capabilities:
- Coordinator and Worker roles without forcing a fixed org chart;
- task decomposition, parallel fan-out, serial dependency, aggregation;
- specialist Agents and cross-review;
- context handoff, delegation, and worker replacement;
- conflict detection, workspace isolation, merge/reconciliation;
- human intervention, override, and re-planning.

**Sources:** `A/U/D/P/S/O/N`. **Dependencies:** Task Graph, Assignment, Runtime, Review.

### F15 — Run, Event, and Execution Lifecycle

Capabilities:
- durable Assignment and Run records;
- Run attempts, state, idempotency, start/end, executor identity, and trace;
- ACK, checkpoint, input request, handoff, failure, interruption, cancel, reconcile;
- append-only execution events and replayable state projections;
- artifact references, verification, side-effect record, and remaining risks;
- new Run for a genuine revision; never silently execute the same Run twice.

**Sources:** `A/D/P/N`. **Dependencies:** Event Store, Runtime, Review.

### F16 — Execution Environments and Runtime Nodes

Capabilities:
- local Daemon as a user-machine background service, remote host, cloud worker, and sandboxed execution node;
- local Provider process supervision, attach/reconnect, session discovery, machine startup, shutdown, sleep/wake and crash recovery;
- workspace, local checkout, worktree, container, terminal/PTY, browser, preview;
- per-Run isolation and concurrency control; safe handling of dirty workspaces and multiple Agent writers;
- runtime discovery, version/capability health, resource usage, diagnostics, and graceful shutdown/recovery;
- secure device pairing and remote client connection; loopback/OS IPC by default, no unauthenticated LAN listener;
- independent client connections/subscriptions, event cursors, local spool and reconnect reconciliation;
- host online/offline truth and explicit limitations when the local computer is asleep, shut down, or disconnected.

**Sources:** `A/S/P/O/N`. **Dependencies:** Agent Provider, Runtime Manager, security.

## C. Automation, Intelligence, Knowledge, and Extensibility

### F17 — Workflow and Event Automation

Capabilities:
- schedule/time triggers;
- GitHub, Notion, Feishu, calendar, webhook, and application event triggers;
- conditional routing, event correlation, subscriptions, and deduplication;
- workflow templates, versioning, execution history, retries, and pause/resume;
- action execution through existing permission and approval controls.

**Sources:** `D/L/P/O/N`. **Dependencies:** Trigger, Policy, Outbox, Runtime.

### F18 — Intelligent Planning and Assistance

Capabilities:
- understand user intent and map it to an existing Project;
- create or update goals, tasks, dependencies, and acceptance criteria;
- recommend task split, Agent choice, priority, risks, and next actions;
- summarize Project health and changes;
- propose plans for human confirmation when scope or authority is ambiguous.

**Sources:** `L/P/D/N`. **Dependencies:** Project Context, Task Graph, Policy.

### F19 — Autonomous Execution (Sub-capability)

Capabilities:
- continue authorized work after a completed step or external trigger;
- select eligible next work and route it to an Agent/Runtime;
- handle bounded retries and recoverable failures;
- stop and request attention at an authority, safety, or unresolved product decision boundary;
- report meaningful progress, deliverables, blockers, and required decisions.

**Critical dependency:** the feature can use a user-specific **Personal Execution Skill** distilled from that user's established and validated Agent execution method. The Skill describes how the user prefers work to be prepared, delegated, checked, and handed off. It is a supporting execution method, not an independent product, not a second state engine, and never a source of permission. Project/Task/Assignment/Run, Policy, Runtime, and Review remain authoritative.

**Sources:** `D/U/N`. **Dependencies:** workflow, scheduler, Skill, policy, runtime, review.

### F20 — Project Knowledge and Resources

Capabilities:
- project documents, research, links, files, repositories, references, and source registry;
- search and retrieval across authorized resources;
- document version and provenance;
- link decisions, tasks, deliverables, and discussions to source material;
- external knowledge connectors.

**Sources:** `U/L/N`. **Dependencies:** Resource, Connector, permissions, indexing.

### F21 — Project Memory and Context Assembly

Capabilities:
- workspace/project/task/session context layers;
- confirmed decisions, methods, failures, and lessons;
- current state and historical state reconstruction;
- context packs assembled for a Task or Run;
- freshness, source authority, confidence, supersession, and access filtering;
- inspectable Context Pack before Agent launch: show included sources, versions, scope, permission boundary, and exclusions; allow the user to add/remove sources;
- context budget and relevance diagnostics; detect stale/conflicting instructions and surface source precedence;
- memory extraction gate; do not permanently store every Agent message.

**Sources:** `A/U/D/N`. **Dependencies:** Knowledge, events, Project State, provenance.

### F22 — Skills, Templates, and Reusable Methods

Capabilities:
- install, author, version, test, enable, disable, and share Skills;
- Agent profiles, task templates, Project templates, and workflow templates;
- scope-aware Skill applicability and provider compatibility;
- extract candidate Skills from repeated user workflows, then validate/approve them;
- maintain provenance and version of user-specific execution Skills;
- reusable Project bootstrap bundles combining template, task tree, views, Agent profiles, Skills, integrations, and workflow presets.

**Scope note:** Skills are reusable methods. They do not own canonical Project/Task/Run state, bypass permissions, or replace orchestration.

**Sources:** `P/S/D/N`. **Dependencies:** Agent/Workflow APIs, knowledge, permissions.

### F23 — Plugin and Connector Ecosystem

Capabilities:
- Agent Provider plugins;
- Runtime Provider plugins;
- Service Connector plugins;
- Trigger/Source plugins;
- Knowledge Provider plugins;
- SDK, manifest, capability schema, permission grants, versioning, diagnostics, marketplace/discovery;
- integration health, sync cursor, rate limit, and error visibility.

**Sources:** `S/P/L/D/N`. **Dependencies:** Plugin Host, authorization, API/event contracts.

## D. Delivery, Governance, Clients, and Platform

### F24 — Deliverables and Artifacts

Capabilities:
- code commits, branches, PRs, patches, documents, files, reports, demos, screenshots, logs, and external links;
- immutable references where possible (commit SHA, document version, content hash);
- artifact lineage to Task, Assignment, Run, Session, and Agent;
- preview, download, compare, and external-source refresh;
- no large transient logs/binaries in the canonical event log.

**Sources:** `A/L/P/S/N`. **Dependencies:** Artifact Store, connectors, execution.

### F25 — Review and Acceptance

Capabilities:
- acceptance criteria and evidence checklist;
- automated checks and independent Agent review;
- human review and final acceptance;
- accept, request changes, reject, defer, or require more evidence;
- revision creates a new Run while preserving Task identity and history;
- verify actual GitHub/CI/external state rather than trusting a report.

**Sources:** `A/U/L/P/N`. **Dependencies:** Artifact, Evidence, Policy, external truth.

### F26 — Permission, Risk, and Approval Governance

Capabilities:
- Workspace/Project/Task/Agent/Plugin permission scopes;
- actor-action-resource authorization;
- risk tiers for read, local change, private write, public write, merge, destructive action;
- scoped approval bound to exact action and target artifact/commit;
- credential vault, least privilege, revocation, audit;
- emergency pause and human override.

**Sources:** `A/D/P/N`. **Dependencies:** identity, Policy Engine, event log.

### F27 — Project Visualization

Capabilities:
- portfolio dashboard and Project dashboard;
- list, board, timeline, calendar, milestone, task tree, dependency graph;
- workload/capacity views for human participants, Agent pools, and Runtime Nodes;
- human/Agent assignment and execution views;
- run/session timeline, artifact/diff review, risk and blocker map;
- project health and Current State visualization;
- user-configurable views and filters.

**Sources:** `L/P/S/N`. **Dependencies:** query model, state projections, client.

### F28 — Multi-platform Clients

Capabilities:
- Desktop: full Project OS and local runtime management;
- Mobile: project overview, task review, approvals, notifications, Agent interaction, remote control;
- Web: cross-device workspace, team collaboration, remote project management;
- shared domain/API and permission model;
- device pairing, offline cache, realtime sync, push notifications.

**Sources:** `S/P/N`. **Dependencies:** API, Sync, Runtime Node channel.

### F29 — Attention Center and Notifications

Capabilities:
- actionable approvals, blockers, questions, review requests, and significant project changes;
- prioritize by urgency, risk, and user responsibility;
- group repetitive/low-value events;
- Session-specific unread messages, Agent questions, permission prompts, completion/failure notices, and disconnected-host alerts;
- unified actionable inbox combining Project decisions, Agent replies, review requests, approvals, blockers, and external events; jump directly to the owning Session/Task/Project;
- snooze, delegate, resolve, and trace attention items;
- configurable per-Project/Agent/Session notification policies and quiet hours;
- avoid noisy progress spam and approval fatigue.

**Sources:** `A/U/D/L/N`. **Dependencies:** event classification, user preferences, Policy.

### F30 — Observability, Cost, and Operations

Capabilities:
- Agent/Provider/Runtime/Daemon health and installed-version diagnostics;
- Session/Run traces, tool-call logs, event-stream lag/gaps, reconnect counts, failures, retries, and latency;
- model/provider usage and cost attribution by Project/Task/Run/Session;
- budget and concurrency limits;
- operational incidents, diagnostics, and audit views;
- system health and plugin health.

**Sources:** `P/D/O/N`. **Dependencies:** event/trace model, runtime metrics.

### F31 — Data Portability and Lifecycle

Capabilities:
- export/import workspace, Projects, Tasks, knowledge, Sessions metadata, and artifact references;
- guided migration from Linear/Jira/Notion/GitHub and other systems with preview, field mapping, relation mapping, duplicate detection, provenance, and rollback plan;
- backup/restore and migration tools;
- external ID mapping and conflict resolution;
- archive and retention policy;
- API and data ownership guarantees;
- preserve history when switching Agent providers or external project tools.

**Sources:** `A/U/N`. **Dependencies:** schema versioning, storage, connectors.


### F32 — Universal Search and Command Palette

Capabilities:
- permission-aware global search across Projects, Goals, Tasks, Sessions, messages, Decisions, Knowledge, Resources, Artifacts, Agents, and connected external references;
- combine exact text, semantic retrieval, structured filters, recency, Project scope, Provider, and lifecycle state;
- jump from a search result to its owning Project/Task/Session and preserve navigation context;
- keyboard-first command palette for common actions: switch Project, create Task, open Agent Session, search, attach Resource, review approval, and run an authorized command;
- recent items, saved searches, and contextual suggestions without bypassing permissions;
- distinguish canonical Project OS records from indexed external projections and stale search results.

**Sources:** `L/U/S/N`. **Dependencies:** identity/permissions, search index, object navigation, command authorization.

## Functional completeness rule

A module is not considered designed merely because its name appears here. Before implementation, its specification must include: user scenario, primary objects, commands/events, permissions, states, external truth, failure cases, acceptance criteria, and dependencies. See [Module Contract Template](templates/module-contract.md).

