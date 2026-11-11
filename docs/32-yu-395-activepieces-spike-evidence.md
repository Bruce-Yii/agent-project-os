# 32 — YU-395 Activepieces GitHub Connector Spike — Evidence Report

**Status:** PARTIAL (source, license, dependency, capability, and design evidence collected; no real GitHub OAuth, API writes, or production dependency added).  
**Issue:** YU-395 (G3-S3). **Owner:** W0 (spike executor: D1-D).  
**Date:** 2026-11-12.  
**Decision boundary:** This note resolves the G3-S3 validation gate. It does not freeze a dependency or add code to the product tree.

## 1. Executive summary

- Upstream is `@activepieces/piece-github@0.11.1`, published 2026-11-04 from Activepieces monorepo commit `b98b12324ea7ee0dc170362c0116156d31d84157` (monorepo version 0.93.0).
- The piece is **not** under `packages/ee/`, so it falls under the repository's MIT Expat boundary. The published npm metadata has no `license` field (known issue #16544), so the root repository license and path must be recorded instead of trusting a package scanner.
- The published artifact is a **self-contained bundle** (`dependencies: {}`): 877,926 bytes of `src/index.js` plus i18n. Source dependencies are `@activepieces/pieces-common`, `@activepieces/pieces-framework`, `@activepieces/core-piece-types`, `@activepieces/core-utils`, `jsonwebtoken@9.0.1`, and `yaml@2.9.0`.
- The piece exposes 95 named actions: 26 `READ`, 27 `SEARCH`, 38 `WRITE`, 4 `DESTRUCTIVE`, plus webhook triggers for repository events.
- The GitHub REST calls are plain `httpClient.sendRequest` calls with no retry, rate-limit, or webhook-signature/dedup logic in the piece. Those concerns must be supplied by our adapter.
- Recommendation: **Adapt / wrap selected pure GitHub API and auth code behind our Service Connector contract**; **borrow the interface design** (action classification, props, output schemas, auth variants, trigger registration flow) rather than importing Activepieces runtime/framework or adopting the full piece/engine.

## 2. Upstream facts (verified)

| Field | Value | Evidence |
|---|---|---|
| Package | `@activepieces/piece-github` | `npm view` |
| Version tested | 0.11.1 (latest at 2026-11-04) | `npm view ... dist-tags.latest` |
| Published | 2026-11-04T13:15:44Z | npm metadata |
| gitHead / pinned commit | `b98b12324ea7ee0dc170362c0116156d31d84157` | npm metadata `gitHead`; GitHub commit resolves to "New Crowdin updates (#17210)" |
| Monorepo | `activepieces/activepieces` | GitHub |
| Monorepo version | 0.93.0 | root `package.json` |
| Source path | `packages/pieces/community/github` | GitHub Contents API |
| Root license | MIT Expat outside `packages/ee/` and `packages/server/api/src/app/ee`; EE paths separate | root `LICENSE` |
| Published npm `license` field | `undefined` | `npm view @activepieces/piece-github@0.11.1 license` (issue #16544) |
| Tarball shasum | `bd1b115f556e080414179b212db9c4a2eae13f29` | `npm pack` output |
| Tarball size | 288.7 kB packed / 1.2 MB unpacked | `npm pack` output |
| Main entry (source) | `./dist/src/index.js` | upstream `package.json` |
| Main entry (published) | `./src/index.js` | published `package.json` |
| Authors | `kishanprmr`, `MoShizzle`, `AbdulTheActivePiecer`, `khaledmashaly`, `abuaboud`, `tintinthedev`, `murex971`, `sanket-a11y` | bundle (`authors` array) |

## 3. Environment

- Host: Windows; Node 24.16.0; npm 11.13.0.
- Spike directory: `temp/2026-11-12-yu-395-activepieces-spike/` (disposable; not part of product).
- Package downloaded with `npm pack @activepieces/piece-github@0.11.1` and extracted; source inspected via GitHub raw API at the pinned commit.
- No repository code, product dependencies, or canonical state were modified. No GitHub OAuth flow, API write, or webhook registration was executed.

## 4. Source structure and dependencies

### 4.1 Source tree

```text
packages/pieces/community/github/src/
  index.ts
  lib/
    auth.ts
    common/
      index.ts
      auth-helpers.ts
    actions/
      *.ts                 (human-facing actions)
      ai/*.ts              (agent-facing actions)
    output-schemas.ts
    trigger/
      index.ts
      new-*.ts
      register-trigger.ts
```

### 4.2 Source dependencies

From upstream `package.json`:

```json
{
  "@activepieces/pieces-common": "workspace:*",
  "@activepieces/pieces-framework": "workspace:*",
  "jsonwebtoken": "9.0.1",
  "yaml": "2.9.0",
  "@activepieces/core-piece-types": "workspace:*",
  "@activepieces/core-utils": "workspace:*"
}
```

Dev dependencies: `@types/jsonwebtoken@9.0.10`, `tslib@2.6.2`, `vitest@5.0.5`.

### 4.3 Published dependency reality

The published npm package declares `dependencies: {}`. Activepieces builds each piece as a self-contained bundle that inlines workspace libraries and third-party dependencies. Consequences:

- A scanner sees no production dependencies, which is misleading.
- Vendoring the published bundle would import Activepieces framework code and an opaque minified runtime.
- The correct reuse unit is the **TypeScript source** at the pinned commit, with framework imports replaced by our adapter.

### 4.4 Transitive license audit

| Library | Version | License | Role in piece |
|---|---|---|---|
| `@activepieces/pieces-*`, `core-*` | workspace | MIT (Activepieces root boundary) | Framework/HTTP/auth scaffolding; **do not import** in product |
| `jsonwebtoken` | 9.0.1 | MIT | GitHub App JWT signing |
| `jws` | 3.2.x | MIT | jsonwebtoken transitive |
| `jwa` | 2.0.x | MIT | jsonwebtoken transitive |
| `lodash` | 4.17.x | MIT | jsonwebtoken transitive |
| `ms` | 2.1.x | MIT | jsonwebtoken transitive |
| `semver` | 7.3.x+ | ISC | jsonwebtoken transitive |
| `safe-buffer` | 5.x | MIT | jwa transitive |
| `buffer-equal-constant-time` | 1.0.1 | BSD-3-Clause | jwa transitive |
| `ecdsa-sig-formatter` | 1.0.11 | Apache-2.0 | jwa transitive |
| `yaml` | 2.9.0 | ISC | Workflow dispatch YAML parsing |

All identified third-party licenses are permissive (MIT, ISC, BSD-3-Clause, Apache-2.0). If we vendor source, retain the root license notice and a per-file third-party notice list. The published bundle's bundled-license header only names `mime-types`, `safe-buffer`, and `lodash`; the fuller list above comes from resolving the source dependency graph.

## 5. Focused action set

The piece is large. The recommended first port is a **read-focused GitHub repository/issue/PR set**, with writes gated behind the Command API (Section 6).

### 5.1 Action classification counts

Extracted from the published bundle (`name` + `classification` pairs; 95 total):

| Classification | Count | Meaning in piece |
|---|---:|---|
| READ | 26 | Single-resource fetch; idempotent |
| SEARCH | 27 | List/search/paginated fetch; idempotent |
| WRITE | 38 | Create/update/mutate; mixed idempotency |
| DESTRUCTIVE | 4 | Delete/remove/merge-irreversible operations |

### 5.2 Recommended first read set

- Repository metadata: `get_repository`, `list_my_repositories`, `list_branches`, `get_branch`, `list_commits`, `get_commit`, `compare_commits`, `get_file_content`, `get_repository_tree`.
- Issues: `get_issue` / `getIssueInformation`, `list_repository_issues`, `find_issue`, `list_issue_comments`, `list_issue_labels`, `list_assignees`.
- Pull requests: `get_pull_request`, `list_pull_requests`, `list_pull_request_files`, `list_pull_request_commits`, `list_pull_request_reviews`, `list_pull_request_review_comments`, `list_pull_request_comments` (via issue comments).
- Users/collaborators/milestones/labels/releases: `get_user`, `find_user`, `list_collaborators`, `list_milestones`, `get_milestone`, `list_repository_labels`, `list_releases`, `get_latest_release`.
- Search: `search_issues_and_pull_requests`, `search_code`, `search_repositories`, `search_users`.

### 5.3 Write set (must not run directly; see Section 6)

- Issues: `create_issue`, `update_issue`, `add_assignees_to_issue`, `remove_assignees_from_issue`, `add_labels_to_issue`, `remove_label_from_issue`, `set_issue_labels`, `lock_issue`, `unlock_issue`, `create_issue_comment`.
- Pull requests: `create_pull_request`, `update_pull_request`, `merge_pull_request`, `create_pull_request_review`, `create_pull_request_review_comment`, `request_pull_request_reviewers`.
- Repository/branch/file: `create_branch`, `delete_branch`, `create_or_update_file`, `delete_file`, `create_repository`, `create_organization_repository`, `update_repository`, `create_label`, `update_label`, `create_milestone`, `update_milestone`, `create_release`.
- Other: `add_collaborator`, `remove_collaborator`, `star_repository`, `unstar_repository`, `trigger_workflow_dispatch`, `create_gist`, `create_commit_comment`, `create_discussion_comment`.
- Destructive: `delete_branch`, `delete_file`, `remove_collaborator`, `merge_pull_request` (irreversible write to base branch).

### 5.4 Triggers (webhook-based)

The piece registers repository webhooks via `POST /repos/{owner}/{repo}/hooks` with `TriggerStrategy.WEBHOOK`, stores the returned webhook id, and deletes the hook on disable. Trigger variants cover issue, pull request, push, star, discussion, discussion comment, and additional repository events (branch, collaborator, commit, label, mention, milestone, release, review request). Webhook delivery is the raw GitHub event payload; the piece treats a payload containing `zen` as a verification ping and returns no items.

## 6. Read vs. write handling and Mock Project OS Command API

### 6.1 Classification rule (borrowed interface, Project OS authority)

- `READ`/`SEARCH`: may be exposed as connector read operations after scope validation and rate-limit handling.
- `WRITE`: must never call GitHub directly from a Tool/Agent. They must enter the Project OS Command API as proposed commands.
- `DESTRUCTIVE`: require an explicit human approval in addition to write scope, plus idempotency or a documented non-retryable outcome.

### 6.2 Command envelope design (design only; no execution)

A write-capable connector action is represented as:

```text
Command {
  commandId, idempotencyKey, correlationId, causationId,
  actor { type, id, scope },
  target { provider: "github", owner, repo, resourceType, resourceId? },
  operation { name, riskClass: write|destructive, classification },
  payload { ... GitHub request body ... },
  expectedVersion? , requestedAt, approvalRef?
}
```

Flow:

1. Tool/Agent requests a GitHub write through the Service Connector contract.
2. Policy layer validates connector scope (`github:repo:write`, `github:issue:write`, etc.) and risk class.
3. Destructive or high-risk writes create an approval request; execution waits for human approval.
4. Approved command is appended to the transactional Outbox (DBOS-backed durable workflow optional).
5. Connector worker executes the adapted GitHub action via `githubApiCall`.
6. Result is recorded as a command receipt (HTTP status, resource id/URL, ETag/SHA when available).
7. Read model is reconciled from GitHub; unknown outcomes are read back before retry.

### 6.3 Idempotency strategy for non-idempotent creates

GitHub create-issue/create-PR/create-branch are not idempotent. Our adapter must make retries safe by one of:

- Client-supplied idempotency key plus stored command receipt; a retry returns the stored receipt without a second POST.
- Preflight search before create (e.g. `find_issue` by title or a stored external id) and convergence on the existing resource.
- For branch/file updates, use expected SHA / `If-Match`-style preconditions where GitHub supports them; otherwise read-back and compare.

### 6.4 No canonical state mutation

The connector may cache GitHub facts for context, but GitHub remains the owner of its live facts. Writes return receipts and events; they do not directly mutate Project/Task/Assignment/Run state. Project OS state changes only through validated commands and domain events.

## 7. OAuth minimal scope concept (documented; not executed)

The piece supports three auth variants:

1. OAuth2 (classic scopes): `authUrl = https://github.com/login/oauth/authorize`, `tokenUrl = https://github.com/login/oauth/access_token`.
2. GitHub App: JWT signed with RS256 (`iat - 60s`, `exp + 540s`), exchanged for an installation token; cached in memory with a 60s refresh leeway.
3. Personal Access Token (classic or fine-grained): validated by `GET /user`.

The piece's OAuth2 scope list is broad: `['admin:repo_hook', 'admin:org', 'repo', 'gist']`. That is appropriate for the full piece, but not minimal for a read-focused connector.

Recommended minimal scope design:

| Capability | Classic OAuth scope | Fine-grained PAT / GitHub App permission |
|---|---|---|
| Read public repo metadata/issues/PRs | none (or `public_repo` only if private repo read is also needed) | Metadata: Read; Contents/Issues/Pull requests: Read |
| Read private repo metadata/issues/PRs | `repo` (GitHub has no read-only classic scope for private contents) | Metadata/Contents/Issues/Pull requests: Read |
| Create/update issue, comment, label | `repo` | Issues: Read and write |
| Create/update PR, review, merge | `repo` | Pull requests: Read and write; Contents: Read and write |
| Create/update branch/file | `repo` | Contents: Read and write |
| Webhook triggers | `admin:repo_hook` (or `repo`, which includes hook administration) | Webhooks: Read and write (and repository Administration: Read for some events) |
| Organization membership reads | `read:org` (not `admin:org`) | Organization members: Read |
| Gist | `gist` | Gists: Read and write |

Design rules:

- Default to the narrowest scope for the enabled action set; add scopes only when a write/trigger capability is enabled.
- Prefer GitHub Apps or fine-grained PATs over classic OAuth for production, because permissions are resource-scoped and revocable.
- Store tokens in our credential vault, not in piece state; never log tokens.
- Document that GitHub App calls use the bot identity (`app-slug[bot]`), so audit trails must record the installation, not a human user.

## 8. Rate limit, retry, and webhook dedup concepts

### 8.1 What upstream provides

- `githubApiCall` builds the request and calls `httpClient.sendRequest`; it has **no retry, backoff, or rate-limit handling**.
- `githubPaginatedApiCall` follows the `Link: rel="next"` header and requests 100 items per page until exhausted.
- Webhook trigger registration creates/deletes a repository hook and returns the payload; it performs no signature verification or dedup.

### 8.2 GitHub limits to design for

- Authenticated REST: 5,000 requests/hour per token/installation; unauthenticated: 60/hour per IP.
- Search API: 30 requests/minute.
- GraphQL: 5,000 points/hour (not used by this piece, but relevant if we add GraphQL later).
- Secondary limits: concurrency and rapid-request limits; responses may be `403` with a "secondary rate limit" message or `429` with `Retry-After`.
- Conditional requests with `If-None-Match`/`If-Modified-Since` can return `304` and are not counted against the primary limit.

### 8.3 Adapter requirements

- Parse `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After`.
- Retry on 429 and secondary-limit 403 with exponential backoff and jitter; respect `Retry-After`.
- Bound pagination (max pages or a time budget) and prefer incremental `since`/`updated` filters.
- Use conditional requests for repeated reads to reduce quota consumption.
- Never retry a non-idempotent write blindly; use command receipts/idempotency keys (Section 6.3).
- Emit telemetry for rate-limit proximity and retry counts.

### 8.4 Webhook dedup and verification

- Verify `X-Hub-Signature-256` (HMAC-SHA256 over the raw body with the webhook secret) before processing.
- Dedup by `X-GitHub-Delivery` (a GUID per delivery); store processed delivery ids with a TTL.
- Handle redelivery and ping events (`zen`) without side effects.
- On disable, delete the hook by stored id; tolerate 404 (already deleted).
- Store webhook registration metadata (owner, repo, event, hook id) in our own table, not in piece state.

## 9. Risks

1. **License scanner gap:** npm `license` is undefined; downstream tooling may report `UNKNOWN`. Mitigation: record root LICENSE path/commit and retain notice.
2. **Runtime coupling:** source imports Activepieces framework pieces. Mitigation: adapt source, do not import framework; replace auth/HTTP scaffolding with our adapter.
3. **Broad default scopes:** the piece requests `admin:repo_hook`, `admin:org`, `repo`, `gist`. Mitigation: minimal scope table (Section 7).
4. **No upstream retry/rate-limit/dedup:** piece leaves these to the engine. Mitigation: implement in adapter.
5. **Non-idempotent writes:** create actions are not idempotent. Mitigation: command receipts/idempotency keys and preflight reads.
6. **Webhook security:** no signature verification in piece. Mitigation: verify and dedup in ingress.
7. **Published bundle opacity:** 877 KB minified bundle hides transitive code. Mitigation: vendor from source at pinned commit only.
8. **Maintenance drift:** upstream moves quickly (0.93.0 at spike). Mitigation: pin commit, record diff review before updating.

## 10. Recommendation

- **Reuse / adapt (vendor source, then adapt):**
  - `lib/common/auth-helpers.ts`: GitHub App JWT signing, PEM normalization, installation-token exchange and caching.
  - `lib/common/index.ts`: `githubApiCall` and `githubPaginatedApiCall` request/response patterns, repository/issue/PR action implementations, output schemas.
  - `lib/auth.ts`: three auth variants as a reference for our credential model (OAuth2, GitHub App, PAT).
  - `lib/trigger/register-trigger.ts`: webhook registration lifecycle as a reference for our trigger adapter.
- **Borrow interface design only:**
  - Action classification (`READ`/`SEARCH`/`WRITE`/`DESTRUCTIVE`), props, property groups, output schemas, idempotency metadata, and the agent-facing `aiMetadata` descriptions.
  - Auth variant descriptions and minimal-scope mapping.
  - Trigger registration flow and webhook lifecycle.
- **Do not reuse:**
  - Activepieces workflow engine, piece runtime, bundling, or npm package as a dependency.
  - Activepieces framework imports (`@activepieces/pieces-framework`, `@activepieces/pieces-common`) in product code.
  - The published minified bundle.
  - Any path that lets a Piece write canonical Project OS state directly.

Overall classification: **Adapt / wrap selected pure GitHub API code + reference design for the rest** (matches G2 classification "Selective source reuse / adapt"). The piece passes G3-S3 as a source for a read-focused Service Connector, provided writes enter the Command API and auth/rate-limit/webhook concerns are implemented by us.

## 11. Evidence artifacts (local, not committed)

- `temp/2026-11-12-yu-395-activepieces-spike/activepieces-piece-github-0.11.1.tgz`
- `temp/2026-11-12-yu-395-activepieces-spike/package/` (extracted bundle)
- `temp/2026-11-12-yu-395-activepieces-spike/action-inventory.csv` (95 actions by classification)
- `temp/2026-11-12-yu-395-activepieces-spike/ap-github-src-package.json`
- `temp/2026-11-12-yu-395-activepieces-spike/ap-root-package.json`
- `temp/2026-11-12-yu-395-activepieces-spike/ap-LICENSE.txt`
- `temp/2026-11-12-yu-395-activepieces-spike/ap-common-index.ts`
- `temp/2026-11-12-yu-395-activepieces-spike/ap-register-trigger.ts`
- `temp/2026-11-12-yu-395-activepieces-spike/ap-github-view.json`

## 12. Not executed (by design)

- No real GitHub OAuth/PAT/GitHub App authentication.
- No GitHub API writes, webhook registration, or repository mutation.
- No production dependency added to the product tree.
- No code changes outside the allowed write scope.
