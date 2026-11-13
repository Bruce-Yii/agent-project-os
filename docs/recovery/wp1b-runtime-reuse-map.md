# WP1-B Runtime Reuse Map (DRAFT — upstream facts UNVERIFIED)

**Owner:** W0-RECOVERY (research; no code changes yet)
**Date:** 2026-11-13
**Status:** UNVERIFIED upstream facts (web search unavailable). Paseo/ACP classified as Adapt/wrap per G2; adoption not yet proven.
**Source:** docs/22, docs/31, docs/18, docs/41; G2 assessment.

## 1. Paseo package facts

**Status: UNVERIFIED.** Must be confirmed by worker with network access.

| Field | Value | Confidence |
|---|---|---|
| Package name(s) | `@paseo/daemon` or similar subpath (exact name UNKNOWN) | UNKNOWN |
| Current stable version | v0.15.4 (per docs/31, 2026-11-12) — **re-verify** | INFERRED |
| Source repo | https://github.com/getpaseo/paseo | CONFIRMED (README lineage) |
| License (source) | Apache-2.0 (per docs/31) | INFERRED |
| License (npm metadata) | "Proprietary" — **GAP** (must resolve before reuse) | CONFIRMED (docs/31) |
| Transitive deps | UNKNOWN (incl. claude-agent-sdk proprietary?) | UNKNOWN |
| Maintenance | Active (permission-reason issue #6923 open) | INFERRED |

### License resolution path
1. Inspect the actual Paseo source repo LICENSE file (not npm metadata).
2. Check if npm tarball includes LICENSE; if missing, request upstream fix or vendor source with notice.
3. Audit transitive deps (especially `@anthropic-ai/claude-agent-sdk` — proprietary) for license compatibility with Apache-2.0 product.
4. If license remains unclear, fallback: implement thin native-Provider/ACP Daemon boundary (BUILD with documented obstacles).

## 2. ACP protocol facts

| Field | Value | Confidence |
|---|---|---|
| ACP v1 | Published, stable docs available | CONFIRMED (docs/31) |
| ACP v2 | Draft for review/testing (NOT stable) | CONFIRMED (docs/31) |
| Selected path | ACP v1 (per G2/PC-6) | CONFIRMED |
| License | UNKNOWN (must check ACP spec repo) | UNKNOWN |

## 3. Reuse decision

**G2 classification:** Adapt/wrap (Paseo subpackages behind LocalRuntimeNode/ProviderAdapter).
**Current verdict:** NOT YET PROVEN. WP1-B must produce actual create/attach/resume/stream/reconnect evidence.

| Option | Verdict | Rationale |
|---|---|---|
| DIRECT (wrap Paseo subpackages) | Candidate (preferred) | G2 recommends; reduces implementation risk |
| ADAPT (extract reviewed modules) | Fallback | If only subset is usable |
| EXTRACT (copy source) | Not yet justified | License/ownership gap |
| BUILD (thin native boundary) | Last resort | Only if Paseo incompatible; requires Coordinator BUILD exception |

## 4. Concrete runtime validation plan

Execute in an isolated harness (not product source). Each step must produce observed output.

| # | Step | Command / Action | Expected evidence |
|---|---|---|---|
| R1 | Install Paseo daemon subpackages | `npm install @paseo/daemon@<pinned>` (exact name TBD) | package.json + lockfile + version |
| R2 | Start daemon | `npx paseo-daemon` or programmatic start | PID + listening port |
| R3 | Create Session | API call with Provider identity | Session ID + native Provider session ref |
| R4 | Attach/resume | Re-attach to existing session | Same session, no duplicate |
| R5 | Structured message stream | Send message, receive tool/permission events | Event cursor + samples (secrets removed) |
| R6 | Reconnect + history reconciliation | Disconnect client, reconnect | Gap detection + reconciliation |
| R7 | Permission decision reason | Trigger permission request | Reason surfaced in event |
| R8 | Daemon restart | Kill daemon, restart | No duplicate Project OS Session; native resume vs reconstructed |
| R9 | Capability reporting | Query Provider capabilities | native/emulated/unsupported/unknown matrix |

## 5. Capability boundary matrix (to be filled by R1-R9)

| Capability | Status | Notes |
|---|---|---|
| Session create | TBD | |
| Native resume | TBD | |
| Structured message events | TBD | |
| Tool call events | TBD | |
| Permission events + reason | TBD (issue #6923) | |
| Reconnect + gap detection | TBD | |
| History reconciliation | TBD | |
| Daemon restart survival | TBD | |
| Provider capability reporting | TBD | |

## 6. WP1-B MRG readiness (8 criteria)

| # | Criterion | Status |
|---|---|---|
| 1 | User outcome, scope, non-scope, F-groups explicit | PARTIAL (docs/41 exists) |
| 2 | Module contract versioned & accepted (owned data, commands/events, API, invariants, errors, permissions, external effects) | DRAFT (PC-6 covers session/runtime) |
| 3 | P0 dependencies accepted or isolated behind tested port | PC-6 DRAFT; needs acceptance |
| 4 | Runtime/build baseline, package manager, test harness known | ADR-045 accepted (Node 26/pnpm/PG) |
| 5 | Owned dirs/files, branch/worktree, shared-file writer explicit | TBD (needs assignment) |
| 6 | Contract fixtures + acceptance tests incl. negative/recovery | NOT YET |
| 7 | Security, secret handling, licensing, side-effect approval explicit | Licensing GAP (Paseo npm "Proprietary") |
| 8 | Independent reviewer + stop/rollback conditions named | TBD |

**WP1-B may start isolated implementation only after its own MRG passes.** Personal-only scope. No waiting for WP1-A Gate 0.

## 7. Next actions

1. Assign a D1-WP1B worker to execute R1-R9 in an isolated worktree.
2. Resolve Paseo license gap (path §1).
3. Finalize PC-6 contract (docs/39) and submit for independent review.
4. Complete WP1-B MRG checklist (§6) before any code.
5. WP1-C integration waits for WP1-A + WP1-B Module Acceptance.
