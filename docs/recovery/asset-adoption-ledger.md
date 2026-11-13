# Asset Adoption Ledger — W0-RECOVERY (2026-11-13)

**Branch:** `recovery/w0-agent-project-os-20261113` @ `8f2b50707fef30b47294ebbcd07fc17583abcb11` (base)
**Owner:** W0-RECOVERY (new local coordinator)
**Purpose:** Selective migration record. No blanket merge/cherry-pick. Each candidate judged ADOPT / ADAPT / QUARANTINE / REJECT / LINK-ONLY.
**Authority:** Notion 00–03 (product), Linear P-YU-18 / YU-392..YU-400 (execution), GitHub immutable SHAs/CI (source truth), upstream official sources (package/API/license).

## Source branches / SHAs referenced

| Label | Branch | Full SHA | State |
|---|---|---|---|
| PR1-G0G2 | `docs/pre-development-readiness-2026-11-10` | `8f2b50707fef30b47294ebbcd07fc17583abcb11` | Draft/Open/Unmerged (base of this branch) |
| PR2-G3 | `feat/yu-399-local-dev-foundation` | `c7ed525ce9b2a7c9cbb270078045a51eedd4524f` | Draft/Open/Unmerged |
| WP1A | `feat/wp1a-personal-project-foundation` | `b6b828af66b239e3a827b962bfa5d5b83b61ff61` | Draft/Open/Unmerged, Gate 0 REJECTED |
| main | `main` | `6cdb0477cd03131ec62872e24990a30c6a15979d` | default |

## Ledger entries

### A. Retain as base (already present at PR1-G0G2 head)

| # | Asset | Source | Path | Verdict | Rationale |
|---|---|---|---|---|---|
| A1 | G0 design baseline (docs/19) | PR1-G0G2 @ 8f2b507 | `docs/19-pre-development-readiness.md` | ADOPT | Reviewed G0 baseline; product direction sound |
| A2 | Design baseline mapping (docs/20) | PR1-G0G2 @ 8f2b507 | `docs/20-design-baseline.md` | ADOPT | Authority mapping valid |
| A3 | Architecture review (docs/21) | PR1-G0G2 @ 8f2b507 | `docs/21-architecture-review.md` | ADOPT | Architecture complete enough |
| A4 | Mature-module reuse assessment (docs/22) | PR1-G0G2 @ 8f2b507 | `docs/22-mature-module-reuse-assessment.md` | ADOPT | G2 candidate matrix valid as research |
| A5 | Product charter (docs/00) | PR1-G0G2 @ 8f2b507 | `docs/00-product-charter.md` | ADOPT | Product authority (Notion 00–03 mirrored) |
| A6 | Functional catalog (docs/01, 32 groups) | PR1-G0G2 @ 8f2b507 | `docs/01-functional-catalog.md` | ADOPT | Full scope preserved |
| A7 | Domain model (docs/02) | PR1-G0G2 @ 8f2b507 | `docs/02-domain-model.md` | ADOPT | Core domain semantics |
| A8 | Project/work mgmt (docs/03) | PR1-G0G2 @ 8f2b507 | `docs/03-project-and-work-management.md` | ADOPT | |
| A9 | Open decisions (docs/14) | PR1-G0G2 @ 8f2b507 | `docs/14-open-decisions.md` | ADOPT | Track confirmed/proposed |
| A10 | Agent dev contract (docs/17) | PR1-G0G2 @ 8f2b507 | `docs/17-agent-development-contract.md` | ADOPT | |
| A11 | Local Agent Session (docs/18) | PR1-G0G2 @ 8f2b507 | `docs/18-local-agent-session-subsystem.md` | ADOPT | |
| A12 | AGENTS.md (root) | PR1-G0G2 @ 8f2b507 | `AGENTS.md` | ADOPT | Identity lock |
| A13 | LICENSE (Apache-2.0) | PR1-G0G2 @ 8f2b507 | `LICENSE` | ADOPT | ADR-045 accepted |
| A14 | ADR-045 tech stack | PR1-G0G2 @ 8f2b507 | `docs/45-technology-architecture-adr.md` | ADOPT | Node 26/pnpm/PG/Fastify/Drizzle |
| A15 | docs/46 acceptance contract | PR1-G0G2 @ 8f2b507 | `docs/46-acceptance-and-remote-evidence-contract.md` | ADOPT | Remote-first evidence rules |

### B. Adopt from PR2 (selective paths/sections, not blanket merge)

| # | Asset | Source | Path (PR2) | Verdict | Migration plan |
|---|---|---|---|---|---|
| B1 | Local dev ops (docs/23) | PR2 @ c7ed525 | `docs/23-local-development-and-agent-operations.md` | ADAPT | Import from PR2 head; verify CI counts; re-link |
| B2 | Module responsibility DAG (docs/24) | PR2 @ c7ed525 | `docs/24-module-responsibility-and-dependency-dag.md` | ADAPT | Import; verify cycle fixes |
| B3 | PC-1..PC-6 contracts (docs/27-39) | PR2 @ c7ed525 | `docs/27-pc1-*.md` .. `docs/39-pc6-*.md` | ADAPT | Import as DRAFT-labeled; pending acceptance |
| B4 | WP1-B contract (docs/41) | PR2 @ c7ed525 | `docs/41-wp1b-local-agent-session-foundation.md` | ADAPT | Import for WP1-B independent track |
| B5 | WP1-C contract (docs/42) | PR2 @ c7ed525 | `docs/42-wp1c-execution-integration.md` | ADAPT | Import; WP1-C waits for A+B |
| B6 | WP1-A module contract (docs/43) | PR2 @ c7ed525 | `docs/43-wp1a-module-contract.md` | QUARANTINE | MRG status contradictory; re-verify before adopt |
| B7 | WP1-A MRG review (docs/44) | PR2 @ c7ed525 | `docs/44-wp1a-mrg-review.md` | QUARANTINE | "8/8 PASS" not valid Module Acceptance |
| B8 | CI workflow | PR2 @ c7ed525 | `.github/workflows/ci.yml` | ADAPT | Import; verify jobs actually run |
| B9 | Bootstrap scripts | PR2 @ c7ed525 | `scripts/` | ADAPT | Import useful ones; audit |
| B10 | Fixtures/tests harness | PR2 @ c7ed525 | `fixtures/`, `tests/` | QUARANTINE | Loose substring harness; review assertions |

### C. WP1-A source candidates (read-only inspection; no wholesale import)

| # | Asset | Source | Path | Verdict | Rationale |
|---|---|---|---|---|---|
| C1 | Domain types / state guards | WP1A @ b6b828a | `src/` (domain) | ADAPT | Correct business semantics; audit per module |
| C2 | Repositories (Project/Task) | WP1A @ b6b828a | `src/persistence/` | ADAPT | CAS/version needs verification |
| C3 | Migrations | WP1A @ b6b828a | migrations | ADAPT | Single-connection A3 needs check |
| C4 | Command executor | WP1A @ b6b828a | `src/commands/` | ADAPT | Idempotency now DB-backed (verify) |
| C5 | `src/test-guard.ts` (prefix/nonce guard) | WP1A @ b6b828a | `src/test-guard.ts` | REJECT | Prefix/optional-nonce does not prove disposable ownership; Gate 0 REJECTED |
| C6 | `src/commands/contract.test.ts` (7 unguarded DROP CASCADE) | WP1A @ b6b828a | `src/commands/contract.test.ts` | REJECT | Destructive entry omitted from test list; unsafe |
| C7 | `src/persistence/migrate.test.ts` (ADMIN_URL + DROP DB FORCE) | WP1A @ b6b828a | `src/persistence/migrate.test.ts` | REJECT | Admin deletion path unproven |
| C8 | DB-backed idempotency tables (migration 0002) | WP1A @ b6b828a | migrations | ADAPT | Verify transactional durability |

### D. Link-only evidence (do not pollute active instructions)

| # | Asset | Source | Path | Verdict | Rationale |
|---|---|---|---|---|---|
| D1 | Retrospective docs/47 | PR2 @ c7ed525 | `docs/47-*.md` | LINK-ONLY | Historical evidence; keep link |
| D2 | Retrospective docs/48 | PR2 @ c7ed525 | `docs/48-*.md` | LINK-ONLY | Historical evidence; keep link |
| D3 | DBOS spike (docs/26,30) | PR2 @ c7ed525 | `docs/26-*.md`, `docs/30-*.md` | LINK-ONLY | Research evidence |
| D4 | Paseo spike (docs/31) | PR2 @ c7ed525 | `docs/31-*.md` | LINK-ONLY | Research evidence |
| D5 | Activepieces spike (docs/32) | PR2 @ c7ed525 | `docs/32-*.md` | LINK-ONLY | Research evidence |
| D6 | PowerSync spike (docs/33) | PR2 @ c7ed525 | `docs/33-*.md` | LINK-ONLY | Research evidence |
| D7 | Skills spike (docs/34) | PR2 @ c7ed525 | `docs/34-*.md` | LINK-ONLY | Research evidence |
| D8 | Benchmark (docs/35,25) | PR2 @ c7ed525 | `docs/25-*.md`, `docs/35-*.md` | LINK-ONLY | Research evidence |

### E. Quarantined (re-verify before use)

| # | Asset | Source | Path | Verdict | Rationale |
|---|---|---|---|---|---|
| E1 | docs/40 WP1-A (contradictory MRG) | PR2 @ c7ed525 | `docs/40-wp1a-*.md` | QUARANTINE | DRAFT vs MRG PASS contradiction |
| E2 | docs/29 work package (MRG not passed) | PR2 @ c7ed525 | `docs/29-first-implementation-work-package.md` | QUARANTINE | Stale MRG status |
| E3 | Node test runner vs Vitest mismatch | PR2 @ c7ed525 | various | QUARANTINE | ADR-045 says Vitest; code uses node:test |
| E4 | License/stack 'undecided' prose | PR2 @ c7ed525 | SECURITY.md, project.json | QUARANTINE | Stale vs ADR-045 |
| E5 | Obsolete fixture harness | PR2 @ c7ed525 | `tests/wp1a/` | QUARANTINE | Substring assertions |

## Migration Gate status

- [x] New base buildable/testable for what it contains (G0-G2 docs only; no code yet)
- [x] Provenance ledger complete for adopted paths (this file)
- [x] No inherited PASS claims (Gate 0 REJECTED preserved)
- [x] No destructive default test in base
- [ ] CI accurately identifies tests not yet run (base has docs CI only; WP1-A CI pending migration)
- [ ] WP1-A safety redesign (separate track, in progress)

## Notes

- This ledger is the single migration record. Avoid a mountain of supplementary documents.
- Old PR #1, PR #2, and old WP1-A branch remain unmodified.
- New Draft PR will be created stacked against PR #1's branch after first commit.
