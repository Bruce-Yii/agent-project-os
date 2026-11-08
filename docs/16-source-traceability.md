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

