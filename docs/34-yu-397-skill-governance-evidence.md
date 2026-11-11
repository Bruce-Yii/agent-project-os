# 34 — YU-397 Skill Governance — Evidence Report

**Status:** EVIDENCE NOTE (D1-F). Verification of portable Skill interchange and governance boundaries.  
**Issue:** YU-397 (G3-S5). **Owner:** W0 (integration) with D1-F verification input.  
**Date:** 2026-11-12.  
**Branch:** `feat/yu-399-local-dev-foundation`, base commit `ceaf05c2774a49f34f28447d5b5fb6dd4d603af2`.  
**Related:** [docs/08](08-knowledge-context-memory.md), [docs/10](10-plugins-integrations.md), [docs/06](06-review-delivery-governance.md), [docs/11](11-platform-security-reliability.md), [docs/14](14-open-decisions.md) (P-019), [docs/22](22-mature-module-reuse-assessment.md) §4.6, [docs/24](24-module-responsibility-and-dependency-dag.md) (F22, PC-5).

## 1. Executive conclusion

- **Adopt the Agent Skills `SKILL.md` directory format as the Project OS Skill *interchange* format.** It is small, client-neutral, Apache-2.0 licensed, and has a published specification plus a reference validator. The required `name`/`description` frontmatter, optional `scripts/` / `references/` / `assets/`, and progressive-disclosure loading model all fit the Project OS Context Pack and Skill delivery needs.
- **Keep Skill governance in Project OS.** The Agent Skills format defines *portable content and metadata only*. It does not define provenance, scope, versioning, evaluation, approval, rollback, or permissions. Project OS owns the Skill lifecycle: candidate → provenance/applicability → evaluation → user/authorized reviewer approval → versioned activation → monitoring/rollback.
- **`allowed-tools` is metadata, never an authorization boundary.** The specification labels it experimental. The Project OS Policy/Approval layer remains the sole authority for tool grants. A Skill cannot expand access, and safety is unchanged if an Agent ignores optional metadata.
- **Memory and Skill remain distinct.** Memory preserves facts, decisions, context, and history with provenance/supersession. Skill preserves reusable methods for a class of work. A Skill is a method input, not a fact store, state engine, or permission grant.
- **No production dependency was added to the product tree.** Validation used the upstream reference library through an ephemeral `uvx` invocation in `temp/`; no package manifest, lockfile, or product code changed.

## 2. Upstream facts (verified)

- Specification: <https://agentskills.io/specification> (authoritative format document).
- Source repository: <https://github.com/agentskills/agentskills> (Apache-2.0; governance under LF Projects).
- Governance document: <https://github.com/agentskills/agentskills/blob/main/GOVERNANCE.md> (hierarchical maintainer model; high bar for spec additions).
- Reference validator: `skills-ref` (Python), invoked as `skills-ref validate | read-properties | to-prompt`.
- Verified upstream commit: `83021e2be457a9b6679148719c1f6074f0ad975e` ("AAIF Donation: Add governance and maintainers", authored 2026-11-04 by Mahesh Murag / Anthropic).
- License: Apache-2.0 (verified from repository `LICENSE`).

Normative constraints reproduced from the specification and validator:

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | 1–64 chars; lowercase letters, digits, hyphens only; no leading/trailing hyphen; no consecutive hyphens (`--`); must match parent directory name (NFKC-normalized). |
| `description` | Yes | 1–1024 chars; non-empty; describes what and when. |
| `license` | No | License name or reference to bundled license file. |
| `compatibility` | No | 1–500 chars if present. |
| `metadata` | No | Map of string keys to string values. |
| `allowed-tools` | No | Space-separated pre-approved tool string. **Experimental.** |
| Unknown frontmatter keys | — | Rejected (`Unexpected fields`). |

Directory rules: a skill is a directory containing at minimum `SKILL.md` (uppercase preferred; lowercase `skill.md` accepted). Optional `scripts/`, `references/`, `assets/`; any additional files/directories are allowed. File references should be relative and one level deep from `SKILL.md`. Progressive disclosure: metadata (~100 tokens) at startup, full `SKILL.md` body (< 5000 tokens recommended, < 500 lines) on activation, resources on demand.

## 3. Environment and method

- Host: Windows. Tooling: `uv` 0.12.1; `uvx --from git+https://github.com/agentskills/agentskills#subdirectory=skills-ref skills-ref`.
- Test artifacts: `temp/2026-11-12-yu-397-skill-governance/cases/*` (local, not committed).
- Each case is a real directory with a real `SKILL.md`; validation was executed against the actual reference validator, not a reimplementation. Outputs captured in `temp/.../results.txt`.
- No product-tree files were modified; no dependency was installed into the product.

## 4. Tests performed

| # | Case | Input | Observed result |
|---|---|---|---|
| 01 | Valid minimal | `name` + `description` only | **PASS** — `Valid skill` |
| 02 | Valid full | All optional fields + `scripts/`, `references/`, `assets/` | **PASS** — `Valid skill` |
| 03 | Missing `SKILL.md` | Directory without `SKILL.md` | **FAIL as expected** — `Missing required file: SKILL.md` |
| 04 | Missing `name` | Frontmatter without `name` | **FAIL as expected** — `Missing required field in frontmatter: name` |
| 05 | Missing `description` | Frontmatter without `description` | **FAIL as expected** — `Missing required field in frontmatter: description` |
| 06 | Empty `description` | `description:` (empty) | **FAIL as expected** — `Field 'description' must be a non-empty string` |
| 07 | Uppercase name | `name: NameUpper` | **FAIL as expected** — `must be lowercase` |
| 08 | Leading hyphen | `name: -lead` | **FAIL as expected** — `cannot start or end with a hyphen` |
| 09 | Consecutive hyphens | `name: consec--name` | **FAIL as expected** — `cannot contain consecutive hyphens` |
| 10 | Invalid character | `name: bad_name` (underscore) | **FAIL as expected** — `invalid characters` |
| 11 | Name too long | 70-char name | **FAIL as expected** — `exceeds 64 character limit` |
| 12 | Directory/name mismatch | dir `wrong-dir`, name `right-name` | **FAIL as expected** — `must match skill name` |
| 13 | Unknown field | `foo: bar` in frontmatter | **FAIL as expected** — `Unexpected fields` |
| 14 | `compatibility` too long | 550 chars | **FAIL as expected** — `exceeds 500 character limit` |
| 15 | `description` too long | 1100 chars | **FAIL as expected** — `exceeds 1024 character limit` |
| 16 | Unclosed frontmatter | Missing closing `---` | **FAIL as expected** — `frontmatter not properly closed` |
| 17 | No frontmatter | Body without `---` | **FAIL as expected** — `must start with YAML frontmatter` |
| 18 | Unicode name | `name: 技能` | **PASS** — Unicode lowercase names accepted |
| 19 | NFKC normalization | Decomposed vs composed `café` | **PASS** — names match after NFKC normalization |
| 20 | Arbitrary extra files/dirs | Nested `foo/bar/x.txt` | **PASS** — any additional files/directories allowed |
| 21 | `allowed-tools` experimental | `allowed-tools: Bash(rm:*)` | **PASS** — accepted by validator, but see §6 |
| 22 | Lowercase filename | `skill.md` instead of `SKILL.md` | **PASS** — accepted |
| 23 | Import (read-properties) | Valid skill | **PASS** — JSON output with `name`, `description`, `license`, `metadata` |
| 24 | Export (to-prompt) | Valid skill | **PASS** — `<available_skills>` XML with name, description, location only |

Result: 24/24 cases behaved exactly as the specification requires; 2 valid skills (01, 02) plus 2 boundary-acceptance cases (18, 19, 20, 21, 22) pass; 12 invalid inputs are rejected with specific, actionable messages.

## 5. Path constraints, progressive disclosure, and import/export

- **Path/name coupling is enforced.** The skill directory name and `name` must match after NFKC normalization. This prevents import collisions and path-traversal ambiguity during Skill import; a Skill cannot claim a name that differs from its on-disk identity.
- **No path traversal or absolute-path rule exists in the format.** The specification relies on the client to confine Skill files to the Skill directory. Project OS must enforce its own sandbox/path boundary when importing or executing Skill `scripts/`. The format does not grant filesystem authority.
- **Progressive disclosure is validated structurally.** `to-prompt` emits only `name`, `description`, and `location` (case 24), matching the spec's ~100-token metadata tier. Body and resources are not inlined, so a Skill cannot force large context injection merely by being listed.
- **Import/export round-trip works.** `read-properties` (case 23) extracts the metadata map losslessly for the fields the Project OS importer needs (name, description, license, metadata). Body and resources remain files on disk and are referenced, not copied into canonical state.
- **Optional directories are conventions, not enforcement.** The validator accepts any extra files (case 20). Project OS may impose stricter packaging rules (e.g., executable bit, dependency declarations) during its own evaluation stage, but these are Project OS policy, not format requirements.

## 6. Provenance, scope, version, approval, and permission boundaries

The Agent Skills format provides none of these. The following mapping fixes the boundary between the format (interchange) and Project OS (governance):

| Concern | Agent Skills format provides | Project OS must provide |
|---|---|---|
| **Provenance** | Optional `metadata` key-value (author, version, etc.) as free text | Source type/ID/URL, author/actor, capture method, created/updated time, observed version, scope, confidence/verification status, user-confirmed vs Agent-proposed vs externally verified (per [docs/08](08-knowledge-context-memory.md) §3) |
| **Scope** | `compatibility` free-text environment note; `metadata` | Workspace/project/task/provider scope, applicability rules, provider compatibility matrix, resource grants |
| **Version** | None normative (free-text `metadata.version`) | Immutable versioned Skill record, supersedes/superseded-by, rollback target |
| **Approval** | None | User/authorized reviewer approval bound to exact artifact/version, policy version, audit record (per [docs/06](06-review-delivery-governance.md) §4) |
| **Permissions** | Experimental `allowed-tools` string only | Policy/Approval layer is sole authority; tool grants enforced in code/runtime, not in Skill metadata (per [docs/11](11-platform-security-reliability.md), [docs/24](24-module-responsibility-and-dependency-dag.md) PC-5) |

Key boundary findings:

1. **`allowed-tools` is not a security contract.** Case 21 shows the validator accepts `Bash(rm:*)` without any check. The specification itself labels the field experimental and notes support varies. Project OS must treat it as a *hint* for evaluation/UI only. A Skill containing `allowed-tools: Bash(rm:*)` must not cause any tool to become available unless Policy independently grants it.
2. **No sandbox is implied.** `scripts/` are executable code, but the format specifies no isolation, dependency, or signing requirement. Project OS must run Skill scripts under its own sandbox/permission boundary and must not execute unreviewed Skill scripts with ambient host privileges.
3. **No trust escalation from import.** Importing a Skill is a data operation, not an authority operation. Provenance and approval remain Project OS responsibilities; a Skill imported from an external source starts as an untrusted candidate.
4. **Scope cannot be inferred from the format.** A Skill's applicability to a Project/Task/Provider is a Project OS decision; the format carries no scope field.

## 7. Invalid, conflicting, and missing metadata handling

Observed behavior (cases 03–17) gives the Project OS importer a concrete, minimal validation baseline:

- **Missing required fields are hard errors.** `name` and `description` must both be present and non-empty (cases 04–06). An importer must reject and surface these before any Skill record is created.
- **Unknown fields are hard errors.** The validator rejects any frontmatter key outside the six allowed (case 13). This prevents a Skill from smuggling Project OS-specific or executable directives through extra metadata; Project OS-specific data belongs in Project OS's own Skill record, not in the interchange file.
- **Malformed YAML/structure is a hard error.** Missing opening/closing `---` (cases 16–17) and invalid YAML must fail parsing before validation. Importers must not attempt partial recovery.
- **Name constraints are strict and deterministic.** Uppercase, leading/trailing hyphen, consecutive hyphens, invalid characters, over-length, and directory mismatch all fail (cases 07–12). This gives a deterministic, low-ambiguity identity for Skill records.
- **Conflicting metadata (Project OS layer).** The format has no conflict-resolution semantics. If two imported Skills share a name, or if an imported Skill conflicts with an existing Project OS Skill version, resolution is a Project OS concern (supersession, rename, or rejection). The format's directory-name/name coupling (case 12) ensures at least the on-disk identity is unambiguous; semantic conflicts remain Project OS's responsibility.
- **NFKC normalization matters.** Case 19 shows composed/decomposed Unicode names collapse. Importers must normalize before deduplication to avoid duplicate Skill records for visually identical names.

## 8. Skill vs Memory boundary

This evidence reconfirms the standing boundary (docs/08 §5–§6, docs/19 §10, docs/22 §4.6):

| | Memory | Skill |
|---|---|---|
| Content | Facts, decisions, context, project history, high-value failures | Reusable methods, procedures, templates for a class of work |
| Lifetime | Durable, selectively curated; superseded when stale | Versioned; activated/rolled back as a method |
| Authority | Canonical fact state owned by Project OS; retrieval proposes, does not arbitrate | Influences how an Agent prepares/performs work; never creates authority |
| Permissions | Memory carries permission/visibility scope | Skill never grants tools or expands access |
| Promotion gate | Knowledge extraction gate (docs/08 §6) | Candidate from conversation/execution/review evidence → provenance → evaluation → approval → versioned activation → monitoring/rollback |

A Skill may reference Memory (e.g., a method that says "check the project's current decision record"), but it must not become the fact store, and Memory must not be treated as an executable method. Conflating the two would let a "method" silently overwrite facts or let a "fact" silently authorize actions.

## 9. Governance mapping (Project OS owns)

The Skill lifecycle remains Project OS-owned (per docs/22 §4.6 and G3-S5 pass condition):

1. **Candidate** from repeated workflows, user corrections, execution traces, or review outcomes (docs/08 §6).
2. **Provenance and applicability** — source, scope, provider compatibility, confidence.
3. **Evaluation** — structural validation (this report's cases 01–24 as the minimum bar) plus Project OS-specific checks (sandbox, dependencies, signing).
4. **Approval** — user/authorized reviewer, bound to exact artifact/version and policy version.
5. **Versioned activation** — immutable reference in Context Pack; rollback target retained.
6. **Monitoring and rollback** — usage, outcomes, revocation.

The Agent Skills format is used at steps 1 and 3 as the *interchange* representation and at delivery time as the portable payload. It is not used as the authority for steps 2, 4, 5, or 6.

## 10. Risks and limitations

- **Reference validator is a demonstration artifact, not a production SDK.** The upstream `AGENTS.md` states `skills-ref/` is not a general contribution surface and does not add format requirements. Project OS must not depend on it as a runtime dependency; if validation logic is needed in product code, it should be reimplemented or vendored under Project OS ownership with its own tests.
- **Spec is evolving.** Governance is under LF Projects with a high bar for additions; `allowed-tools` is experimental. Pin a spec commit/version and re-validate on upgrade.
- **No sandbox/signing in the format.** Project OS must supply these; do not assume a Skill is safe to execute because it validates.
- **Unicode name complexity.** NFKC normalization (case 19) must be applied consistently in importer, storage, and lookup to avoid duplicate or colliding Skill records.
- **Scope/applicability is unaddressed by the format.** Must be modeled in Project OS.

## 11. Evidence artifacts (local, not committed)

- `temp/2026-11-12-yu-397-skill-governance/cases/01..24/` — 24 Skill directories with `SKILL.md` (and `scripts/`, `references/`, `assets/` for case 02).
- `temp/2026-11-12-yu-397-skill-governance/results.txt` — captured validator output for all 24 cases.
- `temp/2026-11-12-yu-397-skill-governance/run-tests.ps1` — reproducible test driver.

## 12. Recommendation and next action

- **Adopt** Agent Skills `SKILL.md` as the Skill interchange format (confirms and operationalizes docs/22 §4.6 and P-019).
- **Do not** add `skills-ref` or any Agent Skills package as a product dependency. If import validation is needed in product code, implement a Project OS-owned validator mirroring §2/§4, with the §6/§7 boundaries enforced.
- **Next:** W0 to record an ADR if this evidence changes an architecture boundary; otherwise fold into F22 (Skills, Templates, and Reusable Methods) and PC-5 (Policy/Approval) scope notes. Update docs/14 P-019 only if its status changes from PROPOSED; this report alone does not freeze the selection.
