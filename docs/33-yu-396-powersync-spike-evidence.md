# 33 — YU-396 PowerSync Offline Sync Spike — Evidence Report

**Status:** PARTIAL / conditional (document-based validation; no real deployment or live sync run performed).
**Issue:** YU-396 (G3-S4). **Owner:** D1 spike executor.
**Date:** 2026-11-12.
**Branch:** `feat/yu-399-local-dev-foundation`.
**Scope:** validate PowerSync Open Edition as the offline-sync candidate for Agent Project OS without bypassing the backend Command API authority model.

## 1. Upstream facts (verified)

### 1.1 Service and client packages

Source of truth: npm registry queried on 2026-11-12 (`npm view` / `npm search`). Full snapshot in `temp/2026-11-12-yu-396-powersync-spike/npm-evidence.txt`.

| Package | Latest (dist-tag) | License | Notes |
|---|---|---|---|
| `@powersync/common` | 1.58.0 (also 2.5.0 published 2026-11-02, not latest tag) | Apache-2.0 | Core API definitions |
| `@powersync/web` | 1.39.2 (also 2.7.0 published 2026-11-09, not latest tag) | Apache-2.0 | Web SDK; peer `@journeyapps/wa-sqlite ^1.5.0` |
| `@powersync/react` | 2.2.1 | Apache-2.0 | Peer `@powersync/common ^2.5.0` (2.x line) |
| `@powersync/react-native` | 1.35.11 | Apache-2.0 | Peer `@powersync/common ^1.58.0`; depends on `@powersync/react 1.10.0` |
| `@powersync/node` | 0.19.6 | Apache-2.0 | Peer `better-sqlite3 12.x`, `@powersync/common ^1.58.0` |
| `@powersync/op-sqlite` | 0.9.17 | Apache-2.0 | Peer `@powersync/common ^1.58.0` |
| `@powersync/capacitor` | 0.10.1 | Apache-2.0 | Peer `@powersync/web ^2.7.0` (2.x line) |
| `@powersync/tauri-plugin` | 0.0.6 | Apache-2.0 | Dependency `@powersync/common 2.0.0` (early) |
| `@powersync/kysely-driver` | 2.0.3 | Apache-2.0 | Peer `@powersync/common ^2.5.0` |
| `@powersync/drizzle-driver` | 0.8.0 | Apache-2.0 | Peer `@powersync/common ^2.0.0` |
| `@powersync/attachments` | 3.0.0 | Apache-2.0 | Peer `@powersync/common ^2.0.0` |
| `@powersync/service-core` | 1.28.3 | Apache-2.0 | Published 2026-11-11 |
| `@powersync/service-schema` | 1.28.3 | Apache-2.0 | JSON schema for config |
| `@powersync/service-sync-rules` | 0.44.0 | **FSL-1.1-ALv2** | service-core metadata references 0.45.0, which is not present in the queried registry at validation time |
| `@powersync/service-types` | 0.21.0 | Apache-2.0 | |
| `@powersync/service-module-postgres` | 0.23.8 | Apache-2.0 | Postgres replication module |
| `@powersync/lib-service-postgres` | 0.5.8 | Apache-2.0 | |

- Upstream service repository: `powersync-ja/powersync-service` (service-core homepage).
- Upstream JS repository: `powersync-ja/powersync-js`.
- Docs repository: `powersync-ja/powersync-docs` (MDX, last pushed 2026-11-11).
- Service license posture: core is Apache-2.0, but the `service-sync-rules` component is FSL-1.1-ALv2 (source-available, converts to Apache-2.0 after two years). If we only run the published service container and do not vendor that component, the practical exposure is low; legal review is still required before adoption.

### 1.2 Architecture (from official docs)

- Source database: Postgres / MongoDB / MySQL / SQL Server / Convex. PowerSync replicates changes via logical replication (Postgres `pgoutput`).
- Bucket storage: a separate database where the service materializes authorized buckets. Supported: MongoDB or PostgreSQL. This is not the source database.
- Client SDKs sync authorized buckets into a local SQLite database. The client can read offline and queue writes.
- Sync Streams (edition 3) define which rows sync to which clients using SQL queries and auth parameters (e.g. `auth.user_id()`).
- Client authentication is JWT-based. The service validates JWTs using JWKS or a static JWKS. The user ID must be the JWT `sub`.
- Writes are not written by PowerSync. The client SDK calls the developer-implemented `uploadData()` function, which must call the application backend. The backend applies writes to the source database synchronously. PowerSync then replicates them back to all clients.

## 2. PostgreSQL bucket storage and publication allowlist

### 2.1 Storage choice

- Postgres bucket storage is supported and does **not** require MongoDB.
- Version constraint: Postgres bucket storage supports storage version 2 only. Storage version 4 (incremental reprocessing + S3 object storage) is MongoDB bucket storage only. Source: `sync/advanced/storage-version-4.mdx`.
- Consequence: with Postgres bucket storage, every Sync Config deployment reprocesses all selected data and clients re-download their data. There is no incremental reprocessing.
- Postgres version requirement: source and bucket storage can share a server on Postgres 14+; below 14 they must be separate servers.
- Setup: create a dedicated storage user with `CREATE` on the database (or manual schema), grant `readWrite`/`dbAdmin`-equivalent privileges. PowerSync creates and manages all collections/tables and indexes itself.

### 2.2 Publication allowlist

- The Postgres source publication must be named `powersync`.
- Minimal dev example: `CREATE PUBLICATION powersync FOR ALL TABLES;`.
- Production rule (from docs warning): the service reads **all** updates present in the publication, even for tables not referenced in Sync Streams. For large data volumes this causes memory spikes and replication delays.
- Therefore production must use an explicit table list, e.g. `CREATE PUBLICATION powersync FOR TABLE public.projects, public.tasks, public.commands, ...;`. This is the publication allowlist concept: only tables the service is permitted to read are published.
- The publication must include any table referenced by Sync Streams and by event definitions (e.g. checkpoint tables).
- Replication role is high-trust: documented setup uses replication privileges and `BYPASSRLS`. Visibility enforcement therefore depends on Sync Stream queries and scoped auth tokens, not on source-database RLS.

### 2.3 Why Postgres bucket storage is chosen for this spike

- Issue #846 is MongoDB-bucket-storage specific (managed write checkpoint sometimes not announced on an already-open stream). Postgres storage is not affected by that code path.
- Postgres bucket storage avoids the MongoDB replica-set and checkpoint-version-4 dependency, but gives up incremental reprocessing. This tradeoff must be recorded in the ADR.

## 3. Scoped auth token and project data isolation

### 3.1 Auth token contract

Official JWT requirements (`configuration/auth/custom.mdx`):

1. JWT signed with a key in the JWKS (asymmetric recommended) or HS256.
2. `kid` matching the key.
3. `aud` must match the PowerSync instance URL or one of the configured `client_auth.audience` values.
4. JWT must expire in 24 hours or less; 60 minutes or less is recommended. Both `iat` and `exp` required, difference <= 86,400.
5. User ID must be the JWT `sub`.
6. Additional fields may be added and referenced in Sync Streams (`auth.parameters()`) or parameter queries.

Project OS application: the backend Control Plane issues a short-lived (<=60 min) scoped JWT with `sub = personal owner user id`, `aud = powersync instance`, and additional claims such as allowed project IDs / device scope. PowerSync is configured with the backend JWKS URI (`client_auth.jwks_uri`) and audience. The token is never a canonical-write credential; it only authorizes sync visibility.

### 3.2 Project data isolation

- Sync Streams are SQL queries filtered by auth parameters, e.g. `SELECT * FROM tasks WHERE project_id = ANY(auth.parameters()->>'project_ids')` or per-user filters such as `owner_id = auth.user_id()`.
- The publication allowlist (section 2.2) limits which tables the service can read at all.
- Isolation is enforced by both the publication (table-level) and the stream query (row-level). A misconfigured stream query is a data-leak risk; review stream queries as security-sensitive code.
- Because the replication role bypasses RLS, source-database RLS must not be relied upon for isolation.
- Per-Project scoping should be carried in JWT claims and referenced in stream queries; client-supplied connection parameters must not be used for authorization (docs warning).

## 4. Offline write + reconnect, checkpoint, duplicate upload

### 4.1 Write path (server-authoritative)

Documented flow (`handling-writes/writing-client-changes.mdx`):

1. Client writes to local SQLite; SDK records the change in the upload queue.
2. SDK calls the developer-implemented `uploadData()` function.
3. `uploadData()` sends queued changes to the backend API.
4. Backend applies writes to the source database **synchronously** before responding.
5. PowerSync replicates changes and syncs them to all clients whose streams include the rows.
6. On success, `uploadData()` calls `complete()` on the transaction/batch, removing it from the queue.

Project OS constraint: `uploadData()` must call the Project OS backend Command API, not mutate the source database directly. The backend remains the only canonical writer. The client never writes canonical state.

### 4.2 Checkpoint

- PowerSync uses write checkpoints for consistency. After upload, the client obtains a checkpoint marking the source position after those writes. The client applies downloaded data only once the sync checkpoint includes that write checkpoint.
- Because the write endpoint must be synchronous, the default (managed) checkpoint flow is sufficient: the service marks the source position when `uploadData()` returns, so uploaded changes are already in the source database.
- Custom checkpoints (legacy `write_checkpoints` or checkpoint requests) are an Enterprise feature (docs note). Open Edition deployments must keep writes synchronous and use the default managed flow. This matches our backend Command API requirement and avoids async pipeline complexity.
- Reconnect: the client reconnects, requests a new stream, and resumes from its last checkpoint. Missed writes are reconciled by idempotency keys.

### 4.3 Duplicate upload

- The upload queue may deliver the same operation more than once in some scenarios. Operations must be idempotent (`handling-writes/handling-update-conflicts.mdx`).
- Each operation carries a per-client incrementing operation ID usable for deduplication.
- Backend must handle duplicates safely (e.g. ignore delete on already-deleted row, upsert by id, dedupe by operation ID). Command API idempotency keys are the natural deduplication boundary.
- Retry behavior: `5xx` responses cause retry; validation/conflict errors should return `2xx` with error details (not `4xx`) to avoid blocking the queue indefinitely.

### 4.4 Reconnect and offline behavior

- Offline writes remain in the upload queue and are retried when connectivity returns.
- On reconnect, the client re-establishes the stream and downloads from its last checkpoint.
- No exactly-once claim: at-least-once delivery with idempotent handlers (consistent with Project OS topology doc section 4).

## 5. Conflict handling

- PowerSync is unopinionated on backend conflict resolution; the backend dictates how mutations are applied (server-authoritative reconciliation).
- Default backend behavior is per-field last-write-wins (LWW).
- Recommended rules (`handling-writes/handling-update-conflicts.mdx`):
  - Deletes always win.
  - For concurrent updates, last update to each field wins.
  - Backend may enforce domain validations (e.g. reject updates to completed orders).
- Project OS application: conflict resolution belongs to the backend Command API and domain policy, not to PowerSync. PowerSync only distributes the resulting state.
- CRDTs (e.g. Yjs) can be stored and synced if collaborative merge is needed; built-in CRDT operations are not available yet.

## 6. Schema migration

- Client-side schema: the SDK syncs schemaless data and applies the client schema with SQLite views. **Schema migrations are not required** for normal tables. Exception: raw tables, which the app creates and migrates itself (`client-sdks/reference/javascript-web.mdx` snippet).
- UUIDs recommended for client-created rows (`client-sdks/writing-data.mdx`).
- Sync Config changes:
  - Additive schema changes: old clients ignore new tables/columns; no special handling.
  - Breaking changes (rename/restructure): define versioned streams (e.g. `user_assets` and `user_assets_v2`) and let clients subscribe by version. Connection parameters can also route by client version, but must not be used for authorization.
- Postgres bucket storage caveat: no incremental reprocessing, so every deployment reprocesses all data and clients re-download. Plan deployments accordingly; avoid frequent config churn.
- Service storage schema migrations: automatic by default on startup (`migrations.disable_auto_migration` can disable). Bucket storage schema is managed by the service.

## 7. Desktop / Mobile SDK compatibility

| Target | Recommended SDK | Version line | Notes |
|---|---|---|---|
| Desktop (Electron / browser) | `@powersync/web` | 1.x (1.39.2 latest tag) or 2.x (2.7.0) | Uses wa-sqlite; `vfs: 'auto'` recommended on 2.7.0+ |
| Desktop backend / daemon | `@powersync/node` | 0.19.6 (common 1.x) | Peer `better-sqlite3 12.x` |
| Mobile (React Native) | `@powersync/react-native` | 1.35.11 (common 1.x) | Peer quick-sqlite; depends on react 1.10.0 |
| Mobile (Capacitor) | `@powersync/capacitor` | 0.10.1 (web 2.x) | Requires Capacitor >=8 and community sqlite 8.1 |
| Desktop (Tauri) | `@powersync/tauri-plugin` | 0.0.6 (common 2.0.0) | Early, pre-1.0; limited maturity |
| ORM / query builders | `@powersync/kysely-driver`, `@powersync/drizzle-driver` | 2.0.3 / 0.8.0 (common 2.x) | |

Compatibility warning: there are two parallel common major lines.

- Stable/latest-tag line: common 1.58.0, web 1.39.2, react-native 1.35.11, node 0.19.6.
- Newer line: common 2.5.0, web 2.7.0, react 2.2.1, kysely 2.0.3, attachments 3.0.0, tauri plugin 0.0.6, capacitor 0.10.1.

Mixing majors (e.g. react-native 1.x with react 2.x, or capacitor with web 1.x) will fail peer-dependency resolution. A Project OS client must pick one line per app and pin exact versions. Desktop (Electron) and Mobile (React Native) can share the 1.x line; Capacitor/Tauri apps need the 2.x line.

## 8. Issue #846 status and storage choice

- Issue #846 (open as of 2026-10-16): MongoDB bucket storage managed write checkpoint sometimes not announced on an already-open stream; ~10-12% of write checkpoints affected; client stalls until reconnect. Maintainer (`rkistner`) recommends `checkpointMode: 'requests'` and storage version 4; reporter on storage version 2.
- Relevance: affects MongoDB bucket storage only. Postgres bucket storage does not use that code path.
- Our choice for this spike: PostgreSQL bucket storage first, default managed checkpoints, synchronous backend writes. This avoids #846 but sacrifices incremental reprocessing (section 2.1).
- If we later need async pipelines or incremental reprocessing, we must either accept MongoDB storage + request checkpoint mode + storage v4 (Enterprise feature set) or keep Postgres storage and accept full re-sync on deployment. This is a decision for the ADR, not for this spike.

## 9. Deployment, security, and maintenance cost

### 9.1 Deployment cost

- Run the PowerSync service as a container (port 8080 default) with a config file.
- Required infrastructure: source Postgres with logical replication enabled; a separate bucket Postgres (can share the server on PG14+); publication `powersync`; replication slot; storage user with create privileges.
- Backend must expose a JWKS endpoint and issue scoped JWTs.
- Sync config must be deployed and versioned; service health checks and Prometheus metrics available.
- Bucket storage schema is auto-migrated by the service on startup (can be disabled).
- No code changes to Project OS are required to validate; this is a candidate, not a dependency yet.

### 9.2 Security cost

- Publication allowlist must be maintained; new tables require publication + stream + auth review.
- Replication role bypasses RLS; isolation depends on Sync Streams and JWT claims. Stream queries are security-critical.
- JWT expiry <= 60 min recommended; backend must rotate keys and handle JWKS rotation (docs provide rotation procedure).
- Scoped tokens must include only authorized project IDs; client cannot self-declare authorization (no client-supplied auth parameters for authorization).
- Service admin API requires bearer tokens; if unset, admin routes reject all requests.

### 9.3 Maintenance cost

- Service upgrades and storage migrations; monitor for checkpoint delivery issues if MongoDB storage is ever used.
- SDK version pinning across Desktop/Mobile lines; major-line split adds upgrade coordination.
- Postgres storage: full re-sync on every config deployment; avoid frequent changes; use versioned streams for breaking changes.
- License compliance: service core Apache-2.0; `service-sync-rules` FSL-1.1-ALv2. Running the published container is acceptable; vendoring source requires legal review.
- Operational monitoring: replication lag, bucket counts, checkpoint requests, connection counts, storage size.

## 10. Limitations and caveats

- No real deployment, no live sync, no client run was performed. This is document-based validation plus npm/GitHub evidence.
- Postgres bucket storage lacks incremental reprocessing and S3 object storage.
- Custom checkpoint flows are Enterprise features; Open Edition requires synchronous writes.
- Tauri plugin is early (0.0.6).
- SDK major-line split complicates a single cross-platform client implementation.
- `@powersync/service-core` 1.28.3 references `@powersync/service-sync-rules` 0.45.0, which is not present in the queried registry (latest 0.44.0). Use the official container image and verify version alignment before adoption.
- Issue #846 remains open; if MongoDB storage is chosen later, request checkpoint mode and storage version 4 are mandatory and must be tested.

## 11. Recommendation

**Adopt conditionally as the offline-sync candidate behind a Project OS sync adapter/port, not as a frozen dependency.**

Conditions to satisfy before implementation (per G3-S4 pass criteria):

1. Use PostgreSQL bucket storage first, with an explicit publication allowlist (not `FOR ALL TABLES`).
2. Keep the backend Command API as the only canonical writer; client writes go through `uploadData()` -> backend Command API synchronously.
3. Use default managed checkpoints (no async pipeline) unless an ADR approves Enterprise custom checkpoints.
4. Issue short-lived scoped JWTs (<=60 min) from the backend; configure JWKS + audience; filter Sync Streams by auth claims.
5. Pin SDK versions per app and choose one common major line (1.x for Electron+React Native, 2.x for Capacitor/Tauri).
6. Test reconnect, offline writes, duplicate upload, conflict handling, schema migration, and cross-Project isolation on Desktop and Mobile targets.
7. Record an ADR for the Postgres-storage tradeoff (no incremental reprocessing) and obtain dependency approval (project identity lock: no new production dependencies without approval).

Fallback if Desktop SDK or isolation semantics fail: defer offline sync and keep a simpler authenticated API/realtime path; do not introduce Electric as a second engine.

## 12. Evidence artifacts (local, not committed)

- `temp/2026-11-12-yu-396-powersync-spike/npm-evidence.txt` — npm version/license snapshot.
- `temp/2026-11-12-yu-396-powersync-spike/setup.mdx`, `self-hosted.mdx`, `auth-*.mdx`, `handling-writes/*.mdx`, `storage-v4.mdx`, `multi-client-versions.mdx`, `publication.mdx` — downloaded official docs used for this report.
- GitHub issue #846 JSON (fetched via API) — checkpoint bug evidence.
- Source docs: `docs/22-mature-module-reuse-assessment.md` (section 4.5), `docs/27-pc1-canonical-authority-topology.md`, `docs/14-open-decisions.md` (P-017), `docs/13-competitor-and-reuse-analysis.md`.
