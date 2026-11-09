# 20 — Design Baseline, Asset Inventory, and Authority Map

**Status:** G0 complete on this PR branch; merge into `main` is pending.  
**Snapshot:** 2026-11-10  
**Purpose:** Record the existing design assets, their authority, the Notion-to-Git ownership map, and all material baseline discrepancies. This is an index and audit record; it does not replace the owning product, domain, or module documents.

## 1. G0 verdict

**G0: PASS on the working branch; PR #1 merge pending.**

The required inventory, authority map, Notion-to-Git traceability map, discrepancy register, and in-place/new-document plan are now recorded. No unresolved product-semantic contradiction blocks the next preparation gate. Architecture and technology questions that are intentionally still proposals remain in their owning documents and are G1/G2 inputs, not hidden G0 conflicts.

Until PR #1 is merged, the default `main` branch remains the pre-G0 baseline (v0.3). Do not describe the G0 changes as already present on `main`.

## 2. Authority model

The project uses layered authority. These sources are not interchangeable:

| Layer | Authority | Owns | Must not be used for |
|---|---|---|---|
| Product-owner intent | The user's explicit decisions; captured in the Notion project home and 00 product definition | Product purpose, confirmed scope, hard constraints, accepted trade-offs | Inferring approval from an AI proposal or an old discussion |
| Product semantics and rationale | Notion Agent Project OS project home + 00 product definition | Why the product exists, user intent, durable decisions, research rationale, historical evolution | Replacing versioned engineering contracts or live external facts |
| Engineering specification | GitHub `docs/00–18` | Versioned PRD projection, functional catalog, domain/module contracts, implementation constraints, source traceability | Overriding an explicit product-owner decision without reconciliation |
| Decision status | GitHub `docs/14-open-decisions.md`, grounded in the Notion decision record and explicit user confirmation | CONFIRMED / PROPOSED / VALIDATION REQUIRED / REJECTED / SUPERSEDED | Treating a proposal as accepted merely because it is documented |
| Preparation process | Notion 03 readiness page + GitHub `docs/19` | G0–G5 preparation gates | Replacing product implementation stages in `docs/12` |
| G0 inventory | GitHub `docs/20` and its Notion summary | Asset inventory, ownership map, snapshot, discrepancy register | Becoming a second PRD or a second domain contract |
| External live truth | The source system itself (GitHub, Linear, Provider APIs, etc.) | Actual commits, branches, PRs, CI, reviews, external records, provider capability at a pinned version | Treating cached Notion/GitHub prose as proof of current external state |
| Historical evidence | AWRP repository, old Linear Personal Project OS, DSH prototype, 2026-11-05 discussion archive | Lessons, design provenance, implementation/reference evidence | Current product authority or mandatory implementation dependency |

**Conflict rule:** If a GitHub engineering document conflicts with an explicit product-owner decision captured in the current Notion product definition, do not silently choose one. The user-confirmed intent wins for product semantics; update the owning GitHub specification and record material architecture changes through `docs/14` and an ADR where required. If an external live fact is involved, refresh the external source before deciding.

The Notion 00 page is the product-semantic record. GitHub `docs/00-product-charter.md` is the versioned engineering PRD that implementation contributors read. They have different responsibilities; neither should silently drift from the other.

## 3. Notion asset inventory

| Asset | Role and current authority | GitHub owner / relationship |
|---|---|---|
| [Agent Project OS project home](https://app.notion.com/p/40f1e795caee8168a56bdbede24ca2e5) | Project CURRENT, unique navigation, confirmed product direction, maintenance rules | Maps to the repository as a whole; not a duplicate engineering spec |
| [00 — Product definition and core principles](https://app.notion.com/p/40f1e795caee812cb4e6d122fea4d784) | Current product-semantic entry: why/who/what, user problem, product scope, confirmed principles, GO rationale | `docs/00-product-charter.md`, `docs/01-functional-catalog.md`, `docs/14-open-decisions.md` |
| [01 — System-wide architecture design](https://app.notion.com/p/40f1e795caee8100a6a9fa9a5de3437d) | Architecture design draft with module boundaries, six diagrams, domain/execution/knowledge/client topology, and Local Agent Session section; not a frozen implementation contract | `docs/02–11`, especially `docs/02`, `docs/05`, `docs/07`, `docs/08`, `docs/11`, and `docs/18` |
| [02 — Full discussion archive](https://app.notion.com/p/40f1e795caee81cab7a7cbe066a48e14) | Historical 2026-11-05 discussion, evolution, corrections, source ideas, and proposals | Provenance for `docs/00–18`; historical only, not current authority |
| [03 — Pre-development readiness](https://app.notion.com/p/4131e795caee8178945bd83a4eb0e433) | Current G0–G5 preparation plan and gate status | `docs/19-pre-development-readiness.md`; G0 result is `docs/20` |
| [Competitor-by-competitor research](https://app.notion.com/p/4131e795caee81078426e909a3eca156) | Research comparing our full product separately with each real product; preserves the no-composite-competitor rule | `docs/13-competitor-and-reuse-analysis.md`, `docs/16-source-traceability.md` |
| [Competition admission decision](https://app.notion.com/p/4131e795caee81c4b68cee030c7fe592) | Confirmed product decision: one-to-one full-product comparison, corresponding capability subsets, and natural Project-level synergy | `docs/13`, `docs/14`, `docs/16` |
| [Older Linear Control Plane CURRENT page](https://app.notion.com/p/3ee1e795caee8111839cc7553a24dddc) | Belongs to the earlier Linear Research→Execution Control Plane project (2026-10); useful historical operating-model evidence, not the current Agent Project OS architecture | Historical input to `docs/00`, `docs/03`, `docs/04`, `docs/16`, `docs/17` |

The 2026-11-05 archive is intentionally preserved. Do not rewrite it to match later decisions; record supersession in the current page or decision register.

## 4. GitHub repository baseline

### 4.1 Product documentation repository

- Repository: [Bruce-Yii/agent-project-os](https://github.com/Bruce-Yii/agent-project-os)
- Default branch: `main`
- `main` baseline at G0 start: `6cdb0477cd03131ec62872e24990a30c6a15979d` (2026-11-09 00:55:13 UTC)
- `main` inventory: 28 tracked files; documents `docs/00–18`, three templates, and repository metadata.
- `main` README / STATUS / CHANGELOG describe v0.3, but `manifest.json` still says v0.2. This metadata mismatch is corrected on the G0 PR branch.
- Product code is not implemented in this repository. No stack, schema, or deployment topology is frozen.

### 4.2 Existing preparation PR

- [PR #1 — define pre-development readiness](https://github.com/Bruce-Yii/agent-project-os/pull/1)
- Branch: `docs/pre-development-readiness-2026-11-10`
- Base: `main` at `6cdb0477`
- Original head before G0 work: `40cefdb168af54aaaf64b479753487fa7d9cc365`
- PR was Open + Draft and mergeable at inspection; no review or comment had been recorded.
- The PR originally added `docs/19` and aligned repository metadata to v0.4. G0 adds `docs/20` and updates the existing PR branch; it does not create another PR or merge anything.

### 4.3 Owning GitHub documents

| Document | Authority / responsibility |
|---|---|
| `README.md` | Repository entry, read order, product invariants, source links, contribution rules |
| `AGENTS.md` | Mandatory instructions for implementation contributors and Agents |
| `STATUS.md` | Current repository/documentation phase and gate status |
| `CHANGELOG.md` | Versioned documentation changes |
| `manifest.json` / `CHECKSUMS.sha256` | Tracked-file inventory and integrity record |
| `docs/00-product-charter.md` | Versioned engineering PRD and product charter |
| `docs/01-functional-catalog.md` | Complete 32-group functional scope |
| `docs/02-domain-model.md` | Proposed canonical objects, relations, and state ownership |
| `docs/03-project-and-work-management.md` | Project, Work Package, dependencies, lifecycle, Current State |
| `docs/04-human-agent-collaboration.md` | Accountability, executor, reviewer, direct/delegated/coordinated modes |
| `docs/05-execution-runtime.md` | Runtime, Provider, Assignment, Run, Session, Local Daemon, handoff |
| `docs/06-review-delivery-governance.md` | Artifact/evidence, Review, Approval, external truth, audit |
| `docs/07-orchestration-and-autonomy.md` | Coordinator, Scheduler, Workflow, Trigger, DSH translation, bounded autonomy |
| `docs/08-knowledge-context-memory.md` | Project knowledge, Memory, Context Pack, Skill boundaries |
| `docs/09-client-experience.md` | Desktop, Mobile, Web and client responsibilities |
| `docs/10-plugins-integrations.md` | Provider plugins, connectors, integration boundaries |
| `docs/11-platform-security-reliability.md` | Persistence, events, authorization, sync, security, operations, self-hosting |
| `docs/12-development-roadmap.md` | Product implementation dependency sequence; distinct from G0–G5 |
| `docs/13-competitor-and-reuse-analysis.md` | Competitor comparisons and reuse candidates |
| `docs/14-open-decisions.md` | Confirmed, proposed, validation-required, rejected and superseded decisions |
| `docs/15-glossary.md` | Canonical product terminology |
| `docs/16-source-traceability.md` | Source registry and capability-to-source provenance |
| `docs/17-agent-development-contract.md` | Multi-window/Agent work ownership, integration and review rules |
| `docs/18-local-agent-session-subsystem.md` | Desktop local Session product/runtime contract |
| `docs/19-pre-development-readiness.md` | G0–G5 preparation process |
| `docs/20-design-baseline.md` | This G0 asset inventory, authority map and discrepancy register |
| `docs/templates/ADR.md` | Architecture decision record template |
| `docs/templates/module-contract.md` | Module boundary and interface template |
| `docs/templates/work-package.md` | Bounded implementation task template |

## 5. Notion-to-Git ownership map

| Notion source | GitHub owning documents | Rule |
|---|---|---|
| Project home + 00 product definition | `docs/00`, `docs/01`, `docs/14` | Notion records user intent/rationale; GitHub carries the versioned engineering PRD and functional projection |
| 01 system architecture | `docs/02–11`, `docs/18` | Translate architecture into one owning module document; keep Notion diagrams as design rationale, not a competing schema |
| 02 discussion archive | Cross-cutting provenance, primarily `docs/00`, `docs/02`, `docs/05`, `docs/07`, `docs/08`, `docs/14`, `docs/16` | Historical evidence only; later confirmed decisions supersede old proposals |
| 03 readiness plan | `docs/19`, `docs/20` | Notion owns durable project knowledge and gate context; GitHub owns the versioned engineering handoff |
| Competitor research + admission decision | `docs/13`, `docs/14`, `docs/16` | Preserve one-complete-product-to-one-complete-product comparisons; do not aggregate partial competitors |
| Experience-to-Skill direction | `docs/01`, `docs/08`, `docs/14` | Skill is a supporting capability; Memory and Skill remain distinct; Skill never grants permission |

## 6. Historical and external reference inventory

| Asset | Verified snapshot | Contribution | Authority boundary |
|---|---|---|---|
| [AWRP repository](https://github.com/Bruce-Yii/agent-relay) | `main` at `082cde7f8a58d161db81e35a0d8a1d987ac44c76`; last commit observed 2026-09-24 | Reliable handoff, Task/Run identity, ACK/HANDOFF, event lineage, claims/fencing, fail-closed recovery | Historical implementation and protocol evidence; not the new product's runtime dependency |
| [DeepSeek DSH prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) | `main` at `8c32a9dc5d72c033816c6a8110b37f40cf94fba4`; initial research-prototype commit dated 2026-10-31 | Trigger/Eval/Mandate/Ticket/Assignment/Worker, Engine single-writer, Outbox, retry/recovery, Watchdog ideas | Architecture reference only; not a production platform or product boundary |
| [Linear Personal Project OS](https://linear.app/yi383775/project/personal-project-oslinear-notion-governance-a75ee24846a2) | Project `P-YU-3`, status In Progress, last updated 2026-10-01; issue query returned no issues | Real Project/Issue/Current State, waiting/review, long-return routing and cross-window recovery practices | Historical operating model. It is not an Agent Project OS execution queue; no new Linear project/issue was created for this G0 |
| Paseo / Paperclip / OpenHands / Superset / workflow engines | Tracked in `docs/13` and `docs/16` | Candidate products/modules for later G2 reuse assessment | No wholesale adoption or implementation commitment follows from being listed |

## 7. Discrepancy and correction register

| ID | Finding | Classification | Severity | G0 treatment / next action |
|---|---|---|---|---|
| G0-01 | Notion project home still stated GitHub v0.2, 28 files, HEAD `3a7d887`; actual `main` is v0.3 at `6cdb0477` | Stale snapshot | P2 | Update the Notion CURRENT row to distinguish current `main` from the unmerged PR branch |
| G0-02 | Notion architecture draft (2026-11-05) embeds the old GitHub v0.2 / 28-file snapshot | Stale embedded metadata | P2 | Preserve the historical design draft; this G0 report supersedes only its repository-status statement |
| G0-03 | `main/manifest.json` says v0.2 while README, STATUS and CHANGELOG say v0.3 | Repository metadata inconsistency | P2 | Corrected in the G0 PR branch; takes effect on `main` only after PR #1 merges |
| G0-04 | `docs/06` title says section 07 and `docs/07` title says section 06 | Document numbering defect | P3 | Corrected in the G0 PR branch; filenames and README order remain unchanged |
| G0-05 | `CHANGELOG.md` repeats the top-level `# Changelog` heading before v0.2 | Document formatting defect | P3 | Corrected in the G0 PR branch; historical entries retained |
| G0-06 | `docs/01` uses source key `N` for new-product synthesis, but `docs/16` did not define `N` in its source registry | Traceability defect | P2 | Added `N` to the source registry in the G0 PR branch; defined as product-owner-confirmed new-product synthesis, not an external source |
| G0-07 | Notion 00 and GitHub `docs/00` both appear as product-definition documents | Authority ambiguity resolved by scope | P1 | Notion 00 owns product semantics and user-confirmed intent; GitHub `docs/00` is the versioned engineering PRD. Reconcile on drift; do not treat them as independent competing decisions |
| G0-08 | A Notion page titled “CURRENT Project OS Architecture & Boundaries” belongs to the earlier Linear Research→Execution Control Plane project | Historical-reference collision risk | P2 | Explicitly classify as historical Linear operating-model evidence; do not use as the new product's current architecture |
| G0-09 | Linear `P-YU-3` remains In Progress although its current issue query is empty | Historical operational status | P3 | Do not mutate it or create a new Linear project during G0; it is not the new product's execution queue |
| G0-10 | PR #1 is still Draft; G0 documentation has not reached `main` | External publication state | P2 | Keep the PR Draft and do not merge automatically. Review/merge is a separate gate; `main` remains v0.3 until then |

No unresolved G0 finding changes the confirmed product scope or invalidates the design-stage GO decision. Architecture proposals and open technical questions remain explicitly marked in `docs/02–14` and are inputs to G1/G2, not grounds to silently freeze technology.

## 8. Existing documents to update vs. new documents

**Updated in place on the G0 PR branch**
- `README.md`, `STATUS.md`, `CHANGELOG.md`, `manifest.json`, `CHECKSUMS.sha256`;
- `docs/19-pre-development-readiness.md` to record G0 result;
- `docs/06` and `docs/07` heading numbers;
- `docs/16` source registry entry for `N`.

**New document**
- `docs/20-design-baseline.md` only. Its distinct responsibility is the G0 asset inventory, authority map, and discrepancy register; it does not create a second PRD or architecture hierarchy.

**Preserved without rewriting**
- Notion 02 historical discussion archive;
- Notion 01 architecture draft (the old repository snapshot is noted here, not erased);
- AWRP repository and its historical protocol;
- Linear Personal Project OS and its old execution records;
- DeepSeek DSH prototype;
- GitHub `docs/00–05`, `docs/08–15`, and `docs/17–18`, whose owning responsibilities remain unchanged.

## 9. G0 exit evidence and next gate

G0 exit evidence:
- all primary Notion product/design assets and relevant historical references inventoried;
- GitHub `main` and PR branch snapshots recorded by exact commit;
- every major product, domain, module, process, and source-traceability document has an identified owner;
- Notion-to-Git ownership map recorded;
- stale snapshots and repository/document inconsistencies classified;
- non-semantic documentation defects corrected in the existing PR branch;
- Notion CURRENT and readiness page updated to point to this baseline.

**Next gate: G2 — Mature-module Reuse Assessment.** G1 architecture review is complete; G2 now evaluates reusable implementations, licenses, maintenance, integration boundaries, and known failure modes. Do not start parallel implementation before the relevant G3 contracts and ownership gates pass.
