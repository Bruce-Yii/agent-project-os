# 13 — Competitor, Reference, and Reuse Analysis

**Research snapshot:** 2026-11-09. Official docs/source prioritized. Moving branches and product availability must be rechecked before implementation. This is a design comparison, not a claim that the listed products are exhaustive.

## 1. Our own lineage

### AWRP — reliable handoff and execution protocol

**Verified source:** [repository](https://github.com/Bruce-Yii/agent-relay), [protocol](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/AWRP-0.1.md), [worker contract](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/WORKER-CONTRACT.md), [coordinator adapter](https://github.com/Bruce-Yii/agent-relay/blob/main/protocol/CHATGPT-ADAPTER.md).

AWRP's README explicitly states it is a small coordination protocol, not an Agent platform. Its canonical model includes Project, Channel, Lane, Claim, Task, Run, Event, and Artifact; Context is grouping/compatibility, and Session is local-only binding/focus.

**Preserve:** stable Project identity; Task/Run separation; append-only event facts; ACK before material work; one execution per Run ID; durable HANDOFF; exact artifact/commit evidence; claims/fencing/CAS; isolated execution views; fail-closed conflict handling; transport does not author canonical semantics.

**Do not copy blindly:** GitHub JSON relay as the product database, the protocol's exact wire schema, or its coding-agent-only operating assumptions.

### Linear + Notion operating model — durable project governance

**Verified source:** [Personal Project OS](https://linear.app/yi383775/project/personal-project-oslinear-notion-governance-a75ee24846a2), [Current State document](https://linear.app/yi383775/document/current-statepersonal-project-os-c6fc29b72936), [Collaboration Contract](https://linear.app/yi383775/document/linear-collaboration-contract-v1issue-run-long-return-routing-409c44cd596d).

The real operating contract separated Notion long-term semantics/research/decisions from Linear Project/Issue/status/dependencies/review/waiting/recovery, while GitHub and other external systems remained Live Truth. Project identity survived Agent windows and sessions. A Project was a long-lived execution domain; an Issue was a bounded Work Package with its own goal, state, and acceptance boundary; an Agent Run normally stayed inside the existing Issue instead of generating a new Issue. AWRP was explicitly historical architecture after the cutover, not an active operational dependency.

**Preserve:** Project Current State; recovery from Project → current state → active Work Package → refresh live external truth; Waiting vs Blocked vs Review; task deduplication; issue-creation discipline under a limited issue budget; research-to-execution transition; long Agent returns routed to a durable knowledge/execution-return ledger while Linear keeps a compact conclusion, next action, and evidence links; knowledge extraction gate; Project liveness/dormancy; safe archive ordering; external truth ownership. The Linear Project's liveness gate treated a Project as operationally active only when it had an active Issue, explicit waiting dependency, current research/external gate, or concrete next action.

**Do not copy blindly:** Linear Issue schema, comments as a universal transport, plan/issue quota limitations, or Notion/Linear split as a mandatory architecture for the new product.

## 2. Linear as a product reference

Official docs reviewed:

- [Projects](https://linear.app/docs/projects)
- [Project milestones](https://linear.app/docs/project-milestones)
- [Parent and sub-issues](https://linear.app/docs/parent-and-sub-issues)
- [Assign and delegate issues](https://linear.app/docs/assigning-issues)
- [Triage](https://linear.app/docs/triage)
- [Linear Agent](https://linear.app/docs/linear-agent)
- [Coding sessions](https://linear.app/docs/coding-sessions)
- [Loops](https://linear.app/docs/loops)

**Current capabilities observed:** Projects group Issues and expose overview/progress/milestones; Projects can span teams; an Issue is associated with one Project at a time; sub-issues decompose work; human assignee can remain accountable while an Agent is delegated; Linear Agent can query/update workspace data, use MCP connectors, run Loops on schedules/events, and launch cloud coding sessions tied to Issues.

**Product lessons:** project overview, milestone progress, triage, subtask creation, keyboard-first operations, and separation of human accountability from Agent delegation are mature patterns.

**Limitations/design opportunities:** Project/Issue structures are defined by Linear's own product model; one Issue is associated with one Project at a time; coding sessions are Issue-bound and use Linear's supported secure cloud execution path. Our product must model local/remote providers, Sessions, Runs, Project-wide knowledge, multiple external systems, and broader non-coding work as first-class concerns.

## 3. DeepSeek DSH Super-agent

**Verified source:** [repository](https://github.com/deepseek-ai/dsh-superagent-prototype), [domain model](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/001-domain.md), [execution](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/003-execution.md), [deployment](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/006-deployment.md), [architecture](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/master/docs/007-architecture.md).

**Current design observed:** Source → Trigger → Thread → Eval → Decision/Mandate → Ticket → Assignment → Executor, with Subscriptions and Channels; Engine is the single writer for core aggregates; transactional commands and Outbox/effect processing; runtime recovery resumes interrupted Assignments. The prototype's Executor and Sessions are tied to its runtime/harness and its deployment docs describe a specific environment and permissions.

**Preserve:** event intake and deduplication; decision/evaluation before creating work; explicit mandate/scope; Assignment separate from work unit; context subscriptions; policy versioning; durable Outbox; transactional aggregate writes; explicit resume/stop/retry; attention only when needed.

**Do not copy blindly:** DSH's Ticket as our Task schema, its Harness-specific runtime, Source implementations, UI, or its product center. DSH is an important execution/workflow reference, not the whole Project OS.

## 4. Paperclip

**Verified source:** [repository](https://github.com/paperclipai/paperclip), [architecture](https://github.com/paperclipai/paperclip/blob/master/docs/start/architecture.md), [specification](https://github.com/paperclipai/paperclip/blob/master/doc/SPEC.md).

**Current design observed:** company-scoped control plane; React UI, REST API, Postgres/PGlite, adapters for Claude/Codex/process/HTTP; Agent workforce and org structure; tasks, goals/initiatives, budgets, heartbeat/run records, Board governance and approval. Its specification contains sections explicitly marked DRAFT and experimental Case/workflow features.

**Preserve:** agent registry/adapters, human governance, budget visibility, task checkout, run records, heartbeat/trigger patterns, and a control-plane boundary separate from execution.

**Do not copy blindly:** mandatory Company/CEO/Org-chart metaphor, single-assignee constraints, or draft/experimental specification items as if they were stable released contracts.

## 5. Paseo

**Verified source:** [repository](https://github.com/getpaseo/paseo), [product](https://github.com/getpaseo/paseo/blob/main/docs/product.md), [architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md), [workspaces](https://github.com/getpaseo/paseo/blob/main/docs/workspaces.md).

**Current design observed:** local-first client-server system; Daemon manages local Agent processes and exposes a WebSocket API; Desktop/Mobile/Web/CLI clients connect to it; workspaces are stable containers with multiple Agent sessions, terminals, browsers, and diffs; local and worktree isolation; plugins and SDK; optional relay for remote access.

**Preserve:** independent Daemon, cross-device client model, Provider abstraction, workspace/session distinction, local/remote control, plugins, and clear local-first privacy boundary.

**Do not copy blindly:** coding-only product center or assumptions that a local process remains available when its host is offline.

## 6. Other relevant references

| Product / project | Useful reference | Boundary / caution |
|---|---|---|
| [Superset](https://github.com/superset-sh/superset) | parallel coding workspaces, worktrees, terminals, diff review, browser previews, remote access, automation, skills | coding-focused; platform availability and commercial features change; re-check license and current product naming |
| [OpenHands Agent Canvas](https://github.com/All-Hands-AI/OpenHands) | local/remote/cloud agent backends, automations, integrations, multiple Agent types | developer control center, not a complete general-purpose Project OS |
| [Conductor](https://github.com/Conductor-OSS/conductor) | durable workflow execution, retries, timeouts, dynamic graphs, approvals, worker scale | workflow engine, not the user-facing Project OS |
| [Temporal](https://docs.temporal.io/workflows) | durable workflow history, replay, recovery, deterministic orchestration | infrastructure layer; requires careful Activity/Workflow boundaries |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/checkpointers) | checkpointing, human-in-the-loop, per-step persistence, fault recovery | agent workflow framework; does not replace Project/Task domain model |
| [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) | task-to-agent coding workflow and review patterns | repository README indicates sunsetting; do not assume active long-term maintenance |

## 7. Local Agent Session protocol comparison (added 2026-11-09)

The local Agent Session feature should be built against real Provider interfaces, not a generic assumption that every CLI can be driven in the same way.

| Provider | Native surface | Strong points | Engineering caution |
|---|---|---|---|
| Codex | App Server JSON-RPC over stdio; other local transports have version/experimental constraints | thread start/resume/fork; turn start/steer/interrupt; structured notifications | initialize handshake, protocol version pinning, and sandbox/workdir policy; do not depend on experimental WebSocket without validation |
| Claude Code | Agent SDK / CLI structured streaming | session ID, continue/resume/fork, stream events, permission callbacks | SDK/CLI version compatibility, long-lived process lifecycle, credential handling |
| OpenCode | Local HTTP server + SSE | session/message/history APIs, async prompt, abort, permission and diff endpoints | event stream can be volatile; reconnect must fetch history and reconcile; slow consumer behavior must be tested |
| Pi | Long-lived RPC process over JSONL | bidirectional commands, correlated responses, rich Session/turn/tool events | strict LF framing; stdout must be read continuously or backpressure can stall the process |
| Paseo | Daemon/client WebSocket protocol and provider adapters | reference implementation for local daemon, multi-client observation, session messages, terminal streams, permission flow | reuse design lessons and evaluate components/licenses; do not copy its coding-only product scope |

**Product consequence:** a single Session workbench can be shared across Providers, but its capability surface must be negotiated. Native resume, process reattach, restart-with-context, terminal-only mode, message streaming, tool events, and permission handling are independent capabilities. A Provider must not be advertised as supporting an operation that its adapter cannot verify.

Primary docs: [Codex App Server](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md), [Claude Agent SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions), [OpenCode Server](https://opencode.ai/docs/server/), [Pi RPC](https://pi.dev/docs/latest/rpc), [Paseo architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md).

## 8. Synthesis — what the product should own


| Layer | We should own | We should reuse/adapt |
|---|---|---|
| Project domain | Project/Goal/Task/Dependency/Current State and ownership rules | mature list/board/timeline interaction patterns |
| Human-Agent collaboration | accountability, participants, delegation, review roles | Linear's human assignee + Agent delegate distinction; Paperclip's governance lessons |
| Execution | Assignment/Run/Session linkage, handoff, evidence, recovery contract | AWRP reliability invariants; Paseo adapters/Daemon ideas |
| Event orchestration | Trigger/Policy/Eval/Workflow/Outbox boundaries | DSH's domain/transaction patterns; Temporal/Conductor primitives where appropriate |
| Knowledge | Project context, provenance, decision and memory rules | existing knowledge stores and connectors |
| Client | Project-first cross-device experience | Paseo's daemon-client separation and established UI patterns |
| Integrations | capability and permission contracts | existing Provider SDKs, MCP, GitHub/Notion/Feishu APIs |

The differentiated product hypothesis is the **unified Project workspace and canonical model across people, Agents, work, knowledge, runtimes, and delivery**. No single listed feature is assumed to be unique.

