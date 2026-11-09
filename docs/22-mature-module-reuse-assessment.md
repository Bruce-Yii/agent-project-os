# 22 — G2 Mature-Module Reuse Assessment

**Status:** G2 COMPLETE as a reuse-design assessment on the existing PR #1 branch. G3 validation spikes remain; no dependency has been added to product code and no technology stack is frozen.  
**Snapshot:** 2026-11-10  
**Scope:** reusable modules and protocols for the complete Agent Project OS, not wholesale product adoption.

## 1. Executive decision

The product should **reuse mature execution, protocol, connector, synchronization, and observability components wherever their boundaries fit**. It should not outsource the canonical Project OS domain, authority model, review lifecycle, or product experience to another platform.

The highest-value reuse path is:

1. **Local Agent execution:** evaluate Paseo's published Daemon packages behind our own Local Runtime Node contract; use ACP where a Provider supports it and native adapters where the native interface is richer.
2. **Durable business orchestration:** use DBOS as the primary TypeScript/PostgreSQL candidate behind a `DurableWorkflowPort`; keep Project OS Task/Assignment/Run state canonical in our own database.
3. **Connectors:** selectively vendor/adapt Activepieces community pieces into our Service Connector contract; use MCP as a tool interoperability protocol, not as the permission system.
4. **Offline client data:** keep PowerSync Open Edition as the leading conditional candidate; its Postgres-to-SQLite model fits the multi-device direction, but the current service version and checkpoint behavior must pass a narrow G3 test.
5. **Memory and Skills:** own the canonical fact/decision/provenance model; adopt the Agent Skills `SKILL.md` format for portability; do not use a third-party memory engine as the authority for current facts.

**Build ourselves:** Project/Task/Assignment/Run/Review/Approval/Current State semantics, authorization and approval policy, Context Pack assembly, Memory/Decision lifecycle, Skill promotion/review, the Project-first UX, and the integration glue that preserves these boundaries.

This is a reuse assessment, not a product-scope reduction. All 32 functional groups remain in scope. A conditional adoption is a real decision with an explicit validation gate, not an excuse to start building a replacement before checking the candidate.

## 2. Classification rules

| Classification | Meaning in this assessment |
|---|---|
| **Direct reuse** | Adopt a stable protocol, SDK, or isolated component with limited configuration. |
| **Adapt / wrap** | Reuse a mature implementation behind a Project OS-owned adapter and contract. |
| **Reference design** | Preserve the design lesson; implement our own boundary because the source is experimental, coupled, or mismatched. |
| **Build ourselves** | Own product-specific semantics where an external module would become the wrong authority or add more complexity than it removes. |

A package being MIT/Apache-2.0 is necessary for reuse, but not sufficient. We also require a compatible runtime, self-hosting path, explicit data/permission boundaries, acceptable maintenance behavior, and a credible exit path.

## 3. Reuse matrix

| Subsystem | Candidate / snapshot | G2 classification | Decision and boundary |
|---|---|---|---|
| Project domain, Task graph, Assignment, Run, Review, Approval, Current State | AWRP lineage + current Project OS domain model | **Build ourselves** | These are the product's canonical semantics. Reuse AWRP invariants (identity, fencing, ACK, handoff, evidence) and Linear interaction patterns, not their data model or hosted product. |
| Local Agent Daemon and Provider process management | Paseo `@getpaseo/server`, `@getpaseo/client`, `@getpaseo/protocol` v0.15.3 | **Adapt / wrap — highest-priority spike** | Evaluate its Daemon, process supervision, Provider adapters, WebSocket subscriptions, and event timeline as a Runtime Node. Never let Paseo Workspace/Agent records replace Project OS Project/Task/Run authority. |
| Agent ↔ client session protocol | Agent Client Protocol (ACP) v2; native Codex / Claude / OpenCode / Pi interfaces | **Direct reuse + native adapters** | Use ACP for compatible Providers; prefer each Provider's official structured interface when it exposes richer lifecycle, permissions, or history. Capability support remains native / emulated / unsupported / unknown. |
| Agent tool interoperability | Model Context Protocol (MCP) SDK/specification | **Direct reuse** | Use MCP to discover and call tools/resources. MCP does not provide Project OS authorization, durable Task state, Agent Session lifecycle, or a connector marketplace. |
| DeepSeek Harness / Super-agent prototype | `deepseek-harness` 0.2.2-rc.1; `dsh-superagent-prototype` | **Reference design** | Reuse Trigger → Router → Ticket → Assignment → Worker → Effects/Outbox → recovery patterns. Do not port the Harness or research prototype wholesale as the production runtime. |
| Durable workflow / background execution | DBOS Transact TypeScript v5.4 stable (2026-10-28) | **Adapt / wrap — primary candidate** | TypeScript + PostgreSQL, durable workflow steps, persisted workflow communication and event waits fit the current backend direction with minimal infrastructure. DBOS owns execution checkpoints only; Project OS owns canonical business state and external-effect policy. |
| Durable workflow fallback | Temporal v1.32.2 (2026-11-02) | **Reference / fallback** | Stronger fit if we later need a large cross-language worker fleet or more independent workflow infrastructure. A separate Temporal service and operational surface are not justified as the default starting point while a PostgreSQL-native option is viable. |
| Durable workflow alternative | Hatchet v0.114.2 (2026-10-26) | **Do not select as default yet** | Useful durable waits/events and PostgreSQL-backed execution, but two current upstream reports concern replay livelock and stalled durable-stream readers. Revisit only after fixes and targeted recovery/stream tests. |
| Connector catalog and implementations | Activepieces core v0.93.0; community pieces | **Selective source reuse / adapt** | Reuse individual community connector implementations where the API, scopes, and license fit. Convert them to our Service Connector contract. Do not adopt the full Activepieces workflow engine or let a Piece write canonical Project OS state. |
| Managed connector platform | Composio | **Exclude from free self-hosted core** | The repository's MIT license does not make its complete self-hosted deployment a free OSS option: official docs describe self-hosted and private-VPC deployments as Enterprise arrangements, while the default Cloud deployment stores credentials and executes provider requests. |
| Offline client data sync | PowerSync Open Edition v1.28.1 (2026-11-05) | **Conditional adapt / wrap** | Leading candidate for authorized Postgres → local SQLite read sync and queued client writes routed through our backend API. Do not freeze until Desktop + Mobile support, authorization filters, schema migration, conflict behavior, and current checkpoint behavior pass a narrow test. |
| Alternative local-first sync | ElectricSQL / Shapes | **Reference design** | Useful for scoped, table-oriented read projections. Shapes are single-table and immutable; this is not the default choice for the full relational Project/Task graph or our command/approval write path. |
| Canonical Memory / Decision / Context | Project OS domain model | **Build ourselves** | Store structured facts, scope, provenance, validity, confidence, supersession, permissions, and user/Agent/external verification state in our own data model. Retrieval ranking must never decide canonical truth. |
| Optional semantic memory retrieval | Mem0 OSS v3.3.1 (2026-09-25) | **Reference / optional retrieval experiment only** | Do not use as canonical memory. Its v3 ADD-only extraction can accumulate contradictory mutable facts; current Issue #4956 documents stale facts being returned as top-ranked candidates. |
| Portable Skill format | Agent Skills specification | **Direct reuse of format** | Adopt the portable directory + `SKILL.md` convention for import/export. Build our own extraction, provenance, evaluation, approval, versioning, scope, and rollback lifecycle. Experimental `allowed-tools` metadata is not an authorization boundary. |
| Authorization / plugin trust | Project OS Policy + Approval model | **Build ourselves** | Start with explicit capability grants, resource scopes, action risk, approvals, revocation, and audit. Do not inherit an unsandboxed plugin trust model or add OpenFGA/OPA before relationship-policy complexity warrants it. |
| Primary data and artifacts | PostgreSQL, local SQLite, S3-compatible object storage | **Direct reuse of mature infrastructure** | PostgreSQL remains the server-side canonical store; SQLite is a local client/runtime store or cache, not a second authority. Large artifacts live in object storage with immutable metadata/references. |
| Observability | OpenTelemetry-compatible tracing, metrics, and logs | **Direct reuse** | Use standard instrumentation and correlation IDs across Project → Task → Assignment → Run → Session → Connector. Do not invent a proprietary tracing format. |
| Product UI and desktop shell | React ecosystem; Tauri / Electron remain candidates | **Build product UX; defer shell ADR to G3** | Reuse mature terminal/editor/diff components where license and platform fit. Do not embed Paseo or Activepieces as the Project OS UI. Choose Tauri/Electron only after validating local process supervision, OS permissions, packaging, and mobile strategy. |

## 4. High-priority reuse findings

### 4.1 Paseo is the strongest Local Daemon reuse candidate, but not a drop-in Project OS

Paseo's v0.15.3 release exposes separately published Apache-2.0 packages, including `@getpaseo/server`, `@getpaseo/client`, `@getpaseo/protocol`, and `@getpaseo/plugin`. Its architecture already covers a local Node Daemon, Provider process lifecycle, WebSocket clients, multiple subscribers, Agent event timelines, terminal streams, and Provider adapters.

Two integration hazards prevent blind adoption:

- The `@getpaseo/server` root export eagerly loads Daemon bootstrap. Its package exposes explicit subpaths such as `/daemon-control`, `/configuration`, and `/process`; any reuse must start from those narrow imports and inspect the dependency graph.
- Paseo explicitly documents plugin backend code as trusted and unsandboxed. A plugin subprocess has access to the Daemon user's files, processes, credentials, and network. This cannot be our third-party marketplace trust model.
- Permission UX is also an active upstream issue: [#6923](https://github.com/getpaseo/paseo/issues/6923) remains open and triaged P2 because Claude permission cards can omit the reason a prompt appeared; proposed [PR #3950](https://github.com/getpaseo/paseo/pull/3950) was still open/unmerged at this snapshot. Maintainers counted multiple reports, but the reason must be verified in our G3 permission-flow test.

**Recommendation:** G3 should first test whether the published Daemon package can be hosted behind our `LocalRuntimeNode` adapter without importing Paseo's Workspace/Agent domain as our canonical state. If it fits, wrap it. If not, port only the smallest process, Provider, and event-stream modules that pass license and dependency review. Keep plugin execution disabled for untrusted third-party code until our own isolation boundary exists.

ACP v2 is complementary, not a replacement for the Daemon. It standardizes initialization, `session/new` / `session/resume`, prompts, streamed `session/update` events, cancellation, and permission requests. It does not define Project OS Task/Run identity, cross-Provider handoff, durable business workflows, or our permission policy. Native Provider interfaces remain preferred where they expose richer semantics.

### 4.2 DBOS is the best first workflow-engine candidate, with a release gate

DBOS is the closest fit to the current TypeScript + PostgreSQL architecture: it provides durable workflow steps, waits, persisted workflow communication, and recovery without requiring a separate RabbitMQ/Redis control plane. Use it behind our own port so the domain does not become coupled to DBOS decorators, IDs, or system tables.

The release timeline matters:

- DBOS v5.4 was published on 2026-10-28.
- Issue [#1427](https://github.com/dbos-inc/dbos-transact-ts/issues/1427) reported a queue partition-concurrency over-admission bug. Fix [PR #1430](https://github.com/dbos-inc/dbos-transact-ts/pull/1430) merged on 2026-10-29, after the v5.4 release. Do not assume v5.4 contains this fix; do not rely on `partitionConcurrency` until a stable release containing it is verified.
- A separate ownership bug affecting a 5.5.6 preview was fixed by [PR #1442](https://github.com/dbos-inc/dbos-transact-ts/pull/1442), merged on 2026-11-09. Do not use preview builds as a shortcut around stable release validation.
- DBOS documents `autoUpgrade` as an Enterprise feature. The OSS path must use explicit workflow-version/patch handling and a controlled deployment/drain strategy.

The upstream response on the cited queue and workflow issues was fast and produced merged fixes. This is a positive maintenance signal, but merge-to-main is not the same as a released, pinned package. G3 must test the exact stable package and must not rely on features whose fix is only on main.

**Boundary:** DBOS stores workflow execution/checkpoint state. Our database remains authoritative for Project, Task, Assignment, Run, Approval, and business outcomes. External effects still use our transactional Outbox, idempotency keys, receipts, and read-back reconciliation.

### 4.3 Why Temporal and Hatchet are not the first choice

Temporal is the fallback if the system later needs language-neutral workflow definitions, a large distributed worker fleet, or stronger independent orchestration operations. Its durability and replay model are mature, but it adds a separate service/control plane and deployment/operations work. That is a justified trade only when the runtime boundary needs it.

Hatchet supports durable event waits and checkpointed task replay. Its self-hosted control plane can use PostgreSQL alone at lower throughput, with RabbitMQ as an optional high-throughput component. However, as of this snapshot:

- [Issue #5327](https://github.com/hatchet-dev/hatchet/issues/5327) reports durable replay livelock on long journals; maintainers responded and invited a patch, but the issue remains open.
- [Issue #5387](https://github.com/hatchet-dev/hatchet/issues/5387) reports a stalled durable-stream reader blocking new subscribers and additional TypeScript SDK/API gaps; it was open with no maintainer response at the snapshot.

Hatchet documents at-least-once task execution. Therefore, business side effects still need idempotency even when durable task checkpoints prevent replay of completed segments. These current issues touch recovery and event delivery, so Hatchet is not the default engine until they are resolved and stress-tested.

### 4.4 Activepieces is a connector source, not our workflow engine

Activepieces' core is MIT outside the documented Enterprise paths. Its community pieces are built as self-contained bundles: the build inlines Activepieces workspace libraries and third-party dependencies into each published artifact. This is useful because individual connector implementations can be reviewed and adapted without embedding the full Activepieces runtime.

The published package metadata currently omits the `license` field; [Issue #16544](https://github.com/activepieces/activepieces/issues/16544) documents this procurement/scanner problem. The source repository states the MIT boundary, but a vendored connector must still retain the root license notice and have its own third-party dependency licenses checked. Prefer vendoring source from a pinned commit and recording the upstream path/commit rather than trusting a package scanner's `UNKNOWN` result.

Do not adopt the complete Activepieces engine: it introduces its own flow model and runtime, duplicating our Workflow/Trigger/Task authority. Connector actions must call our validated command/API layer; they must not directly mutate canonical state.

Composio is not an equivalent free self-hosted alternative. Its official token-custody documentation lists self-hosted and private-VPC deployments as Enterprise arrangements; the default Cloud mode stores credentials and executes provider requests on Composio infrastructure. It may be an optional external integration, but it is not part of the free self-hosted core.

### 4.5 PowerSync is a conditional offline-sync candidate

PowerSync Open Edition is Apache-2.0 and self-hostable. Its architecture reads a source database using Postgres logical replication, materializes authorized Sync Streams, and serves local SQLite clients. Client-side writes enter an upload queue; the SDK calls our `uploadData()` function, which should call our backend API. That preserves the rule that the Project OS domain command layer is the only canonical writer.

Important deployment/security conditions:

- The service requires a separate bucket-storage database; current docs support MongoDB or PostgreSQL. MongoDB is not mandatory if PostgreSQL storage is selected.
- The Postgres replication role is high-trust (the documented setup uses replication privileges and `BYPASSRLS`). Production publications must explicitly allowlist the required tables; do not copy the development `FOR ALL TABLES` example. Sync Streams and server-issued auth tokens must enforce per-user/per-Project visibility.
- PowerSync handles structured data synchronization, not the high-frequency Agent Session transcript/terminal stream. Local Daemon WebSocket/event-spool behavior remains a separate subsystem.
- [Issue #846](https://github.com/powersync-ja/powersync-service/issues/846) reports managed write-checkpoint delivery failures with MongoDB bucket storage on service 1.26.1/1.27.0. Maintainers suggested request-based checkpoint mode and storage v4 for investigation; the issue did not establish that the latest 1.28.1 is affected or fixed.

**Recommendation:** keep PowerSync as the preferred sync candidate, not a frozen dependency. The G3 spike should use the current stable service, PostgreSQL bucket storage first, a narrowly scoped publication, real auth tokens, and the backend `uploadData()` path. Test reconnect, offline writes, duplicate upload, conflict handling, schema migration, and cross-Project isolation on both Desktop and Mobile targets before adoption.

Electric Shapes are a lighter reference for table-oriented projections, but their single-table/immutable-shape model and separate authorization boundary are less suited to the complete relational Project/Task graph. Do not introduce both sync engines.

### 4.6 Memory and Skills must remain Project OS-owned

Mem0 OSS v3 is not a safe canonical fact store for this product. Its v3 extraction path is ADD-only for ordinary extraction; mutable facts can accumulate without an automatic UPDATE/DELETE replacement. [Issue #4956](https://github.com/mem0ai/mem0/issues/4956), still open at the snapshot, describes contradictory facts coexisting and a stale fact being returned above a newer one because retrieval scoring does not reliably encode recency.

Our own Memory/Decision model already requires provenance, scope, confidence, validity, permissions, and supersession. A memory retrieval engine may later help candidate recall, but every result must be checked against our canonical fact state and freshness rules. Do not delegate truth arbitration to semantic ranking.

Adopt the Agent Skills `SKILL.md` format as an interoperability format: directory, required name/description frontmatter, optional scripts/references/assets, and progressive disclosure. The specification labels `allowed-tools` experimental; it must never grant actual Project OS permissions. Our own Skill lifecycle remains: candidate from conversation/execution/review evidence → provenance and applicability → evaluation → user/authorized reviewer approval → versioned activation → monitoring and rollback.

## 5. Explicit exclusions from wholesale adoption

| Project / approach | Exclusion |
|---|---|
| DeepSeek Harness and `dsh-superagent-prototype` | MIT is permissive, but Harness is explicitly Developer Preview with breaking changes and a safety notice; the prototype README calls itself research code, not production-ready. Reuse its architecture and selected patterns, not its full runtime or prototype domain. |
| Full Paseo application / plugin marketplace | Coding-focused product model is not our Project OS; server package is pre-1.0; plugins are explicitly trusted and unsandboxed. Reuse the Daemon/Provider patterns and test selected packages only. |
| Full Activepieces engine | Duplicates our workflow and connector authority. Reuse selected community connector code only. |
| Composio as mandatory core | Self-hosted deployment is an Enterprise arrangement; default Cloud has credential custody and managed execution. |
| Mem0 as canonical Memory | ADD-only mutable-fact accumulation and stale retrieval conflict with our provenance/supersession requirements. |
| Hatchet as default workflow engine | Current open issues affect durable replay and stream delivery; keep as an alternative pending fixes and stress tests. |
| Electric as the only relational sync layer | Shape constraints are not a fit for the full relational Project graph and backend command/approval path. |
| Any plugin model that executes third-party code with ambient host privileges | Not acceptable for a public marketplace. Plugin permission declarations are not a sandbox; require isolation and revocable grants. |

## 6. G3 validation spikes — bounded, not a new research phase

These are the only follow-up experiments justified by the public evidence. They are not prerequisites for declaring the design worth developing, and they must not expand into full competitor installations.

| Spike | Goal | Required evidence / pass condition | Stop condition |
|---|---|---|---|
| G3-S1 DBOS | Prove durable workflow adapter with the exact stable package | kill/restart recovery; persisted event wait; duplicate command/idempotency; queue concurrency; workflow version upgrade; Outbox replay; Postgres pool behavior | If the required fix is not in a stable release or recovery semantics cannot be made compatible, compare Temporal before writing a custom engine |
| G3-S2 Paseo / ACP | Prove Local Runtime Node boundary with one real Provider | create/attach/resume; structured events; reconnect/history reconciliation; permission request and visible decision reason; Daemon restart; no duplicate Session; exact package subpath dependency tree | If Paseo's domain/dependency coupling is too high, implement our own thin Daemon around native Provider SDKs/ACP, not a new Agent harness |
| G3-S3 Connector | Port one high-value community piece through our Service Connector contract | license + dependency audit; OAuth scope declaration; read/write separation; rate-limit/retry; webhook dedup; command API only | If the connector depends on Activepieces engine state, use its API pattern as reference instead of vendoring |
| G3-S4 PowerSync | Prove local data sync without bypassing domain authority | Postgres source + PostgreSQL bucket storage; allowlisted publication; Sync Stream authorization; offline write upload through backend; reconnect/checkpoint; Desktop and Mobile compatibility | If desktop SDK or isolation semantics fail, defer offline sync and keep a simpler authenticated API/realtime path; do not add Electric as a second engine |
| G3-S5 Skills | Prove portable Skill import/export and governance | validate `SKILL.md`; add Project OS provenance/scope/version metadata; evaluation and approval; confirm tool grants are enforced outside Skill metadata | If an Agent ignores optional metadata, safety remains unchanged because Policy owns permissions |

Do not run a full installation or load test of every candidate. Each spike exists only to resolve a decision-critical uncertainty and should produce a short evidence note plus an ADR if it changes an architecture boundary.

## 7. Upstream maintenance and version snapshot

The following are evaluation snapshots, not dependency lockfiles:

| Project | Snapshot / license | Maintenance evidence that changes our decision |
|---|---|---|
| Paseo | v0.15.3, Apache-2.0; separately published server/client/protocol/plugin packages | Active release line; package is pre-1.0 and plugin backend is unsandboxed. Issue #6923 remains open P2 and PR #3950 unmerged for missing permission reasons. Treat APIs as moving and pin exact package versions during G3. |
| DBOS Transact TS | v5.4 stable, MIT | Issues #1427/#1423 received fixes merged in PRs #1430/#1424; PR #1430 landed after v5.4 release. Preview ownership fix #1442 merged 2026-11-09. Good maintainer responsiveness, but release lag matters. |
| Temporal | v1.32.2, MIT | Mature server/workflow project; separate deployment/operations cost is the main fit issue, not license. |
| Hatchet | v0.114.2, MIT | Maintainers engaged on #5327, but it remained open; #5387 was also open at snapshot. Recovery/stream issues block default selection. |
| Activepieces | v0.93.0, MIT core outside EE paths | Community piece bundles are self-contained; npm license metadata issue #16544 remained open. Vendor source with notices and per-piece dependency audit. |
| PowerSync | v1.28.1, Apache-2.0 Open Edition | Self-hosted core is available; #846 was open on MongoDB bucket-storage checkpoint behavior for earlier service versions. Verify current stable behavior. |
| Mem0 | v3.3.1, Apache-2.0 | Issue #4956 remained open; its reported stale-fact behavior conflicts with canonical Memory requirements. |
| DeepSeek Harness | 0.2.2-rc.1, MIT | Official README labels Developer Preview and warns of breaking changes; Node.js >=24.9.0 and safety review are additional adoption constraints. |
| Agent Skills | Open specification; source repository Apache-2.0 | Use the format as an interoperability contract; optional/experimental metadata is not a security contract. |

## 8. Architecture consequences for G3

1. **Canonical state:** Project OS owns Project, Task, Assignment, Run, Review, Approval, Knowledge, Memory, Skill, and policy state. A workflow engine, Daemon, connector, or sync service may store its own runtime state, but may not become a second domain authority.
2. **Execution:** `DurableWorkflowPort` isolates DBOS/Temporal choice. `LocalRuntimeNode` isolates Paseo/native Daemon choice. `ProviderAdapter` isolates ACP/native Provider details.
3. **Events and effects:** our transactional Outbox/Inbox, command receipts, idempotency, and external read-back remain authoritative even when a reused runtime offers retries or durable events.
4. **Connectors and tools:** MCP and adapted Activepieces pieces call validated Project OS commands. They do not bypass Policy/Approval or directly mutate canonical state.
5. **Knowledge and Skills:** retrieval proposes candidates; provenance, freshness, supersession, evaluation, and approval are Project OS responsibilities. Skill metadata cannot grant tools or expand access.
6. **Sync:** PowerSync, if adopted, distributes only explicitly authorized projections. Writes return through the backend command layer; Session streaming remains separate.
7. **Self-hosting:** the core path must remain usable without Composio Cloud, Activepieces Enterprise, a vendor relay, or a paid workflow service. Optional external services must be replaceable and clearly labeled.

**G2 exit result:** every major subsystem now has a Direct Reuse / Adapt / Reference / Build decision, with source/license/version evidence, upstream risk, integration boundary, fallback, and bounded G3 validation. G2 is therefore complete as a design/reuse assessment. G3 must validate only the named uncertainties before any parallel implementation starts.

## 9. Primary sources

### Local Agent runtime and protocols
- [Paseo repository](https://github.com/getpaseo/paseo), [architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md), [server package](https://www.npmjs.com/package/@getpaseo/server), [plugin security reference](https://paseo.sh/docs/plugins/reference), [permission reason issue #6923](https://github.com/getpaseo/paseo/issues/6923), [proposed fix #3950](https://github.com/getpaseo/paseo/pull/3950).
- [ACP v2 overview](https://agentclientprotocol.com/protocol/v2/overview), [prompt lifecycle](https://agentclientprotocol.com/protocol/v2/prompt-lifecycle).
- [MCP specification](https://modelcontextprotocol.io/specification).
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), [safety notice](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md), [Super-agent prototype](https://github.com/deepseek-ai/dsh-superagent-prototype).

### Durable workflow
- [DBOS TypeScript durable workflows](https://docs.dbos.dev/typescript/tutorials/durable-workflows), [workflow communication](https://docs.dbos.dev/typescript/tutorials/communicating-with-workflows), [repository/releases](https://github.com/dbos-inc/dbos-transact-ts/releases).
- [DBOS #1427](https://github.com/dbos-inc/dbos-transact-ts/issues/1427), [PR #1430](https://github.com/dbos-inc/dbos-transact-ts/pull/1430), [PR #1442](https://github.com/dbos-inc/dbos-transact-ts/pull/1442).
- [Temporal workflows](https://docs.temporal.io/workflows), [self-hosted deployment](https://docs.temporal.io/self-hosted-guide/deployment).
- [Hatchet self-hosting](https://docs.hatchet.run/self-hosting), [durable tasks](https://docs.hatchet.run/v1/durable-tasks), [event waits](https://docs.hatchet.run/v1/durable-event-waits), [#5327](https://github.com/hatchet-dev/hatchet/issues/5327), [#5387](https://github.com/hatchet-dev/hatchet/issues/5387).

### Connectors, sync, Memory, and Skills
- [Activepieces license](https://www.activepieces.com/docs/about/license), [piece bundling](https://www.activepieces.com/docs/build-pieces/misc/bundling-pieces), [#16544](https://github.com/activepieces/activepieces/issues/16544).
- [Composio token custody and deployment options](https://docs.composio.dev/docs/security/token-custody).
- [PowerSync self-hosted service](https://docs.powersync.com/configuration/powersync-service/self-hosted-instances), [backend write path](https://docs.powersync.com/configuration/app-backend/client-side-integration), [React Native SDK](https://docs.powersync.com/client-sdks/reference/react-native-and-expo), [#846](https://github.com/powersync-ja/powersync-service/issues/846).
- [Electric Shapes](https://electric-sql.com/docs/guides/shapes), [Electric auth](https://electric-sql.com/docs/guides/auth).
- [Mem0 OSS](https://docs.mem0.ai/open-source/overview), [#4956](https://github.com/mem0ai/mem0/issues/4956).
- [Agent Skills specification](https://agentskills.io/specification), [source repository](https://github.com/agentskills/agentskills).

