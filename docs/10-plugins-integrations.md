# 10 — Plugins, Providers, and External Integrations

## 1. Plugin architecture

Plugins extend the Project OS through explicit contracts. A plugin must declare what it can do, what it can access, what events it emits, and which permissions it requires.

Candidate plugin classes:

1. **Agent Provider:** connect to an Agent CLI, SDK, or API.
2. **Runtime Provider:** create/manage a local, remote, cloud, or sandbox execution node.
3. **Service Connector:** access GitHub, Notion, Feishu, calendar, browser, issue trackers, or business systems.
4. **Trigger Provider:** observe event streams and produce normalized Triggers.
5. **Knowledge Provider:** search/read/write documents or knowledge stores.
6. **UI Extension:** add a specialized panel or view without changing core domain ownership.

## 2. Plugin manifest (proposal)

A manifest should declare:

- plugin ID, name, version, vendor, license, compatibility;
- plugin class and supported capabilities;
- required permissions and resource scopes;
- supported events and commands;
- authentication method and secret requirements;
- health/diagnostic interface;
- version migration and deprecation policy;
- supported clients/runtime environments.

## 3. Agent Provider contract (proposal)

Capabilities should be optional and negotiated:

- discover/configure/health-check/version-check;
- list/get/create/attach/resume/fork/archive Session;
- read Session history and reconcile events after reconnect;
- send message, steer active turn, queue follow-up, dispatch task;
- subscribe to normalized Session events with cursor/replay semantics where supported;
- interrupt turn, cancel Session/process, and respond to permission prompts where supported;
- retrieve artifacts, diff, terminal streams, usage, and logs where supported;
- expose a capability matrix (`native`, `emulated`, `unsupported`, `unknown`) and explain any degraded/opaque mode;
- report provider-native session reference and resumability semantics.

The adapter must preserve raw event provenance while mapping to a common event vocabulary. Unsupported capabilities must be explicit. A structured native protocol/SDK is preferred; structured CLI streaming is acceptable; terminal UI automation is a last-resort opaque fallback and must not pretend to expose structured tool/message events. See [Local Agent Session Subsystem](18-local-agent-session-subsystem.md).

## 4. Connector contract

A Service Connector should expose:

- connect/disconnect and credential refresh;
- resource discovery and permission introspection;
- read/list/search operations;
- write operations with explicit scope and idempotency where possible;
- webhook/event subscription and cursor recovery;
- rate-limit, retry, and error semantics;
- reconciliation/read-after-write support.

Connector code transports data and performs authorized effects. It does not invent canonical Project OS state transitions.

## 5. Priority integration candidates

| Integration | Main purpose | Authority boundary |
|---|---|---|
| GitHub/Git forge | repositories, branches, commits, PRs, CI, reviews | forge owns live code/PR/CI state |
| Notion | long-form research, project docs, decisions, knowledge | Notion owns its page/database content and permissions |
| Feishu/Lark | documents, chat/event sources, approvals, collaboration | Feishu owns its records and access rules |
| Calendar | schedules, deadlines, events | calendar owns event records |
| Browser | research and web-based workflows | each website owns its own state and policies |
| MCP servers | tool discovery and external service access | each server's auth and capability contract applies |
| Linear/Jira | import/export or connector for existing issue systems | connected tracker owns its issue state until migration/ownership is explicitly changed |

## 6. Local Agent integration

A local Agent plugin should:

1. detect installed provider and version;
2. confirm authentication without exposing secrets;
3. declare supported capabilities;
4. pair with a Runtime Node/Daemon;
5. allow direct Session creation and Project/Task attachment;
6. expose events and artifacts;
7. support safe interrupt/cancel/recovery where possible;
8. report host connectivity and provider failures accurately.

## 7. Security and isolation

- least-privilege scopes;
- short-lived credentials where possible;
- secrets stored outside Project Memory and normal logs;
- separate read/write grants;
- user-visible permission review and revocation;
- plugin sandbox/process isolation where appropriate;
- no automatic trust escalation from a plugin update;
- audit external side effects.

## 8. Marketplace and ecosystem

Plugin discovery/marketplace is part of the complete product scope, but should follow stable SDK contracts and a security review process. Do not build a marketplace UI before the plugin lifecycle, permission, compatibility, and update contracts are stable.

## 9. Acceptance criteria

- A new Agent Provider can be added without changing Project/Task domain semantics.
- A connector cannot bypass Policy/Approval by calling an external API directly.
- Plugin capability mismatch is surfaced.
- Webhook replay and duplicate delivery do not create duplicate Tasks or side effects.
- Users can inspect and revoke plugin access.

## 6. Local Agent Session Provider references

- [Codex App Server](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md): local JSON-RPC app-server with thread and turn lifecycle operations and notifications.
- [Claude Agent SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions): session IDs, resume/continue/fork.
- [OpenCode Server](https://opencode.ai/docs/server/): local session/message APIs and SSE event stream; event history/reconnect behavior must be reconciled.
- [Pi RPC](https://pi.dev/docs/latest/rpc): long-lived JSONL bidirectional command/response/event protocol.
- [Paseo architecture](https://github.com/getpaseo/paseo/blob/main/docs/architecture.md): local Daemon, WebSocket client protocol, multi-client subscriptions, and Provider adapters.

Provider API details are moving targets. Pin versions and test on real machines before implementation; a source reference is not proof that every capability works in our supported environment.
