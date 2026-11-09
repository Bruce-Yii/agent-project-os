# 11 — Platform, Security, Synchronization, and Reliability

## 1. Architectural planes

- **Experience Plane:** Desktop, Mobile, Web, CLI, public API.
- **Control Plane:** Workspace, Project, Task Graph, participants, policy, coordination, review, knowledge metadata.
- **Execution Plane:** local/remote/cloud Daemons, Agent Providers, workspaces, Sessions, tools.
- **Integration Plane:** plugins, external connectors, triggers, knowledge providers.
- **Data/Operations Plane:** primary store, event history, artifact storage, search, audit, metrics, backups.

These are responsibility boundaries, not a commitment to deploy separate microservices.

## 2. Deployment approach (not frozen)

Candidate starting point: a modular application with strict internal domain boundaries and well-defined ports/adapters. Avoid premature microservice distribution. Split processes when independent scaling, security isolation, or platform constraints justify it.

Deployment modes to evaluate:

- cloud-hosted Workspace authority;
- local/self-hosted Hub authority;
- hybrid control plane with local Runtime Nodes;
- remote/cloud execution workers.

There must be one canonical authority for each Workspace's Project/Task state. Offline clients can cache and queue commands, but cannot claim a command was accepted before the authority confirms it.

## 3. Persistence and event architecture

Candidate responsibilities:

- transactional primary store for canonical domain entities;
- append-only event/audit history for important transitions;
- materialized projections for fast Project/Task views;
- Outbox for external effects;
- Inbox/idempotency records for external events;
- object/artifact storage for large files and evidence;
- search index for full-text/semantic retrieval.

AWRP's create-only event lineage and DSH's transactional Engine/Outbox offer complementary lessons. Do not assume the new product must use GitHub files as the primary database. Select a store that supports transactions, migrations, querying, and recovery.

## 4. Command and event rules

A canonical command should include:

- actor and identity type;
- target object and workspace scope;
- requested action;
- expected object version;
- idempotency key;
- authorization context;
- external effects requested.

A domain event should include:

- event ID and type;
- aggregate/object ID;
- sequence/version;
- actor, source, timestamp;
- causation and correlation IDs;
- payload schema version;
- provenance and relevant artifact references.

Canonical event semantics must be created by validated domain code, not hand-authored by a Coordinator or connector.

## 5. Transactional Outbox and Inbox

- write domain state and pending external effect in one transaction;
- dispatch the effect after commit;
- record attempt, receipt, result, and retry schedule;
- use idempotency keys at the destination when supported;
- reconcile unknown outcomes before retry;
- deduplicate inbound events by provider/source identity;
- make webhook replay safe.

Do not claim exactly-once delivery across external systems. Design for at-least-once delivery plus idempotency and reconciliation.

## 6. Concurrency and ownership

- optimistic concurrency / expected version checks for canonical state;
- leases or claims for single-writer resources;
- fencing tokens/generations so stale workers cannot write after ownership changes;
- isolated execution workspaces for parallel Agents;
- no force push or destructive repair to hide a conflict;
- explicit conflict resolution and audit.

## 7. Authorization and secrets

- authorization is enforced in the server/daemon boundary, not only in prompts;
- every action checks actor, resource, operation, scope, and policy version;
- Agent and plugin permissions are narrower than human owner permissions by default;
- secret vault or OS credential store; no raw secrets in prompts, event logs, search indexes, or artifacts;
- provider credentials are separated by user/workspace and least-privilege scopes;
- high-risk actions require explicit human approval bound to target/version.

## 8. Sync and offline behavior

- server-confirmed canonical state vs local draft/optimistic UI state must be distinguishable;
- clients sync by cursor/version and recover missed events after reconnect;
- conflict resolution is explicit for concurrent edits;
- mobile push carries a pointer to canonical state, not an alternative state;
- local Daemon offline state is visible;
- local Agent Session control binds to loopback/OS IPC by default; remote access requires explicit pairing and authenticated encrypted transport;
- Provider credentials stay in OS credential storage or an approved vault and are never synced into Project knowledge, search indexes, or general logs;
- Session event streaming uses bounded buffers/backpressure; reconnect replays a local spool and reconciles Provider history where possible;
- a Provider stream that cannot backfill missed events must expose an explicit gap and last-verified timestamp;
- client connection, Provider Session, and RuntimeProcess state are separate; UI closure must not imply process termination;
- per-Session transcript/metadata retention and sync policy is explicit; local-only data must not silently become workspace-shared;
- offline queued commands are revalidated against current policy and object version before acceptance.

## 9. Observability

Track:

- command/event trace across Client → Control Plane → Runtime → Provider → Connector;
- Run duration, failure, retry, recovery, and acceptance latency;
- Agent/Provider/Runtime health;
- cost and usage by Workspace/Project/Task/Run;
- plugin error rate and webhook lag;
- permission denials and external side effects;
- stale projections and sync lag.

Logs must be useful for debugging without leaking secrets or unnecessary user content.

## 10. Technology candidates (not decisions)

| Concern | Candidate families | Decision criteria |
|---|---|---|
| Frontend | React / TypeScript | shared UI, state model, accessibility |
| Desktop | Tauri / Electron | local process control, packaging, updates, OS permissions |
| Mobile | React Native / Expo or native | background/notification/remote control constraints |
| Backend | TypeScript/Node or another suitable runtime | domain transaction, plugin SDK, operations |
| Primary store | PostgreSQL; SQLite for local cache/Hub | transactions, migrations, local deployment |
| Event transport | WebSocket / SSE / message broker | realtime, backpressure, reconnect |
| Workflow engine | Temporal / Conductor / custom bounded engine / LangGraph | durability, human wait, retries, vendor/ops cost |
| Artifact store | object storage + immutable references | large files, diff, evidence, retention |
| Search | full-text + vector + structured filters | provenance, ACL, freshness |
| Isolation | Git worktree, container, OS sandbox, remote VM | security, reproducibility, cost |

No framework or database is frozen by this document.

## 11. Acceptance criteria

- Canonical writes are transactional and version-checked.
- External effects are outboxed, idempotent, and reconcilable.
- Offline client commands cannot silently overwrite canonical state.
- Stale workers cannot mutate state after losing ownership.
- Secrets are never indexed or written to general logs.
- Event/Run traces can reconstruct why a state transition occurred.
- A full backup can be restored and verified.


## 12. Local Agent Session threat and failure model

The Local Agent Session subsystem is a high-trust boundary because it can expose local files, terminals, credentials, and shell execution. It must:

- avoid unauthenticated network listeners and unsafe default LAN exposure;
- bind remote control to a paired device identity and revocable session;
- show effective working directory, additional directories, sandbox mode, network/tool grants, and Provider permission mode;
- route tool permission requests through the same Policy/Approval system used by remote Agents;
- avoid leaking one Project/Task Context Pack into a Session with a different security scope;
- apply command IDs/idempotency and reconcile uncertain send outcomes before retry;
- separate structured event stream from terminal byte stream and apply backpressure;
- mark unrecoverable event gaps, process crashes, host sleep/offline, and unknown command outcomes truthfully;
- provide emergency stop for a Provider process and revoke remote pairing independently.

Detailed behavior: [18 — Local Agent Session Subsystem](18-local-agent-session-subsystem.md).



## 13. Open-source and free self-hosted operating requirements

The distribution requirement is part of the product architecture, not a release-page statement.

- The core application must be deployable on user-controlled hardware without a mandatory vendor-hosted control plane.
- Support a documented local/personal install and a documented server/Docker-style self-hosted install; exact supported topology is validated before implementation freeze.
- The self-hosted core must include Project/Task management, Agent registry and Session workbench, multi-Agent coordination, knowledge/context, core workflows, review/governance, essential integrations framework, and essential observability. Do not move core functionality behind an account or subscription wall.
- Users bring their own model/Agent credentials and external service accounts. Model inference, hardware, hosting, storage, bandwidth, and third-party API costs are external user-selected costs.
- Secrets stay in OS credential storage or an approved server-side secret store. A self-hosted deployment must not require uploading Provider credentials to a vendor service.
- Provide documented configuration, migration, backup, restore, update, rollback, and export paths before calling self-hosting production-ready.
- Optional relay or hosted convenience services may exist, but core local/self-hosted operation must remain usable without them. Any relay must have a clear trust, encryption, retention, and revocation model.
- Telemetry/privacy defaults require an ADR; proposed default is no content telemetry and explicit opt-in for anonymous diagnostics.
- Select and publish the exact open-source license before first public code release. Audit dependency and plugin licenses; do not describe source-available terms as open source.

**Self-hosted acceptance gate:** a new user can install from documented instructions, create a Project, connect one supported Agent Provider, run and review one Work Package, back up the data, restore it on a clean environment, and continue without a mandatory vendor account or paid Project OS plan.
