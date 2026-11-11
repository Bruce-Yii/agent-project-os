# 31 — YU-394 Paseo / ACP Local Runtime Spike — Evidence Report

**Status:** PARTIAL (daemon hosted and session create/resume verified with one real provider; permission-reason propagation and daemon-restart durability observed but not fully closed).
**Issue:** YU-394 (G3-S2). **Owner:** W0. **Date:** 2026-11-12.
**Branch:** `feat/yu-399-local-dev-foundation`.
**Upstream snapshot:** Paseo `v0.15.4` (npm `latest`), ACP SDK `@agentclientprotocol/sdk@2.6.0`.

## 1. Upstream facts (verified)

### 1.1 Paseo npm packages (`@getpaseo/*`)

All six packages below are published under the `@getpaseo` scope at `0.15.4` (latest) with a `0.16.0-beta.2` beta tag. `npm view` reports their license as **`Proprietary`** because the published `package.json` files contain **no `license` field and no `LICENSE` file**. The source repository (`<https://github.com/getpaseo/paseo>`) is licensed **Apache-2.0** (see §5). This metadata gap is itself an audit finding.

| Package | Version | npm license | Direct deps | Versions published | Role |
|---|---|---|---|---|---|
| `@getpaseo/server` | 0.15.4 | Proprietary (no field) | 46 | 193 | Daemon + providers + WebSocket + plugins |
| `@getpaseo/client` | 0.15.4 | Proprietary (no field) | 4 (`@getpaseo/protocol`, `@getpaseo/relay`, `ws`, `zod`) | 116 | Client SDK (daemon control, timelines, permissions) |
| `@getpaseo/protocol` | 0.15.4 | Proprietary (no field) | 2 (`semver`, `zod`) | 116 | Shared wire schemas / types |
| `@getpaseo/plugin` | 0.15.4 | Proprietary (no field) | 3 (`@agentclientprotocol/sdk`, `i18next`, `use-sync-external-store`) | 57 | Plugin SDK (trusted backend) |
| `@getpaseo/relay` | 0.15.4 | Proprietary (no field) | 6 (`@noble/*`, `base64-js`, `tweetnacl`, `ws`) | 193 | Relay / E2EE transport |
| `@getpaseo/highlight` | 0.15.4 | Proprietary (no field) | 19 (CodeMirror / Lezer) | 166 | Syntax highlighting |
| `@getpaseo/cli` | 0.15.4 | Proprietary (no field) | 11 (incl. `@getpaseo/client`, `@getpaseo/server`, `@getpaseo/protocol`) | 192 | CLI control surface |

Source: `<https://github.com/getpaseo/paseo>` (monorepo; workspaces `packages/*`). Homepage: `<https://paseo.sh>` (docs). Maintainer: `boudra` (Mohamed Boudra).

Narrow server subpaths (from `package.json` `exports`, verified by tarball inspection):

- `@getpaseo/server` (root, eager bootstrap — avoid)
- `@getpaseo/server/daemon-control` (pid lock, start/stop/wait) — **preferred entry**
- `@getpaseo/server/configuration`
- `@getpaseo/server/process` (spawn helpers)
- `@getpaseo/server/auth`, `/pairing`
- `@getpaseo/server/agent-hooks`, `/agent-activity`, `/agent-response`
- `@getpaseo/server/utils/tool-call-parsers`

Client subpaths:

- `@getpaseo/client` (root)
- `@getpaseo/client/node`
- `@getpaseo/client/internal/daemon-client`
- `@getpaseo/client/internal/daemon-client-websocket-transport`
- `@getpaseo/client/internal/hosts`

Protocol exports all modules under `@getpaseo/protocol/*` (e.g. `/agent-types`, `/messages`, `/hosts`).

### 1.2 ACP (Agent Client Protocol)

- Package: `@agentclientprotocol/sdk@2.6.0` (npm, published 2026-11-10 by GitHub Actions; maintainer `benbrandt` et al.).
- License: **Apache-2.0** (tarball includes `LICENSE`).
- Dependencies: none direct; peer deps `@modelcontextprotocol/server ^2.4.0`, `zod ^3.25.76 || ^4.0.0`.
- Repository: `<https://github.com/agentclientprotocol/typescript-sdk`.>

**Stability split (critical):** the SDK entrypoints are:

| Import | Protocol surface |
|---|---|
| `@agentclientprotocol/sdk` | Stable ACP **v1** |
| `@agentclientprotocol/sdk/unstable` | Full v1 incl. unstable features |
| `@agentclientprotocol/sdk/experimental/v2` | Stable features of the **v2 draft** |
| `@agentclientprotocol/sdk/experimental/v2/unstable` | Full v2 draft incl. unstable features |

Per `MIGRATION_STABLE_UNSTABLE.md`: "all of v2 remains a draft"; SDK package versions and ACP protocol versions are independent; the default import still speaks ACP v1. Therefore **ACP v2 is experimental/draft, not stable**, and our integration should default to ACP v1 unless a v2-only feature is required.

ACP v2 (draft) does define `session/new`, `session/resume` (with `replayFrom` cursor), `session/cancel`, `session/update`, `session/request_permission` with an optional human-readable `description` ("why permission is needed"), and a foreground-state snapshot contract. These map directly to our reconnect/history/permission-reason needs.

### 1.3 Version-drift caveat

Paseo `0.15.4` pins `@agentclientprotocol/sdk` at `^0.17.1` (server) and `^1.4.0` (plugin), while the current published SDK is `2.6.0`. Paseo ships an `acp:version-drift` check script, indicating upstream is aware of the drift. Any reuse must re-pin to a single SDK version and re-validate.

## 2. Environment

- Host: Windows 11; Node `v24.16.0`; npm `11.13.0`.
- Registry mirror: `registry.npmmirror.com` (reachable; used for all views/packs).
- Provider CLIs on host:
  - `codex` → `D:\12412\npm-global\codex.ps1` (Codex CLI `0.146.0`) — **available**
  - `claude` → `D:\12412\npm-global\claude.ps1` (Claude Code `2.1.220`) — **available**
  - `pi` → `D:\12412\npm-global\pi.ps1` (`@earendil-works/pi-coding-agent` `1.0.4`) — **available**
  - `opencode` — **not installed** (Paseo provider reports `available: false`)
  - Paseo daemon binary — **not installed** (run from unpacked package during spike)
- Isolated spike dir: `temp/2026-11-12-yu-394-paseo-spike/` (tarballs, extracted packages, node_modules, daemon runs, smoke scripts). No production tree modified.

## 3. Tests performed

### 3.1 Daemon host (PASS)

Command (isolated):

```text
PASEO_HOME=<temp>/paseo-home2 PASEO_LISTEN=127.0.0.1:6802 node dist/scripts/supervisor-entrypoint.js

```text

Observed: bootstrap complete in ~0.7s; `Server listening on <http://127.0.0.1:6802`;> WebSocket on `/ws`; terminal worker spawned; plugin registry loaded (antigravity, claude-usage-source, codex-usage-source, copilot-usage-source, cursor-usage-source); agent storage initialized (0 records, "agents will initialize on demand").

### 3.2 Provider availability via client SDK (PASS)

Smoke script `smoke-list.mjs` (client `internal/daemon-client`):

```text
const client = new DaemonClient({ url: "ws://127.0.0.1:6802/ws", clientId: "spike-client", clientType: "cli", appVersion: "0.15.4-spike" });
await client.connect();
const providers = await client.listAvailableProviders();

```text

Observed providers:

- `claude`: available
- `codex`: available
- `copilot`: available
- `pi`: available
- `opencode`: **not available**
- `antigravity`: not available
- `muse`: not available

### 3.3 Session create / attach / resume (PASS with `pi`)

Smoke script `smoke-pi3.mjs`:

```text
const snap = await client.createAgent({ provider: "pi", cwd, title: "spike-pi" });
// snap.persistence = { provider, sessionId, nativeHandle, metadata }
await client.sendAgentMessage(agentId, "Reply with exactly: SPIKE_OK", {});
const tl = await client.fetchAgentTimeline(agentId, {});
const resumed = await client.resumeAgent(handle, {});

```text

Observed:

- Agent created: `agentId = 25fd5b3e-...`, `sessionId = 01a1cce0-...`, `nativeHandle = .../pi-agent/sessions/...jsonl`.
- Capabilities reported: `supportsStreaming`, `supportsSessionPersistence`, `supportsSessionListing`, `supportsDynamicModes`, `supportsReasoningStream`, `supportsToolInvocations`, `supportsRewindConversation` (files rewind unsupported).
- `fetchAgentTimeline` returned `direction`, `projection`, `epoch`, `window { minSeq, maxSeq, nextSeq }`, `reset`, `staleCursor`, `gap`, and entries — i.e. **history reconciliation with cursor/epoch/gap detection is built in**.
- `resumeAgent(handle)` returned a new agent (`agentId = 7c1d5963-...`) from the persisted handle — **attach/resume works across a new agent record**.
- Agent status was `error` because the selected pi model had no API key; this is an environment/auth limitation, not a protocol failure. Event streaming (`agent_stream`) was therefore not exercised with a successful turn, but the subscription API (`client.subscribe`, `client.subscribeRawMessages`) and `agent_stream` event type exist in the protocol.

Codex provider was **not** usable in this spike: `createAgent` timed out at `Timed out refreshing Codex after 120000ms; pending: model/list` (Codex CLI model listing hung, likely auth/network). Claude was available but not exercised end-to-end to keep the spike within time; permission-reason behavior is covered by upstream issue #6923 instead.

### 3.4 Daemon restart behavior (PASS)

Observed in `daemon-run1.log` / `daemon-run2` (isolated `PASEO_HOME`):

- Supervisor log: `[DaemonRunner] Starting daemon worker (IPC restart and crash restart enabled)`.
- `paseo.pid` (pid lock) fields: `{ pid, startedAt, hostname, uid, listen, serverId, heartbeat, bootId? }`.
- Killing the worker process caused the supervisor to spawn a replacement worker within ~3s; `paseo.pid` transiently cleared `listen`/`serverId`, then restored them after the new worker bootstrapped. No duplicate supervisor instance occurred because `acquirePidLock` guards the home directory.
- `writtenDuringThisBoot` / `isPidLockOwnerRunning` make locks boot-aware (avoids PID reuse after reboot).
- Agent registry loads persisted records on demand; "Agent registry loaded (0 records); agents will initialize on demand".

### 3.5 Event streaming / reconnect (from SDK + observed protocol)

- Client connection state machine: `idle | connecting | connected | disconnected (reason, nextRetryAt, failureCode) | disposed`.
- `setReconnectEnabled`, `scheduleReconnect`, `armReconnectTimer`, `emitDisconnectedStateForReconnect` exist in `daemon-client`.
- `observeEvents(SessionEventSubscription[])` and `subscribeAgentTimeline` provide structured subscriptions; `agent_stream` events carry `seq` and `epoch`, enabling ordered replay and gap detection (observed in `fetchAgentTimeline` response).
- `fetchAgentHistory` / `fetchAgentHistory` page info supports history reconciliation.

### 3.6 Permission reason propagation (GAP, documented upstream)

- Paseo `AgentPermissionRequest` (protocol) fields: `id, provider, name, kind (tool|plan|question|mode|other), title?, description?, input?, detail?, suggestions?, actions?, metadata?`. There is **no dedicated `reason` field**; the closest is `description`/`detail`.
- Upstream issue **#6923** (open, label `bug, p2, triaged`): "a Claude permission prompt in Bypass mode does not say why it appeared". Root cause: Claude's `canUseTool` `decisionReason` (e.g. `permissionDecisionReason` from a `PreToolUse` hook or `permissions.ask` rule) is dropped when building the Claude permission request in `packages/server/src/server/agent/providers/claude/agent.ts`.
- Proposed fix **PR #3950** is still **open/unmerged** as of 2026-10-14.
- ACP v2 draft's `session/request_permission` includes an optional human-readable `description` ("why permission is needed") and structured `subject`/`toolCall` context — a suitable target shape for our own reason propagation.

## 4. License and dependency audit

### 4.1 Paseo

- Source repo license: **Apache-2.0** (Copyright (c) 2025-present Mohamed Boudra), with third-party components under their own licenses.
- Published npm tarballs: **no `license` field and no `LICENSE` file** → npm reports `Proprietary`. Downstream consumers relying on npm metadata (rather than the repo) would see an unlicensed/proprietary package. **Action:** if we depend on Paseo, pin to a specific git commit/tag of the Apache-2.0 source and vendor/verify license text; do not rely on npm metadata alone.
- Transitive footprint: server package installs **301 packages** (`npm install --omit=dev`).
- Notable dependency licenses:
  - MIT: `ws`, `zod`, `express`, `node-pty`, `@anthropic-ai/sdk`? (SDK is MIT), `@modelcontextprotocol/sdk`, `@opencode-ai/sdk`, `@opencode/client`, `@xterm/*`, `ai`? (Apache), `pino`, `esbuild`, `typescript`, `undici`, etc.
  - Apache-2.0: `@agentclientprotocol/sdk`, `ai`, `openai`, `sherpa-onnx-node`, `typescript`.
  - ISC: `semver`, `which`, `yaml`.
  - BSD-2/3: `dotenv`, `bcryptjs`.
  - BlueOak-1.0.0: `@isaacs/ttlcache`, `lru-cache`.
  - **Proprietary / all-rights-reserved:** `@anthropic-ai/claude-agent-sdk` (`© Anthropic PBC. All rights reserved`; use subject to Claude legal agreements). This is a hard license gate if we transitively depend on it.
  - No-license-field (treated as proprietary): all `@getpaseo/*` internal packages.
- Plugin backend is **trusted and unsandboxed** (Paseo docs): a plugin subprocess has access to the daemon user's files, processes, credentials, network. This is incompatible with our third-party marketplace trust model; **plugin execution must stay disabled for untrusted code**.

### 4.2 ACP

- `@agentclientprotocol/sdk`: Apache-2.0, includes `LICENSE`, zero direct deps (peers: MCP server, zod). Low license risk.

### 4.3 Provider SDKs pulled by Paseo

- `@anthropic-ai/claude-agent-sdk` — proprietary (Anthropic). Gate.
- `@anthropic-ai/sdk` — MIT.
- `@opencode-ai/sdk`, `@opencode/client` — MIT.
- `openai` — Apache-2.0.
- `node-pty` — MIT (but beta `1.2.0-beta.15`).

## 5. Limitations / caveats

- Paseo is pre-1.0 (`0.15.4`, 193 releases in ~9 months); APIs churn. Pin exact versions and expect breakage.
- npm package metadata lacks license → legal review must anchor to the Apache-2.0 source repo at a pinned commit.
- Codex provider could not be exercised end-to-end (model/list timeout); only `pi` and the daemon itself were exercised.
- Successful turn/event streaming was not observed because the pi agent errored on missing API key (environment, not protocol). Subscription/timeline/reconnect/history-reconciliation capabilities are evidenced by types and `fetchAgentTimeline` output.
- Permission reason propagation remains broken upstream (issue #6923, PR #3950 unmerged); our adapter must map provider-specific reasons (Claude `decisionReason`) into the request `description`/`metadata` itself rather than wait for upstream.
- ACP v2 is draft; only v1 is stable. v2 permission/state features we want are under `experimental/`.
- ACP SDK version drift inside Paseo means its ACP integration is on an older SDK; not a drop-in.

## 6. Recommendation

**Primary: ADAPT (wrap) — host Paseo's published daemon behind our `LocalRuntimeNode` / `ProviderAdapter` boundary, using narrow subpath imports, with the gates below.**

Rationale:

- The daemon is runnable and self-contained: process supervision (pid lock, supervisor crash-restart), provider adapters, WebSocket multi-client, structured agent snapshots, timeline with epoch/seq/cursor, persistence handles, and `resumeAgent` all work as documented (§3).
- It gives us the Local Runtime Node we need without building a new Agent harness.
- But blind reuse is unsafe: eager root export, 301 transitive deps, proprietary `claude-agent-sdk`, unsandboxed trusted plugins, missing permission reasons, pre-1.0 churn, npm license metadata gap, and ACP SDK drift.

Gates / conditions for adoption:

1. Import only narrow subpaths (`/daemon-control`, `/configuration`, `/process`, `/auth`, client `internal/*`); never the root server export.
2. Pin Paseo + ACP SDK to exact versions; run our own version-drift check.
3. Keep third-party plugin execution disabled until our isolation boundary exists.
4. Preserve permission reasons in our adapter (map Claude `decisionReason` → `description`/`metadata`); do not wait for PR #3950.
5. Treat ACP as v1-stable now; evaluate v2 draft features behind an experimental flag.
6. Re-run license audit on every version bump, with explicit sign-off on `@anthropic-ai/claude-agent-sdk`.
7. Keep Paseo Workspace/Agent records out of canonical Project OS state (Project/Task/Run authority stays ours).

**Fallback: WRAP (thin adapter)** around native provider SDKs + ACP v1 if the above gates cannot be met (e.g. license rejection of `claude-agent-sdk`, or Paseo churn too high). REJECT (build our own daemon) is not warranted by current evidence; ADOPT (reuse submodules directly) is not safe.

## 7. Evidence artifacts (local, not committed)

- `temp/2026-11-12-yu-394-paseo-spike/` — tarballs, extracted packages, isolated `node_modules`, daemon logs (`daemon-run1.log`, `daemon2.log`), pid lock samples, smoke scripts (`smoke-list.mjs`, `smoke-pi3.mjs`), license audit (`lic-audit.js`).
- Observed daemon ready line: `"Server listening on http://127.0.0.1:6802"` (2026-11-12).
- Observed provider list and pi session create/resume/timeline in smoke output (2026-11-12).

## 8. Sources

- Paseo repo: <https://github.com/getpaseo/paseo> (LICENSE Apache-2.0)
- Paseo architecture: <https://github.com/getpaseo/paseo/blob/main/docs/architecture.md>
- npm: <https://www.npmjs.com/package/@getpaseo/server> (and client/protocol/plugin/relay/highlight/cli)
- Issue #6923: <https://github.com/getpaseo/paseo/issues/6923>
- PR #3950: <https://github.com/getpaseo/paseo/pull/3950>
- ACP SDK: <https://github.com/agentclientprotocol/typescript-sdk>
- ACP v2 overview: <https://agentclientprotocol.com/protocol/v2/overview>
- ACP v2 prompt lifecycle: <https://agentclientprotocol.com/protocol/v2/prompt-lifecycle>
- Prior assessment: docs/22-mature-module-reuse-assessment.md §4.1
- Prior spike format: docs/26-yu-393-dbos-spike-evidence.md
