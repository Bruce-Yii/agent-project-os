# 14 — Open Decisions and Decision Log

This document separates product-owner decisions from design proposals and validation tasks. A proposal is not approved merely because it is written here.

## 1. Status definitions

- `CONFIRMED`: explicit product-owner direction.
- `PROPOSED`: recommendation awaiting discussion.
- `VALIDATION REQUIRED`: must be tested against code, external API, user research, licensing, or real workflows.
- `REJECTED`: explicitly out of scope or contradicted by product direction.
- `SUPERSEDED`: historical decision retained with a pointer to its replacement.

## 2. Confirmed product direction

| ID | Decision | Status |
|---|---|---|
| C-001 | Build an independent, complete Project OS product; not just AWRP or Linear configuration | CONFIRMED |
| C-002 | Long-lived Project and project-level visibility are central | CONFIRMED |
| C-003 | Multi-Agent, tasks/subtasks, dispatch, execution, review, knowledge, plugins, external integrations, visualization, Desktop/Mobile/Web are in full scope | CONFIRMED |
| C-004 | Users can connect local Agents and launch/use their sessions inside the product; this is one capability, not the product definition | CONFIRMED |
| C-005 | Learn from DeepSeek DSH but do not bind the product to DSH | CONFIRMED |
| C-006 | Do not weaken full product scope merely to simplify implementation sequencing | CONFIRMED |
| C-007 | Autonomous execution is a sub-capability; the Personal Execution Skill is a supporting dependency/method input, not a separate product | CONFIRMED |
| C-008 | Humans should operate at the Project level, not be forced to manage every Agent chat manually | CONFIRMED |
| C-009 | Desktop must be able to create/open Sessions with local Agents and continuously receive newly arriving messages | CONFIRMED (minimum product requirement) |
| C-010 | Product is open source: source code is public and inspectable/modifiable under a published open-source license | CONFIRMED; exact license not selected |
| C-011 | Complete core product is free to self-host for personal/team use; no mandatory subscription or artificial feature wall for core Project OS capabilities | CONFIRMED; optional hosted services remain open |
| C-012 | Product differentiation must come from a unified Project-centered domain/lifecycle/context/permission/attention model, not merely aggregating separate tool UIs | CONFIRMED product principle; market advantage requires validation |
| C-013 | Product design lineage is AWRP + our Linear operating model + DeepSeek DSH, synthesized into a new product rather than a direct port | CONFIRMED |
| C-014 | Users can bring their own model/provider credentials and choose local, remote, or cloud runtimes; external inference/hosting/service costs are user-selected | CONFIRMED direction; detailed cost display is proposed |

## 3. Proposed architecture decisions

| ID | Topic | Current proposal | Status |
|---|---|---|---|
| P-001 | Task ownership | One canonical owning Project; cross-project links/dependencies are explicit | PROPOSED |
| P-002 | Human vs Agent assignment | Separate accountable owner, executor, reviewer, collaborator | PROPOSED |
| P-003 | Assignment granularity | One bounded executor responsibility per Assignment; parallelism uses multiple Assignments | PROPOSED |
| P-004 | Execution identity | Task, Assignment, Run, Session are separate entities | PROPOSED (strongly grounded in AWRP) |
| P-005 | Domain write authority | Validated domain command layer is sole canonical writer; connectors transport effects | PROPOSED |
| P-006 | Event delivery | Transactional Outbox + idempotent Inbox/reconciliation | PROPOSED |
| P-007 | Runtime | Local Daemon plus remote/cloud Runtime Nodes | PROPOSED |
| P-008 | Deployment | Modular boundaries first; avoid premature microservices | PROPOSED |
| P-009 | Personal Execution Skill | Versioned method profile used by autonomy sub-capability after user validation | PROPOSED implementation detail; dependency confirmed |
| P-010 | Local Session boundary | Separate Project OS Session identity, ProviderSessionRef, RuntimeProcess, SessionConnection, and SessionBinding | PROPOSED |
| P-011 | Local Session event durability | Persist durable message/turn/permission boundaries; stream token/terminal deltas separately; reconcile Provider history after reconnect | PROPOSED |
| P-012 | Multi-client Session control | Multiple observers with one active controller lease by default; serialized commands | PROPOSED |
| P-013 | Local Session data policy | Provider transcript remains Provider-owned; Project OS stores metadata and user-selected sync/retention projections | PROPOSED; privacy/storage validation required |
| P-014 | Durable workflow runtime | DBOS is the primary TypeScript/PostgreSQL candidate behind a `DurableWorkflowPort`; Temporal is the distributed fallback; Hatchet is not the default while replay/stream issues remain open | PROPOSED; G3 must validate the exact stable DBOS release and recovery semantics |
| P-015 | Local Agent Daemon | Evaluate Paseo's published server subpaths behind our `LocalRuntimeNode` contract; use ACP for compatible Providers and native adapters where richer | PROPOSED; G3 real-Provider spike required; Paseo's plugin runtime is not our marketplace security model |
| P-016 | Connector reuse | Selectively vendor/adapt Activepieces community pieces; use MCP as a tool interoperability protocol | PROPOSED; per-piece license/dependency audit and Service Connector adapter required |
| P-017 | Offline client sync | PowerSync Open Edition is the leading conditional candidate; client writes must return through the Project OS backend API | PROPOSED; G3 must validate Desktop/Mobile, authorization, checkpoint, migration, and conflict behavior |
| P-018 | Canonical Memory | Project OS owns facts, decisions, provenance, freshness, and supersession; third-party retrieval may only propose candidates | PROPOSED; Mem0 is not canonical due mutable-fact/stale-retrieval risk |
| P-019 | Skill interchange | Adopt the Agent Skills `SKILL.md` format for import/export; Project OS owns extraction, evaluation, approval, version, scope, and rollback | PROPOSED; optional `allowed-tools` metadata is not an authorization boundary |
| P-020 | Authorization and plugin trust | Build the Project OS capability/approval model; require explicit scopes and isolation for untrusted plugins | PROPOSED; defer OPA/OpenFGA until relationship-policy complexity justifies them |
| P-021 | Data and observability | PostgreSQL canonical store, SQLite local store/cache, object storage for large artifacts, OpenTelemetry-compatible instrumentation | PROPOSED; deployment topology remains open |
| P-022 | Product UI and desktop shell | Build the Project-first UX; reuse established terminal/editor/diff components; choose Tauri/Electron only after runtime/OS constraints are clear | PROPOSED; G3 shell ADR required |

## 4. Open product questions

- Which user segment has the strongest repeated need: individual multi-project operators, small teams, or both at launch?
- What are the first three product journeys that must feel substantially better than existing tools?
- How much team collaboration (roles, permissions, comments, shared workspaces) is needed in the first coherent release?
- What should a Project's default landing view show without overwhelming the user?
- Which actions belong in the global Command Palette, and which require a contextual confirmation step?
- Which information should be visible at portfolio level versus Project level?
- What is the product's strategy for Projects imported from Linear/Jira/Notion?

## 5. Open domain questions

- Can a Task have multiple Project owners, or one owner plus explicit links?
- Can a Session be reused across Tasks? If yes, how are context boundaries enforced?
- Are Discussions first-class domain entities or a unified thread abstraction over comments/external sources?
- Which relationships are hierarchical, and which are graph edges?
- What is the minimum schema for Project Current State and freshness?
- How should Team membership and per-Project participation interact?

## 6. Open execution questions

- Which Providers expose reliable create/resume/interruption APIs?
- Which local Provider is the first real-machine end-to-end Session integration target?
- What is the canonical storage boundary for Provider transcript vs Project OS Session metadata vs local Daemon event spool?
- How are Provider event gaps detected and reconciled when event streams are volatile?
- Should one active controller lease be required when Desktop/Web/Mobile attach to the same Session?
- How are direct unbound Sessions later associated with a Project/Task without silently changing context or permissions?
- What is the exact Context Handoff package when moving work from one Provider to another, and which parts of transcript/artifact history are carried?
- Which sources must be visible in the Context Pack inspector, and how are stale/conflicting instructions resolved?
- What should the canonical capability matrix include?
- Which runtimes can be managed by the first local Daemon?
- How should provider-native sessions map to Run and Assignment when one provider session is reused?
- Which execution isolation defaults work for non-code tasks?
- What is the policy for an unknown outcome after an external side effect?

## 7. Open platform questions

- What is the canonical authority topology for local-first, self-hosted Hub, and hybrid deployments?
- What telemetry/privacy default and opt-in policy should apply to a self-hosted open-source product?
- Which event/workflow engine is appropriate, and what is the operational cost?
- How should offline clients submit commands and resolve conflicts?
- What secret store works across Desktop, Mobile, Web, and remote runtimes?
- Which plugin sandbox and signature model is required?
- What retention, backup, export, and deletion guarantees are needed?

## 8. Decision record template

Use [ADR Template](templates/ADR.md). Every architecture-changing decision should include context, alternatives, rationale, consequences, status, evidence, and affected documents.
