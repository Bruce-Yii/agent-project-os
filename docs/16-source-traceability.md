# 16 — Source Traceability Matrix

This matrix shows where the feature inventory and design rules originated. It is intended to prevent accidental invention, copying, or loss of historical lessons.

## 1. Source registry

| Key | Source | What it contributes | Evidence type |
|---|---|---|---|
| A1 | [AWRP README](https://github.com/Bruce-Yii/agent-relay/blob/main/README.md) | Project/Channel/Task/Run/Event/Artifact, canonical vs projection, not a full Agent platform | repository source |
| A2 | [AWRP protocol](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/AWRP-0.1.md) | Project identity, Run semantics, event chain, authorization, recovery | protocol source |
| A3 | [AWRP Worker Contract](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/WORKER-CONTRACT.md) | ACK, run identity, handoff, isolated execution view, fail-closed behavior | protocol source |
| A4 | [AWRP Coordinator Adapter](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/CHATGPT-ADAPTER.md) | connector as transport, validated composer, read-back verification, out-of-band corruption | protocol source |
| U1 | [Linear Personal Project OS](https://linear.app/yi383775/project/personal-project-oslinear-notion-governance-a75ee24846a2) | real Project/Issue/Current State/Waiting/Review/recovery/knowledge separation | actual operating history |
| U2 | [Linear Current State](https://linear.app/yi383775/document/current-statepersonal-project-os-c6fc29b72936) | Project stable, Issue bounded Work Package, liveness gate, issue-creation budget, Live Truth | actual operating contract |
| U3 | [Linear Collaboration Contract](https://linear.app/yi383775/document/linear-collaboration-contract-v1issue-run-long-return-routing-409c44cd596d) | Issue × Run × Long Return routing and durable execution handoff | actual operating contract |
| L1 | [Linear Projects](https://linear.app/docs/projects) | Project overview, milestones, teams, project views | official docs |
| L2 | [Linear parent/sub-issues](https://linear.app/docs/parent-and-sub-issues) | task decomposition and parent/subtask patterns | official docs |
| L3 | [Linear assign/delegate](https://linear.app/docs/assigning-issues) | human accountability separate from Agent delegation | official docs |
| L4 | [Linear Agent](https://linear.app/docs/linear-agent) | workspace-aware Agent, MCP connectors, Loops | official docs |
| L5 | [Linear coding sessions](https://linear.app/docs/coding-sessions) | issue-bound cloud coding execution and review | official docs |
| L6 | [Linear Loops](https://linear.app/docs/loops) | scheduled/event-triggered workflows | official docs |
| D1 | [DSH domain model](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/001-domain.md) | Source/Trigger/Thread/Eval/Mandate/Ticket/Assignment/Subscription | prototype source |
| D2 | [DSH execution](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/003-execution.md) | stages, waiting, worker slots, execution recovery | prototype source |
| D3 | [DSH deployment](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/006-deployment.md) | runtime, profile, account, and isolation constraints | prototype source |
| D4 | [DSH architecture](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/007-architecture.md) | single Engine writer, transactions, Outbox, Runtime recovery | prototype source |
| P1 | [Paperclip architecture](https://github.com/paperclipai/paperclip/blob/master/docs/start/architecture.md) | control plane, adapters, company scope, task/run model | project source |
| P2 | [Paperclip spec](https://github.com/paperclipai/paperclip/blob/master/doc/SPEC.md) | Board governance, budgets, agent org, draft/experimental Cases | living spec |
| S1 | [Paseo product](https://github.com/getpaseo/paseo/blob/main/docs/product.md) | cross-device Agent workspace, daemon independence, plugins | project source |
| S2 | [Paseo architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md) | client-server, local Daemon, Provider processes, WebSocket | project source |
| S3 | [Paseo workspaces](https://github.com/getpaseo/paseo/blob/main/docs/workspaces.md) | stable workspace containing sessions, terminals, browser, diff | project source |
| S4 | [Paseo architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md) | local Daemon, client-server protocol, multi-client WebSocket subscriptions, Provider adapters | project source |
| C1 | [Codex App Server](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md) | local JSON-RPC, thread lifecycle, turn control, streaming notifications | official project source |
| C2 | [Claude Agent SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions) | session ID, continue, resume, fork | official docs |
| C3 | [Claude Agent SDK Python reference](https://code.claude.com/docs/en/agent-sdk/python) | streaming events, tool permissions, cwd, SDK session options | official docs |
| OC1 | [OpenCode Server](https://opencode.ai/docs/server/) | local session/message APIs, SSE event stream, abort, permissions, history endpoints | official docs |
| PI1 | [Pi RPC Mode](https://pi.dev/docs/latest/rpc) | long-lived JSONL bidirectional command/response/event protocol | official docs |
| PI2 | [Pi JSON Event Stream](https://pi.dev/docs/latest/json) | strict framing, event lifecycle, stdout backpressure requirements | official docs |
| O1 | [Superset](https://github.com/superset-sh/superset) | parallel worktrees, diff review, browser preview, remote access, automation | project source |
| O2 | [OpenHands Agent Canvas](https://github.com/All-Hands-AI/OpenHands) | multiple agent backends, local/remote/cloud, automations | project source |
| O3 | [Conductor](https://github.com/Conductor-OSS/conductor) | durable workflow, retries, approval, dynamic graphs | project source |
| O4 | [Temporal workflows](https://docs.temporal.io/workflows) | durable history/replay and recovery | official docs |
| O5 | [LangGraph checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | checkpointing, human-in-loop, pending writes | official docs |

| U4 | [Product PRD and lineage](00-product-charter.md) | explicit synthesis of AWRP, our Linear operating model, and DSH; unified Project OS positioning; free self-hosted open-source requirement | product-owner-confirmed design history |
| N | New product design synthesis | Product-owner-confirmed Agent Project OS requirements and design decisions captured in the current Notion project home and product definition; not an external product or implementation claim | internal product-owner decision / design synthesis |
| P3 | [Paperclip repository](https://github.com/paperclipai/paperclip) and [self-hosted overview](https://paperclip.ing/product/open-source/) | MIT license, self-hosted install, Agent organization/projects/tasks/goals/governance | official repository and product docs |
| S5 | [Paseo repository](https://github.com/getpaseo/paseo) and [product docs](https://github.com/getpaseo/paseo/blob/main/docs/product.md) | Apache-2.0, local Daemon, self-hosted cross-device Agent development environment | official repository and product docs |
| OH1 | [OpenHands Agent Canvas repository](https://github.com/All-Hands-AI/OpenHands) and [official pricing](https://www.openhands.dev/pricing) | MIT Agent Canvas, free self-hosted single-user offering, paid team/enterprise distinction | official repository and pricing page |
| SU1 | [Superset repository](https://github.com/superset-sh/superset) | Elastic License 2.0/source-available position and local/remote feature split | official repository; re-check current product identity |
| L7 | [Linear pricing](https://linear.app/pricing) and [AI credits](https://linear.app/docs/ai-credits) | free tier limits and usage-based AI coding/Loop credits; hosted SaaS distribution | official pricing and billing docs |
| R1 | [DBOS Transact TypeScript](https://github.com/dbos-inc/dbos-transact-ts), [durable workflows](https://docs.dbos.dev/typescript/tutorials/durable-workflows), [#1427](https://github.com/dbos-inc/dbos-transact-ts/issues/1427), [#1430](https://github.com/dbos-inc/dbos-transact-ts/pull/1430), [#1442](https://github.com/dbos-inc/dbos-transact-ts/pull/1442) | PostgreSQL-backed durable workflow steps, event waits, release/fix timing and maintainer response | official docs, source, release, Issues/PRs |
| R2 | [Temporal workflows](https://docs.temporal.io/workflows) and [self-hosted deployment](https://docs.temporal.io/self-hosted-guide/deployment) | durable workflow replay/recovery and self-hosted operational boundary | official docs |
| R3 | [Hatchet self-hosting](https://docs.hatchet.run/self-hosting), [durable tasks](https://docs.hatchet.run/v1/durable-tasks), [#5327](https://github.com/hatchet-dev/hatchet/issues/5327), [#5387](https://github.com/hatchet-dev/hatchet/issues/5387) | durable event waits, Postgres/RabbitMQ deployment choices, replay/stream failure reports and maintainer responses | official docs, source, Issues |
| R4 | [Paseo repository](https://github.com/getpaseo/paseo), [architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md), [server package](https://www.npmjs.com/package/@getpaseo/server), [plugin reference](https://paseo.sh/docs/plugins/reference), [permission issue #6923](https://github.com/getpaseo/paseo/issues/6923), [fix PR #3950](https://github.com/getpaseo/paseo/pull/3950) | Local Daemon, published package boundaries, provider adapters, eager bootstrap subpaths, unsandboxed plugin trust boundary, missing permission-reason evidence and maintainer triage | official source, package manifest, docs, Issue/PR |
| R5 | [Agent Client Protocol v2](https://agentclientprotocol.com/protocol/v2/overview) and [prompt lifecycle](https://agentclientprotocol.com/protocol/v2/prompt-lifecycle) | Agent-client session initialization, new/resume, prompt/update, cancellation and permission protocol | official specification |
| R6 | [Model Context Protocol specification](https://modelcontextprotocol.io/specification) | tool/resource interoperability boundary; separate from Agent Session and Project OS authorization | official specification |
| R7 | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), [safety notice](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md), [Super-agent prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | MIT license, developer-preview warning, safety notice, and research-prototype boundary | official repository and README |
| R8 | [Activepieces license](https://www.activepieces.com/docs/about/license), [piece bundling](https://www.activepieces.com/docs/build-pieces/misc/bundling-pieces), [#16544](https://github.com/activepieces/activepieces/issues/16544) | MIT/Enterprise boundary, self-contained community piece bundles, missing published license metadata | official docs, source, Issue |
| R9 | [Composio token custody and deployment](https://docs.composio.dev/docs/security/token-custody) | Cloud credential custody and Enterprise availability for private-VPC/self-hosted deployment | official security docs |
| R10 | [PowerSync self-hosting](https://docs.powersync.com/configuration/powersync-service/self-hosted-instances), [backend write path](https://docs.powersync.com/configuration/app-backend/client-side-integration), [#846](https://github.com/powersync-ja/powersync-service/issues/846) | Postgres logical replication, SQLite sync, backend-mediated writes, bucket storage options, checkpoint issue and maintainer response | official docs, source, Issue |
| R11 | [Electric Shapes](https://electric-sql.com/docs/guides/shapes) and [auth](https://electric-sql.com/docs/guides/auth) | table-oriented shape sync, shape immutability, authorization boundary | official docs |
| R12 | [Mem0 OSS](https://docs.mem0.ai/open-source/overview) and [#4956](https://github.com/mem0ai/mem0/issues/4956) | ADD-only mutable-fact accumulation and stale retrieval report | official docs, source, Issue |
| R13 | [Agent Skills specification](https://agentskills.io/specification) and [repository](https://github.com/agentskills/agentskills) | portable `SKILL.md` format, progressive disclosure, experimental allowed-tools field | official specification and source

## 2. Feature group mapping

| Feature IDs | Main sources |
|---|---|
| F01–F04 Workspace, portfolio, project, project structure | U1/U2, L1, P1/P2, N |
| F05–F08 Task, dependency, lifecycle, intake/triage | A1/A2, U1/U2/U3, L1/L2, L6, D1/D2 |
| F09–F10 participants and communication | U1/U3, L3/L4, P1/P2, D1 |
| F11–F16 Agent registry, Sessions, local Daemon, delegation, coordination, Runs, runtimes | A1/A2/A3, L3/L5, D1/D2/D4, P1, S1/S2/S3/S4, C1/C2/C3, OC1, PI1/PI2, O1/O2 |
| F17–F19 workflows, planning, autonomy | D1/D2/D4, L4/L6, P2, O3/O4/O5 |
| F20–F22 knowledge, memory, Skills | U1/U2, L4, P2, S1, D1, N |
| F23 integrations and plugins | A4, L4/L6, P1, S1/S2, O2 |
| F24–F26 artifacts, review, governance | A2/A3/A4, U1/U3, L3/L5, P1/P2, D1/D2 |
| F27–F29 visualization, clients, attention | L1/L4/L5, P1/P2, S1/S2, D2/D4 |
| F30–F31 observability, portability | A1/A4, U1/U2, P1/P2, S2, O3/O4/O5 |
| F32 universal search and command palette | L1/L2/L4, U1/U2, S1/S2, N |

## 3. Evidence rules

- A repository README is evidence of a project's stated purpose, not proof every listed feature works.
- A living specification may include DRAFT or experimental sections; preserve those labels.
- An architecture document is evidence of intended structure; verify code/tests before claiming implementation.
- A product page is evidence of product positioning; verify exact behavior in docs or hands-on tests.
- A competitor feature is not automatically a product requirement.
- AWRP and Linear practices are historical evidence from our own workflow, not a mandate to preserve their technical limitations.


## 4. Local Agent Session design references

The detailed local Session contract is in [18 — Local Agent Session Subsystem](18-local-agent-session-subsystem.md). The provider docs establish that structured local integration is feasible through multiple distinct interfaces (JSON-RPC app-server, SDK, HTTP/SSE, JSONL RPC), but they do not establish uniform feature parity. Every adapter must be validated against pinned versions and real-machine tests.

