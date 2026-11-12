# 23 — Local Development and Agent Operations

**Status:** PROPOSED (new; owns local development operations).  
**Snapshot:** 2026-11-12 (repository baseline v0.4 manifest; CI green runs `43118229261` / `43118233835`).  
**Authority:** This document owns local development operations for the Agent Project OS repository: environment, install, start, commands, directory structure, debugging, testing, troubleshooting, and recovery. It does not own product behavior, agent contracts, or the stage roadmap.

## 1. Purpose and scope

This document is the single owner of **local development and agent operations** for this repository. Its scope:

- Prerequisites and toolchain versions that are actually available today.
- Repository layout (current and proposed future).
- Clone / branch / verification steps.
- Environment variables and secret handling.
- Common commands (format, lint, typecheck, test, build) — declared honestly as not yet configured.
- Git workflow and worktree rules.
- Agent operating model summary, pointing to [17 — Agent Development Contract](17-agent-development-contract.md) for full rules.
- Testing strategy, CI, security/secrets, troubleshooting, recovery.
- Readiness for General Availability (RFG) status checklist.

Out of scope (owned elsewhere):

| Subject | Owner |
|---|---|
| Agent entry / contributor rules | `AGENTS.md` |
| Collaboration contract (responsibility, handoff, review) | [17 — Agent Development Contract](17-agent-development-contract.md) |
| Stage roadmap and parallel streams | [12 — Development Sequence](12-development-roadmap.md) |
| G-gates and preparation status | [19 — Pre-development Readiness](19-pre-development-readiness.md) |
| Open decisions / confirmed vs proposed | [14 — Open Decisions](14-open-decisions.md) |
| Technology candidates (not decisions) | [11 — Platform, Security, Reliability](11-platform-security-reliability.md), [12](12-development-roadmap.md) §6 |
| Domain model / functional scope | [00](00-product-charter.md), [01](01-functional-catalog.md), [02](02-domain-model.md) |

Status labels used here follow [14 — Open Decisions](14-open-decisions.md) §1: `CONFIRMED`, `PROPOSED`, `VALIDATION REQUIRED`, `REJECTED`. `IMPLEMENTED` may only be used after code exists and independent verification passes.

## 2. Prerequisites

Verified on the development host (2026-11-12):

| Tool | Required | Available | Notes |
|---|---|---|---|
| Node.js | 24.x (PROPOSED baseline) | 24.16.0 | Runtime for future code; exact framework not frozen (P-022). |
| Python | 3.12.x | 3.12.9 | Used for doc/tooling scripts; not yet a runtime dependency. |
| Git | 2.5x | 2.54.0 | Required for branches/worktrees. |
| PowerShell | 7.x | 7.6.6 | Windows-first operations; scripts under `scripts/` are PowerShell. |

Additional prerequisites expected later (VALIDATION REQUIRED):

- A database engine. PostgreSQL 17.11 is installed on this host at `D:\12412\PostgreSQL` and running as service `postgresql-x64-17` (verified 2026-11-12). Candidate for product storage: PostgreSQL (P-021, PROPOSED), with SQLite for local cache. Product storage choice remains PROPOSED/unfrozen; the host instance is a dev convenience, not a product decision.
- A desktop shell runtime. Candidate: Tauri or Electron (P-022, PROPOSED); not frozen.
- A durable workflow engine. Candidate: DBOS over PostgreSQL (P-014, PROPOSED).
- A local Agent runtime. Candidate: Paseo server subpaths + ACP (P-015, PROPOSED).

No production dependency may be added without an ADR (docs/17 §6, docs/14). Tech stack is **not frozen** (docs/12 §6, docs/14 P-008/P-021/P-022).

## 3. Repository layout

### 3.1 Current layout (CONFIRMED)

```text
agent-project-os/
├── AGENTS.md
├── README.md
├── STATUS.md
├── CHANGELOG.md
├── CHECKSUMS.sha256
├── manifest.json
├── .env.example
├── .github/
│   ├── workflows/ci.yml
│   ├── scripts/verify_checksums.py
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── 00-product-charter.md … 39-pc6-local-session-provider-runtime.md
│   ├── 23-local-development-and-agent-operations.md   (this file)
│   └── templates/   (ADR.md, module-contract.md, work-package.md)
└── .git/
```

There is **no `src/`, `tests/`, `scripts/`, or `packages/` yet**. Implementation has not started (STATUS.md). The repository is a documentation baseline. `.env.example`, CI (`.github/workflows/ci.yml`), and checksum verification scripts exist (YU-399).

### 3.2 Proposed future layout (PROPOSED, not yet created)

Created only after G3 engineering decomposition and an accepted ADR define module boundaries. Do not create these directories ad hoc.

| Path | Purpose | Status |
|---|---|---|
| `src/` | Application source, organized by module ownership (W1–W7) | PROPOSED |
| `packages/` | Shared libraries / SDK (plugin SDK, domain types) | PROPOSED |
| `tests/` | Unit, contract, integration, e2e suites | PROPOSED |
| `scripts/` | Dev/ops scripts (PowerShell + cross-platform) | PROPOSED |
| `docs/adr/` | Accepted ADRs (or keep in docs/) | PROPOSED |
| `deploy/` | Self-hosted deployment manifests | PROPOSED (G4/D2) |
| `.env.example` | Environment variable template (no secrets) | CONFIRMED (YU-399) |
| `.github/workflows/` | CI definitions | CONFIRMED (YU-399) |

Rule: one owner per shared contract/schema file during parallel work (docs/17 §3). Module boundaries come from G3, not from this document.

## 4. Getting started

### 4.1 Clone

```powershell
git clone https://github.com/Bruce-Yii/agent-project-os.git
cd agent-project-os
git checkout feat/yu-399-local-dev-foundation   # or the branch you were assigned
```

### 4.2 Verify baseline

```powershell
# Confirm clean tree
git status --short

# Verify checksums (SHA-256). Compare against CHECKSUMS.sha256.
Get-FileHash -Algorithm SHA256 AGENTS.md, README.md, STATUS.md, manifest.json
```

If a checksum mismatches, stop and reconcile before editing (see §12).

### 4.3 Read first

Per `AGENTS.md` and README reading order: `README.md` → `docs/00-product-charter.md` → `docs/01` → `docs/02` → module doc → `docs/14` → `docs/17`. This repo has no build step today; there is nothing to "start" beyond reading.

## 5. Environment variables

`.env.example` exists (CONFIRMED, YU-399) with names only and empty placeholder values; `.env` (and variants) is gitignored. Never commit secrets (docs/17 §6; AGENTS.md "Never place secrets"). The example currently exposes `DATABASE_URL`, provider keys, `GITHUB_TOKEN`, `PORT`, `LOG_LEVEL`, `NODE_ENV`.

Planned variable groups (PROPOSED, names subject to G3):

| Group | Example names | Owner |
|---|---|---|
| Database | `DATABASE_URL`, `DATABASE_POOL_SIZE` | Storage module |
| Auth/session | `SESSION_SECRET`, `JWT_SIGNING_KEY` | Identity module |
| Provider credentials | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (user-supplied) | Provider adapter |
| Runtime | `DAEMON_PORT`, `RUNTIME_NODE_ID` | Runtime module |
| Observability | `OTEL_EXPORTER_OTLP_ENDPOINT`, `LOG_LEVEL` | Platform module |
| External integrations | `GITHUB_TOKEN`, `NOTION_TOKEN` | Connector module |

Rules:

- `.env.example` is the only env file committed.
- Secrets come from the user's own secret store; never from the repo.
- Log redaction: never print token/key values (AGENTS.md).
- Provider credentials are user-supplied and billed to the user (C-014).

## 6. Common commands

**Honest status: no toolchain is configured yet.** This repository contains documentation only; there is no `package.json`, lint config, formatter, typechecker, or test runner. The commands below are **placeholders** to be wired when the technology stack is chosen (G3/G4). Do not run them as if they exist.

| Intent | Planned command (placeholder) | Status |
|---|---|---|
| Install dependencies | `pnpm install` (or chosen package manager) | NOT CONFIGURED |
| Format | `pnpm format` | NOT CONFIGURED |
| Lint | `pnpm lint` | NOT CONFIGURED |
| Typecheck | `pnpm typecheck` | NOT CONFIGURED |
| Unit tests | `pnpm test:unit` | NOT CONFIGURED |
| Contract tests | `pnpm test:contract` | NOT CONFIGURED |
| Integration tests | `pnpm test:integration` | NOT CONFIGURED |
| E2E tests | `pnpm test:e2e` | NOT CONFIGURED |
| Build | `pnpm build` | NOT CONFIGURED |
| Dev server | `pnpm dev` | NOT CONFIGURED |

When the stack is chosen, update this table with real commands and add a `package.json` (or equivalent) plus CI. Package manager choice is an open decision (VALIDATION REQUIRED); do not assume pnpm/npm/yarn.

Documentation-only checks that do work today:

```powershell
# Verify checksums
Get-FileHash -Algorithm SHA256 (Get-Content CHECKSUMS.sha256 | ForEach-Object { ($_ -split '\s+')[1] })

# Workspace health (DSH workspace, not this repo)
& 'D:\12412\dsh工作区\scripts\workspace\Test-DshWorkspace.ps1' -Detailed
```

## 7. Git workflow

Follows [17 — Agent Development Contract](17-agent-development-contract.md) §3 and `AGENTS.md` work discipline.

- **Branches:** one branch per workstream/task. Naming: `feat/<scope>`, `docs/<scope>`, `fix/<scope>`. Current branch: `feat/yu-399-local-dev-foundation`.
- **Worktrees:** one worktree per independent workstream; never share a mutable checkout between concurrent coding Agents. Use the managed worktree scripts (`New-DshWorktree.ps1`, `Get-DshWorktreeAudit.ps1`, `Remove-DshWorktree.ps1`) per the workspace AGENTS.md §8. Do not `git worktree add` directly inside the project.
- **No commits of secrets, `.env`, or generated artifacts** (node_modules, build outputs, `.venv`).
- **Shared contracts:** one owner per schema/interface file; changes require ADR + impact review (docs/17 §3–4).
- **Merge:** only after contract tests pass; integration owner verifies assembled system and real external state (docs/17 §4).
- **Do not** reset, stash, discard, force-push, or overwrite another worker's uncommitted changes.

## 8. Agent operating model

Concise summary; full rules in [17 — Agent Development Contract](17-agent-development-contract.md).

- **Recursive 3 layers:** product owner (goals/priority) → architecture/integration owner (contracts) → workstream owner (module) → subagents (bounded tasks). Subagent output is reviewed by the parent; an Agent's self-report is not acceptance (docs/19 §10).
- **Project Identity Lock:** independent Project Agent OS / AWRP Next; Linear P-YU-18; full 32 groups retained; Project durable center; Direct Agent Session + Coordinator first-class; human vs Agent separate; Agent completion ≠ acceptance; external systems own live facts; OSS free self-hosted; no new prod deps; AWRP not copied. Tech stack not frozen.
- **Task envelope (work package):** Goal, Scope/Non-scope, owning module and file boundaries, hard constraints, interfaces consumed/produced, data/state ownership, acceptance criteria, tests/verification commands, external side effects and approvals, dependencies and handoff format (docs/17 §2; template `docs/templates/work-package.md`).
- **Parent review:** every handoff must include summary, changed files, exact branch+commit SHA, tests run with observed output, acceptance criteria → evidence, external side effects + current external truth, known risks/incomplete items/next action (docs/17 §5).
- **Stop conditions (do not proceed without escalation):** scope widening without approval; changing a domain contract without ADR; touching another worker's files; adding production dependencies; claiming tests passed without running them; any secret handling ambiguity.

## 9. Testing strategy

Planned, not yet implemented. Gates align with docs/12 (Stage 0–7 acceptance) and docs/19 (G3–G5).

| Level | Scope | Gate |
|---|---|---|
| Unit | Pure logic, state machines, domain invariants | Per module PR |
| Contract | Shared domain/API/event/Provider contracts; schema compatibility | Before merge of contract changes |
| Integration | Cross-module flows; persistence; Outbox/Inbox; reconnect/replay | After integration (docs/17 §4) |
| E2E | Full user journeys (create Project → … → review → recover) | Stage acceptance (docs/12 §5) |
| Property/failure | Retries, idempotency, event gaps, partial failures, recovery | W6 quality stream (docs/12 §3) |

Rules:

- Contract tests must pass before merging module code; cross-module tests after integration (docs/17 §4).
- A green unit test is not proof of cross-module behavior (docs/12 §4).
- Tests must be deterministic; no network-dependent flakiness in unit/contract suites.
- External side effects must be verified by read-back, not assumed (docs/17 §6).

## 10. CI (GitHub Actions)

**Current state: CI workflow exists** (`.github/workflows/ci.yml`, added in YU-399) with five jobs: `markdown-lint`, `link-check` (lychee offline), `checksum-verify` (strict: missing entry or mismatch fails), `checksum-verify-negative` (proves the verifier detects corruption), and `secret-scan` (gitleaks). PR #2 (stacked on PR #1) runs completed successfully: push `43118229261` (all 5 jobs green) and pull_request `43118233835` (all 5 jobs green). PR #1 has no CI runs. RFG-5 (CI green with real runs) is now **satisfied for the PR branch**; RFG-7 (green on default branch) still requires merge to `main` (not authorized). **RFG remains PARTIAL** overall (criteria 1-6, 8-10 not done).

Local verification already performed (not CI evidence):

- `markdownlint-cli2` 0 errors / 42 files.
- `CHECKSUMS.sha256` 50/50 match, 0 problems.
- CI YAML parses with PyYAML.

Planned jobs (PROPOSED, to be added when code lands):

| Job | Trigger | Purpose |
|---|---|---|
| `lint` | PR + push | Format/lint/typecheck |
| `test-unit` | PR + push | Unit + contract tests |
| `test-integration` | PR (main) | Integration against ephemeral DB |
| `build` | PR + push | Build all packages/apps |
| `security` | PR + scheduled | Secret scan (gitleaks), dependency audit, license check |
| `docs` | PR | Checksum regeneration + link check |

Notes:

- RFG requires at least one green run of each job on the default branch before claiming readiness.
- Do not claim CI success without observing the actual run result (docs/17 §6).
- External CI runners must not receive secrets beyond scoped, short-lived tokens.

## 11. Security and secrets

- No secrets in repository, code, docs, logs, or artifacts (AGENTS.md; docs/17 §6).
- `.env.example` only; real `.env` gitignored.
- Secret scan: gitleaks (or equivalent) in CI `security` job (PROPOSED).
- License: exact open-source license not selected (C-010, Gate D0). Do not publish code under an assumed license. License/dependency audit required before first public code release (docs/12 Gate D0).
- Plugin trust: explicit scopes and isolation for untrusted plugins (P-020). Authorization enforced in code/runtime boundaries, not prompts (AGENTS.md).
- Provider credentials are user-supplied; inference/hosting costs are user-borne (C-014). Never imply these are free.
- External systems own live facts; store references and verified projections only (AGENTS.md).

## 12. Troubleshooting and recovery

| Symptom | Likely cause | Action |
|---|---|---|
| Checksum mismatch on a tracked file | File edited without regenerating `CHECKSUMS.sha256` | Recompute SHA-256 for changed files; update `CHECKSUMS.sha256`; record in CHANGELOG. Do not silently ignore. |
| Dirty tree / unexpected changes | Another worker's uncommitted work or stale state | `git status`; do not reset/stash/discard others' work; coordinate via handoff (docs/17 §5). |
| Stale baseline (docs older than STATUS) | Working from an old snapshot | `git fetch`; compare `STATUS.md` snapshot date; re-read owning docs. |
| Branch divergence / merge conflicts | Parallel workstreams | Integrate by stable interfaces; run contract tests before merge (docs/17 §4). |
| Worktree orphaned or dirty | Improper cleanup | Run `Get-DshWorktreeAudit.ps1`; remove with `Remove-DshWorktree.ps1` only when clean or with explicit `-Force`. |
| Missing toolchain (no package.json) | Expected — implementation not started | Do not invent commands; consult §6 and docs/12. |
| DB/Postgres unavailable | Resolved on this host (PG 17.11 running) | DBOS spike (YU-393) can use the existing instance; still track product storage choice as PROPOSED (P-021). |
| Secret detected in commit | Policy violation | Rotate the secret immediately; remove from history via approved process; add to gitleaks baseline; report. |

Recovery principles:

- Reconcile uncertain external outcomes before retrying (docs/17 §6; AGENTS.md).
- A Run handoff is not Task acceptance; review requires evidence (AGENTS.md).
- Provider-native sessions that cannot migrate must be reported accurately, with Context Handoff path (docs/12 Gate D5).

## 13. RFG (Readiness for General Availability) status

**Current: PARTIAL.** This repository is documentation-only; no code, tests, CI runs, or release artifacts exist. RFG cannot be `READY` until the gates below are evidenced.

| # | Criterion | Status | Evidence required |
|---|---|---|---|
| 1 | License selected and published (Gate D0) | NOT DONE | ADR + `LICENSE` file + dependency audit |
| 2 | Technology stack frozen via ADR | NOT DONE | ADR(s) for DB, shell, workflow engine (P-014/P-021/P-022) |
| 3 | G3 engineering decomposition complete | NOT STARTED | Module ownership map, contracts, Work Packages, DAG (docs/19 §7) |
| 4 | G4 staged release roadmap complete | NOT STARTED | Independently usable stage map (docs/19 §8) |
| 5 | G5 documentation handoff complete | NOT STARTED | Consistent package + manifest/changelog/checksums (docs/19 §9) |
| 6 | Code implementation begun | NOT STARTED | First Work Package with tests |
| 7 | CI green on default branch | PARTIAL | Real runs of all 5 jobs green on PR #2 branch (push `43118229261`, PR `43118233835`); default-branch green pending merge (not authorized) |
| 8 | Self-hosted install path (Gate D1) | NOT DONE | Documented install + one reviewed Work Package end-to-end |
| 9 | Backup/restore + export (Gate D5) | NOT DONE | Recovery drill evidence |
| 10 | Security review + threat model | PARTIAL | docs/11 §12 covers Session threat model; full review pending |

Honest assessment: documentation baseline v0.7 is solid for design, but **no implementation evidence exists**. Do not claim `READY`. Re-evaluate after G3–G5 and the first implementation Work Package lands.

## 14. Related docs

- [AGENTS.md](../AGENTS.md) — agent entry and work discipline.
- [README.md](../README.md) — reading order and status.
- [STATUS.md](../STATUS.md) — repository status.
- [00 — Product Charter](00-product-charter.md)
- [11 — Platform, Security, Reliability](11-platform-security-reliability.md)
- [12 — Development Sequence](12-development-roadmap.md)
- [14 — Open Decisions](14-open-decisions.md)
- [17 — Agent Development Contract](17-agent-development-contract.md)
- [18 — Local Agent Session Subsystem](18-local-agent-session-subsystem.md)
- [19 — Pre-development Readiness](19-pre-development-readiness.md)
- [20 — Design Baseline](20-design-baseline.md)
- [21 — Architecture Review](21-architecture-review.md)
- [22 — Mature-module Reuse Assessment](22-mature-module-reuse-assessment.md)
- Templates: [ADR](templates/ADR.md), [Module contract](templates/module-contract.md), [Work package](templates/work-package.md).

---

*This document owns local development operations. Update it when the toolchain, layout, commands, or readiness status changes; keep it consistent with AGENTS.md, docs/17, docs/12, and docs/19. Do not duplicate their contracts here—link to them.*
