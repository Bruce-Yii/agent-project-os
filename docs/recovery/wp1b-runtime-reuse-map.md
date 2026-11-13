# WP1-B — Agent Runtime & Session: Runtime Validation Plan and Reuse Implementation Map

**Scope:** WP1-B (Paseo/ACP), independent of WP1-A Gate 0. **Date:** 2026-11-13.
**Mode:** read-only research; no source, branch, or dependency changes. **Resolves:** G3-S2 (`docs/22` §6), P-015 / P-010–P-013 (`docs/14`).

**Labels:** **CONFIRMED** = stated by upstream docs, registry metadata, or GitHub API read during this task (URL given).
**INFERRED** = my conclusion from CONFIRMED facts. **UNKNOWN** = not established; must not be read as a pass.

> **Provenance warning (applies to §7).** The brief cites `docs/24 §7` / Notion `§14.4` for the 8 MRG criteria, but **neither exists in this worktree** (`docs/` stops at `22`; `docs/43`–`44` are QUARANTINE on PR2 @ `c7ed525`). The criteria below are **INFERRED** from `docs/22` §6 plus the ledger's finding that a prior "8/8 PASS" was invalid. Reconcile against the real `docs/24` before any MRG PASS claim.
>
> **Superseded file:** this path previously held a committed `DRAFT — upstream facts UNVERIFIED` (commit `4b0b51d`), absent from the working tree. This version replaces it with network-verified facts.

## 1. Paseo package facts

**Trap first: the bare npm name `paseo` is not this product.** `registry.npmjs.org/paseo` is an unrelated Next.js scaffold
(`wahyueskaking/holo`, ISC, v0.1.0, 2024-03-07). Pinning `paseo@latest` installs the wrong thing. **CONFIRMED**

| Fact | Value | Label |
|---|---|---|
| Package names | `@getpaseo/protocol`, `/client`, `/server`, `/cli`, `/relay`, `/plugin`, `/highlight` | CONFIRMED (scope search) |
| Current stable | **0.15.4** (all scoped packages in lockstep; published 2026-11-10) | CONFIRMED (`dist-tags.latest`) |
| Pre-release | `0.16.0-beta.2` on `dist-tags.beta` | CONFIRMED |
| Source repo | <https://github.com/getpaseo/paseo> (TS monorepo: `packages/{server,protocol,client,cli,app,desktop,relay}`) | CONFIRMED |
| Docs | <https://paseo.sh>; `docs/architecture.md` | CONFIRMED |
| License (actual) | **Apache-2.0** + custom preamble: "Third-party components … remain licensed under the licenses provided by their respective copyright holders. Except for those third-party components, Paseo is licensed under the Apache License, Version 2.0" | CONFIRMED (`LICENSE`, 11,708 B) |
| License (npm) | **Absent** — no `license` field in the latest `protocol`/`cli`/`server` manifests ⇒ npm UI renders "Proprietary" | CONFIRMED |
| License (GitHub) | `spdx_id: "NOASSERTION"` — caused by the non-standard preamble, **not** a proprietary grant | CONFIRMED |
| Maintenance | Active: `pushed_at` 2026-11-13; created 2025-10-13; 23,957 stars; 2,940 forks; **2,050 open issues**; pre-1.0 | CONFIRMED |
| `@getpaseo/server` weight | 1,276 files, **43.3 MB** unpacked; 40+ runtime deps incl. `@agentclientprotocol/sdk ^0.17.1`, `@modelcontextprotocol/sdk 1.29.0`, `@anthropic-ai/claude-agent-sdk 0.3.246`, `@opencode-ai/sdk 1.14.46`, `express`, `pino`, `esbuild`, and **`typescript` as a runtime dep** | CONFIRMED |
| Native/binary deps | `node-pty 1.2.0-beta.15`, `sherpa-onnx-node 1.12.28`, `@xterm/headless 6.1.0-beta.334`, `esbuild` | CONFIRMED (declared); their licenses **UNKNOWN** |

**Delta vs `docs/22`:** G2 recorded "v0.15.3, Apache-2.0"; stable is now **0.15.4** and the Apache-2.0 conclusion holds in
substance but **no package declares it machine-readably** (§6).

## 2. ACP protocol facts

| Fact | Value | Label |
|---|---|---|
| Official docs | <https://agentclientprotocol.com> (full index: `/llms.txt`) | CONFIRMED |
| v1 | **Stable/current.** Versioned tree `/protocol/v1/*`; `protocolVersion: 1` in `initialize` | CONFIRMED |
| v2 | **Draft.** Announced 2026-07-20: "v2 is a Draft … various pieces can, and will, change before stabilization"; gate behind version negotiation **and** feature flags; keep v1 | CONFIRMED |
| WP1-B choice | **Select ACP v1.** v2 must not appear in any WP1-B pass condition | INFERRED |
| License | **Apache-2.0** — `agentclientprotocol/agent-client-protocol`, 4,635 stars, `pushed_at` 2026-11-13 | CONFIRMED (GitHub API) |
| TS SDK | `@agentclientprotocol/sdk` **2.6.0**, Apache-2.0 | CONFIRMED |
| v1 session methods | `session/new`; `session/load` (replays full history via `session/update` before responding); `session/resume` (restores context, **MUST NOT** replay); `session/close` (idempotent, `-32002` = success); `session/cancel`; `session/prompt`; `session/update` | CONFIRMED |
| Capability gates | `agentCapabilities.loadSession`; `sessionCapabilities.{resume,close,additionalDirectories,systemPrompt}`. Clients **MUST NOT** call an unadvertised method | CONFIRMED |
| Sandbox claim | "The root set declares the session's scope. It confines shell commands **only when a sandbox enforces it**." | CONFIRMED |

**Correction to `docs/22` §4.1:** it attributes `session/new`/`session/resume`, streamed `session/update`, cancellation and
permission requests to "ACP v2". Those are **v1-stable**. v2's real deltas are post-turn updates, ID-patched
message/tool-call mutation, structured diffs, and `title`/`description`/`subject` on permission requests. **CONFIRMED** —
this *lowers* WP1-B risk: every surface we need is stable, not draft.

## 3. Reuse decision

**ADAPT** — wrap Paseo's published Daemon packages behind our own `LocalRuntimeNode` port; never direct-depend on Paseo's
Workspace/Agent domain, and do not BUILD a new agent harness.

The transport/supervision work is real and already done (WS daemon, timeline, provider lifecycle,
`agent_permission_request`/`_resolved`, PTYs in a detached worker that survives daemon restarts). But
`@getpaseo/server` is a 43 MB pre-1.0 monolith with `typescript` as a runtime dep and four native binaries, so it cannot be
adopted wholesale.

**Sub-path constraint (CONFIRMED):** imports must go through `@getpaseo/server/daemon-control`, `/configuration`, `/process`.
The architecture doc states the **root export loads daemon bootstrap eagerly even when a caller only needs a path or
process helper**, and that export tests guard these trees with tree-shaking disabled. **INFERRED:** our adapter must resolve
only those subpaths and carry an automated guard (checklist 7) — `import '@getpaseo/server'` silently drags in bootstrap.

**If we fell back to BUILD, the specific obstacles:**

1. **Three authorities over one Session.** Paseo's `AgentManager` is "the source of truth for agent state", persisted to
   `$PASEO_HOME/agents/{cwd}/{agent-id}.json`; ACP's `sessionId` is provider-owned; we need a third (our Run). `docs/22` §8.1
   forbids Paseo becoming canonical, so a bijection must be designed and proven, not assumed.
2. **No permission reason on the default path.** `agent_permission_request` carries no cause generally; #6923 **open** (P2,
   triaged), #3950 **open/unmerged**. The fix routes the reason through the existing `description` field with no protocol
   change (**CONFIRMED**), so a reason is readable when present — "absent" must be a first-class state, never fabricated.
3. **Trust boundary collision.** Paseo plugin backends are explicitly trusted/unsandboxed, so we adopt a Daemon whose
   extension surface we deliberately never enable.
4. **Version-gated provider visibility.** Non-legacy providers (anything but claude/codex/opencode) are hidden from clients
   sending no `appVersion` or one `< 0.1.45` (**CONFIRMED**, `docs/ad-hoc-daemon-testing.md` gotcha #1). **INFERRED:** an ACP
   provider is invisible to a naive client — a silent-failure mode that manufactures a false green.

## 4. Runtime validation plan (G3-S2)

Pin **exactly** `@getpaseo/cli@0.15.4` / `@getpaseo/server@0.15.4`; never a range. Use an isolated home so the real daemon on
6767 is untouched. **Every step must emit a committed artifact** — Spike S2 evidence was local and uncommitted, and *an
artifact not in the repo does not exist for MRG purposes*.

```powershell
npm i -g @getpaseo/cli@0.15.4
$env:PASEO_HOME = "D:\12412\tmp\wp1b-paseo-home"        # never ~/.paseo
$ev = "docs/recovery/evidence/wp1b"; New-Item -ItemType Directory -Force $ev
paseo daemon start
paseo daemon status --json | Tee-Object "$ev/V0-daemon-status.json"
paseo provider ls --json   | Tee-Object "$ev/V0-providers.json"
```

| # | Check | Command | Pass condition |
|---|---|---|---|
| V1 | **Create** | `paseo agent run --provider <acp> --cwd <tmp-repo> "reply with OK" --json` | One agent record: `id`, `status` reaching `idle` (`initializing→idle⇄running`), non-empty provider session handle. Capture ACP `session/new` `sessionId`. |
| V2 | **Attach (2nd client)** | Second shell, same `PASEO_HOME`: `paseo agent inspect <id> --json`; `paseo agent logs <id> --follow` | Same `id` and same rows seen concurrently; **no second agent created**. Proves multi-subscriber. |
| V3 | **Resume** | `paseo agent run --resume <id> "second prompt"` (or `session/resume`) | Same `sessionId` reused, **no replay**. Contrast `session/load`, which **must** replay before responding — record which the adapter chose. |
| V4 | **Stream / structured events** | `paseo agent logs <id> --json` over a turn that calls one tool | Ordered events, tool calls normalized to `ToolCallDetail`, monotonic timeline sequence, no gaps. Keep raw NDJSON. |
| V5 | **Reconnect + history reconciliation** | Drop the WS client mid-turn, resume after the turn, page the authoritative timeline | Live stream is immediacy only; `fetch_agent_timeline_request` is authoritative and catch-up is paged to completion. Final row set == authoritative fetch (the gap/dedup contract in `docs/timeline-sync.md`). |
| V6 | **Permission request + visible reason** | Force a prompt via a `permissions.ask` rule (no reason) **and** a `PreToolUse` hook that returns a reason | Two artifacts: (a) reason **absent** → we render an explicit "reason unavailable"; (b) hook's `permissionDecisionReason` arrives via `description` → shown. **Do not** pass this by displaying a tool name. |
| V7 | **Daemon restart** | `paseo daemon restart`; then `paseo agent ls --json`, `paseo agent inspect <id>` | Agent rehydrates from `$PASEO_HOME/agents/…`; PTYs survive (detached worker); provider session resumed *or* reported `closed`. `closed` is acceptable **only if detected**, never silently retried. |
| V8 | **No duplicate Session** | Reconnect twice and restart the daemon, asserting agent count | `agent ls` count stable; one `id` ⇒ exactly one provider session. Assert on counts, not on absence of an error log. |
| V9 | **Dependency/subpath audit** | `npm ls --all --json` on a scratch install, plus a runtime probe that loads **only** the intended subpaths | Memoized subpath list; proof bootstrap is not loaded (export-test-style guard); every transitive license identified (§6). |

**Cross-cutting capture:** V1–V8 also dump the raw WS frame log (`daemon.log` + client NDJSON tap) — frames outlive CLI
wording changes. Then write `$ev/wp1b-spike-report.md` (pass/fail per row + paths) and commit: remote reproducibility requires
artifacts in the repo, not on local disk.

**Stop condition (`docs/22` §6):** if coupling (V9) or authority divergence (V1/V3/V7) cannot be contained, switch to a thin
in-house daemon over native Provider SDKs/ACP. Do **not** write a new agent harness.

## 5. Capability boundary matrix

**Selected Provider for the spike:** Paseo's **Generic ACP provider** driving an ACP v1 agent (candidate
`@deepseek-ai/dsh-acp`, BSD-3-Clause) — license-clean, locally installable, and it exercises the ACP path we intend to own.
Claude is deliberately *not* first: it is where #6923 lives, so it would confound a provider bug with a runtime bug.

| Capability | Status | Evidence |
|---|---|---|
| Session create | **native** | `session/new` + `paseo agent run` |
| Attach / multi-client observe | **native** | WS multi-subscriber + `agent_stream` |
| Session resume | **native**, adapter-chosen semantics | `session/resume` (no replay) vs `session/load` (replay) — **record per run** |
| History replay | **native** | `session/load` streams `session/update` then responds |
| Streaming message/tool events | **native** | `agent_stream`, `ToolCallDetail` normalization |
| Permission request | **native** | `agent_permission_request` / `agent_permission_resolved` |
| Permission **decision reason** | **emulated / often absent** | Carrier is `description`; #6923 open ⇒ frequently missing. **Render "unavailable"** |
| Cancel / stop | **native** | `session/cancel`, `paseo agent stop` |
| Terminal streams | **native** | detached worker; binary frames survive daemon restart |
| Filesystem root confinement | **unsupported by default** | ACP confines shell **only when a sandbox enforces it** ⇒ **we own isolation** |
| Restart durability | **emulated (partial)** | Agent JSON rehydrates; **provider-session survivability UNKNOWN**; PTYs survive |
| Durable workflow / cross-provider handoff | **unsupported** | Out of Paseo and ACP scope (`docs/22` §4.1) |
| Plugin execution for untrusted code | **unsupported (our decision)** | Paseo plugin backend is trusted/unsandboxed |
| ACP v2 features | **unsupported (our decision)** | v2 Draft; gated out of WP1-B |
| Provider visible without `appVersion` | **unknown / actively hostile** | non-legacy providers hidden below `0.1.45` |
| Session identity ↔ our Run identity | **unknown** | no upstream mapping; bijection must be designed |

## 6. License resolution path for the "Proprietary" npm gap

This is a **metadata defect, not a licensing change**. Two machine signals are wrong with one root cause: the `LICENSE` file
prepends a third-party carve-out to stock Apache-2.0. npm shows "Proprietary" because no `package.json` declares `license`
(**CONFIRMED**); GitHub shows `NOASSERTION` because its classifier only matches verbatim Apache-2.0, while the file body **is**
Apache-2.0 §§1–9 plus appendix (**CONFIRMED**).

1. **Record primary evidence, not the aggregate signal.** Commit a copy of upstream `LICENSE` to
   `docs/recovery/evidence/wp1b/paseo-LICENSE-0.15.4.txt` with resolved git SHA + retrieval URL. Human review of the text
   outranks both automation verdicts.
2. **File the discrepancy upstream** (one issue: packages publish without `license`; GitHub classifies NOASSERTION) and log it
   in the ledger as an accepted known gap with an owner and re-check date. Do not block WP1-B on it.
3. **Treat Apache-2.0 obligations as live:** retain notices, ship `LICENSE`/`NOTICE` with distributed artifacts, mark modified
   files. Since we only wrap published packages, the practical duty is notice preservation in our third-party notices file.
4. **Resolve the transitive set separately** (blocking for V9, not for the decision): the carve-out means *each* third-party
   component carries its own license. `node-pty`, `sherpa-onnx-node`, `@xterm/headless`, `esbuild`,
   `@anthropic-ai/claude-agent-sdk` must each be identified before redistribution. **Currently UNKNOWN.**
5. **Never write "proprietary" or a bare "Apache-2.0".** Correct phrasing: "Apache-2.0 per repository LICENSE, with a
   third-party carve-out; npm metadata omits the license field."

## 7. WP1-B MRG readiness checklist

Criteria reconstructed (see provenance warning). Current status is **not** a pass — WP1-B has no committed runtime evidence.

| # | Criterion (reconstructed) | Status | Blocker / next action |
|---|---|---|---|
| 1 | Exact package set, version, license identified and pinned | **PARTIAL** | 0.15.4 + LICENSE text CONFIRMED; transitive licenses UNKNOWN (V9); npm metadata gap open (§6) |
| 2 | Interface/contract compatibility with `LocalRuntimeNode` established | **NOT MET** | No adapter contract written; subpath-only import rule unproven |
| 3 | Create / attach / resume proven with a real Provider | **NOT MET** | S2 evidence local+uncommitted; re-run as V1–V3 with committed artifacts |
| 4 | Structured event stream + reconnect/history reconciliation proven | **NOT MET** | V4/V5 unrun; test against `docs/timeline-sync.md` |
| 5 | Permission flow proven **with visible decision reason** | **NOT MET — highest risk** | V6 unrun; #6923 open / #3950 unmerged. Design for "reason often unavailable" |
| 6 | Daemon restart and no-duplicate-Session proven | **NOT MET** | V7/V8 unrun; provider-session survivability UNKNOWN |
| 7 | Exact subpath dependency tree audited; no eager bootstrap | **NOT MET** | V9 unrun; root export eagerly loads bootstrap (**CONFIRMED**); guard required |
| 8 | Adoption boundary recorded (what we never enable) + fallback priced | **PARTIAL** | Boundary in `docs/22` §4.1 and §3/§5 here; thin-daemon fallback named but not costed; ADR if boundary moves |

**Honest summary:** 2 of 8 partial, **0 of 8 passed**. The **ADAPT** decision is defensible — and *more* defensible than G2
recorded, because ACP v1 is stable rather than draft. The two genuine unknowns are permission-reason and restart durability.
WP1-A already had an "8/8 PASS" ruled invalid in the ledger; nothing here may be reported as MRG-passed until V1–V9 artifacts
are committed and remotely reproducible.

## Sources

- npm: `registry.npmjs.org/paseo`; `@getpaseo/{protocol,cli,server}/latest`; `/-/v1/search?text=@getpaseo`
- Paseo: <https://github.com/getpaseo/paseo> — `LICENSE`, `docs/architecture.md`, `docs/permissions.md`, `docs/ad-hoc-daemon-testing.md`; [#6923](https://github.com/getpaseo/paseo/issues/6923) open, [#3950](https://github.com/getpaseo/paseo/pull/3950) open/unmerged
- ACP: <https://agentclientprotocol.com/llms.txt>, `/protocol/v1/session-setup`, `/announcements/acp-v2-draft`, <https://github.com/agentclientprotocol/agent-client-protocol>
- Local: `docs/22` §4.1/§6/§7, `docs/14` P-015, `docs/18` §7–15, `docs/recovery/asset-adoption-ledger.md`
