# ADR-045: Technology Architecture Baseline (YU-392 Decision Pack, 2026-11-12)

- Status: Accepted for planning and implementation baseline
- Date: 2026-11-12
- Decision owner: W0 (Architecture & Integration) under YU-392; product owner (ChatGPT project owner) for license and scope
- Affected docs/modules: `docs/14` (P-021, P-022, §3.1), `docs/19`, `docs/20`, `docs/22`, `docs/23`, `docs/24`, `docs/26`, `docs/30`–`docs/35`, `docs/40`, `docs/43`, `docs/44`; all F01–F32 module contracts and WP1-A; `project.json`/`manifest.json` (tech stack still recorded as not frozen until MRG evidence closes)

## Context

YU-392 (G3-W0 Engineering Decomposition & Shared Contracts) produced a technology decision pack on 2026-11-12 that selects a planning and implementation baseline for Agent Project OS. Before this ADR, the repository recorded the stack as PROPOSED/unfrozen (`docs/14` P-021/P-022, `docs/23` §2, `project.json` `techStack: NOT FROZEN`) and the MRG review (docs/44) listed a frozen build/runtime stack as a NOT MET blocker. The decision pack resolves the *direction* and *boundaries* for each layer, while keeping conditional candidates behind ports and validation gates.

This ADR formalizes that decision pack as an architecture decision record. It does **not** claim that any production code, package, migration, or dependency has been added, that G3/G4/G5 are complete, or that any module has passed its Module Readiness Gate (MRG). Individual third-party package adoption remains subject to exact version, license, security, compatibility, and module MRG evidence.

Authority: product decisions from Notion 00–03 and `docs/14`; task identity from Linear YU-392; upstream package/API/license facts from official upstream sources and the G3 spike evidence (`docs/26`, `docs/30`–`docs/35`).

## Decision drivers

- Modular monolith first; 32 functional groups are domain modules, not microservices (`docs/14` P-008, `docs/24`).
- Single canonical Workspace writer; replicas/caches/offline writes stay non-authoritative (`docs/27` PC-1).
- TypeScript end-to-end with PostgreSQL as canonical store fits the existing domain model and avoids a second language/runtime.
- Reuse mature infrastructure behind Project OS-owned ports; do not outsource canonical domain, policy, Memory, or Skill governance (`docs/22`).
- Conditional candidates (DBOS, Paseo, Activepieces, PowerSync) must be hidden behind ports and must not become a second domain authority (`docs/22` §8, `docs/26`, `docs/30`–`docs/33`).
- Open source and free self-hosting are product requirements; no mandatory paid core capability (`docs/00`, `docs/14` C-010/C-011).
- Personal-only phase: no org/team/multi-tenancy in current contracts or 1.0–10.0 scope (`docs/AGENTS.md`, `docs/40`).

## Options considered

### Option A — Big-bang microservices + managed services
- Benefits: independent scaling per module.
- Costs/risks: premature distribution, violates modular-monolith decision, raises operational cost, conflicts with self-hosting and MRG boundaries.

### Option B — Modular monolith + ports/adapters (selected)
- Benefits: one deployable Control Plane, clear module ownership, ports isolate conditional candidates, simpler self-hosting.
- Costs/risks: modules must respect boundaries; shared contracts require single writers (docs/17).

### Option C — Adopt a single third-party platform as the product (Paseo/Activepieces/DSH)
- Benefits: faster initial runtime.
- Costs/risks: outsources canonical authority; violates Project OS ownership of domain/policy/Memory/Skill; excluded (`docs/22` §5).

## Decision

The technology baseline below is accepted for planning and implementation baseline. Status legend: **Accepted** = accepted for planning and implementation baseline (subject to MRG/version evidence); **Conditional** = candidate behind a port, adoption gated by named validation; **Deferred** = explicitly later slice.

### 1. Language/runtime — TypeScript + Node.js 26 LTS
- Status: Accepted
- Reason: Single language across Control Plane, contracts, and tooling; Node 26 LTS is the primary runtime; Node 24 remains a temporary compatibility lane until the baseline is frozen (`docs/23` §2, `docs/14` P-022).
- Boundary: No production dependency or code exists yet; runtime must be verified against the exact package matrix before implementation (`docs/44` criterion 4).
- Evidence: `docs/14` §3.1; `docs/23` §2 (host Node 24.16.0 recorded as available, not frozen); `docs/26` (DBOS accepted on Node 24 host).

### 2. Package manager — pnpm 12.19.0
- Status: Accepted
- Reason: Deterministic installs and workspace support for the modular monolith; version pinned exactly.
- Boundary: No `package.json`/lockfile exists yet; pinning is a planning decision until the build system lands.
- Evidence: `docs/14` §3.1; `docs/44` (no build system at MRG review).

### 3. Architecture — Modular monolith + ports/adapters
- Status: Accepted
- Reason: 32 functional groups remain in scope as domain modules; avoids microservice-per-module and premature distribution (`docs/14` P-008, `docs/24`).
- Boundary: Cross-module integration stays gated by accepted contracts and MRG; no new microservice per functional group.
- Evidence: `docs/24`; `docs/19` §7; `docs/14` P-008.

### 4. Backend/API — Fastify 5.x + TypeBox + REST/OpenAPI
- Status: Accepted
- Reason: Schema-first REST/OpenAPI with TypeBox; aligns with command/event contracts and OpenAPI consumers.
- Boundary: API boundaries must still be specified in module contracts; no implementation yet.
- Evidence: `docs/14` §3.1; `docs/24` (module/API boundaries).

### 5. Web UI — React 19.3 + Vite 8.3.x + React Router 7 + TanStack Query v5
- Status: Accepted
- Reason: Mature React ecosystem; Vite for build/dev; TanStack Query for server-state; React Router for routing.
- Boundary: Web is a client of the Control Plane; no SSR requirement (Next.js SSR is a non-decision).
- Evidence: `docs/14` §3.1; `docs/09`.

### 6. UI components — Tailwind CSS 4 + shadcn/ui (Radix primitives)
- Status: Accepted
- Reason: Utility-first styling with accessible Radix-based components; supports a shared design system across Web/Desktop renderer.
- Boundary: Component library choice does not grant permissions or define domain behavior.
- Evidence: `docs/14` §3.1.

### 7. Database — PostgreSQL 18.6 (17.11 fallback) + Drizzle + pg
- Status: Accepted
- Reason: PostgreSQL is the canonical server-side store; Drizzle + node-postgres with explicit SQL migrations; host has PG 17.11 available as dev convenience (`docs/23` §2).
- Boundary: SQLite is not a second authority; only a local client/runtime store/cache. pgvector is not adopted by default (see §18).
- Evidence: `docs/14` P-021/P-022; `docs/22` §3 (primary data row); `docs/23` §2; `docs/26`/`docs/30` (DBOS requires PostgreSQL).

### 8. Durable workflow — DBOS 5.5.0 (conditional)
- Status: Conditional
- Reason: Best fit for TypeScript + PostgreSQL durable workflow steps, persisted communication/event waits, and crash recovery without a separate control plane; evidence shows happy path, crash recovery, idempotency, Outbox replay, version upgrade, and connection-pool behavior, with at-least-once step execution.
- Boundary: Adopted only behind `DurableWorkflowPort`; DBOS owns execution checkpoints only; Project OS remains canonical authority for Project/Task/Run/Approval. Temporal remains the distributed fallback. Hatchet is not the default. Idempotent handlers, pool sizing, explicit versioning, and a real PG service-restart test are still required. `autoUpgrade` (Enterprise) must not be used on the OSS path.
- Evidence: `docs/26`, `docs/30`; `docs/22` §4.2, §7 (DBOS row); `docs/14` P-014.

### 9. Local Agent runtime — LocalRuntimeNode + ACP v1 + Paseo (conditional)
- Status: Conditional
- Reason: Project OS owns `LocalRuntimeNode`; ACP v1 standardizes Provider session lifecycle for compatible Providers; Paseo's published daemon modules are the preferred reuse candidate for process supervision and event streaming. Native Provider adapters remain preferred where richer.
- Boundary: Paseo is not a drop-in product; its Workspace/Agent records must not replace Project OS authority. Paseo npm tarballs lack license metadata (recorded as "Proprietary" by npm) and are pinned to a source commit pending license audit; plugin backend is trusted/unsandboxed and must not be the third-party marketplace model. Permission-reason propagation and daemon-restart durability are not fully closed.
- Evidence: `docs/31`; `docs/22` §4.1, §5; `docs/14` P-015.

### 10. Connectors — Activepieces community Pieces (selective)
- Status: Conditional
- Reason: Community Pieces are self-contained bundles that can be reviewed and adapted individually; GitHub piece (`@activepieces/piece-github@0.11.1`) exposes 95 actions across READ/SEARCH/WRITE/DESTRUCTIVE with no built-in retry/rate-limit/dedup.
- Boundary: Adapt selected pure API/auth code behind `ServiceConnector`; do not adopt the full Activepieces engine or let a Piece mutate canonical state. Vendor from a pinned commit with license notice; npm `license` field is missing (issue #16544). Retry, rate-limit, webhook signature/dedup, and OAuth must be supplied by our adapter. Composio Cloud is excluded from the free self-hosted core.
- Evidence: `docs/32`; `docs/22` §4.4, §5; `docs/14` P-016.

### 11. Skills — Agent Skills `SKILL.md` interchange
- Status: Accepted
- Reason: Portable, client-neutral, Apache-2.0 format with a published spec and reference validator; fits Context Pack and Skill delivery.
- Boundary: The format defines portable content/metadata only. Project OS owns extraction, provenance, evaluation, approval, versioning, scope, and rollback. `allowed-tools` is experimental metadata, never an authorization boundary.
- Evidence: `docs/34`; `docs/22` §4.6, §3; `docs/14` P-019.

### 12. Offline sync — PowerSync (conditional)
- Status: Conditional
- Reason: Leading candidate for authorized Postgres → local SQLite read sync with client writes routed through the backend `uploadData()` path, preserving the single canonical writer.
- Boundary: Not a core dependency until Desktop + Mobile SDK compatibility, authorization filters, schema migration, conflict behavior, and current checkpoint behavior pass a narrow test. Use PostgreSQL bucket storage; do not copy the dev `FOR ALL TABLES` publication example; Sync Streams and server-issued tokens enforce visibility. Session transcript/terminal streaming remains separate.
- Evidence: `docs/33`; `docs/22` §4.5, §5; `docs/14` P-017; `docs/27` (authority unaffected).

### 13. Desktop — Electron
- Status: Conditional
- Reason: Selected direction: share the React renderer; main process supervises a separate Local Daemon; strict security model. Final shell choice remains gated on local process supervision, OS permissions, packaging, and mobile strategy validation (`docs/22` §3 row "Product UI and desktop shell").
- Boundary: Desktop must create/open local Agent Sessions and continuously receive messages; Provider Session, RuntimeProcess, and client connection remain distinct. Not frozen until the G3 shell ADR.
- Evidence: `docs/14` §3.1; `docs/22` §3, §5; `docs/18`.

### 14. Mobile — Expo SDK 58 / React Native 0.88 (later slice)
- Status: Conditional
- Reason: Mobile is a later vertical slice; Expo SDK 58 / RN 0.88 is the selected target when that slice starts.
- Boundary: No mobile implementation in the first usable slice; mobile support is part of the PowerSync validation gate before offline sync can be accepted.
- Evidence: `docs/14` §3.1; `docs/09`; `docs/33` (mobile SDK compatibility).

### 15. Realtime — SSE + WebSocket
- Status: Accepted
- Reason: SSE for Project/Task/event feeds; WebSocket for interactive Session/terminal/daemon channels.
- Boundary: Continuous streaming requires backpressure, event cursors, reconnect/reconciliation, deduplication, and explicit gap handling; never claim a complete transcript if events were missed.
- Evidence: `docs/14` §3.1; `docs/18`.

### 16. Testing — Vitest + Playwright
- Status: Accepted
- Reason: Vitest for unit/contract/integration (with real PostgreSQL CI service); Playwright for E2E.
- Boundary: Tests must target real failure surfaces and user outcomes; MRG requires contract fixtures and negative/recovery cases. No production test pipeline exists yet.
- Evidence: `docs/14` §3.1; `docs/44` criterion 4/6; `docs/23`.

### 17. Observability — Pino + OpenTelemetry
- Status: Accepted
- Reason: Structured logging (Pino) plus standard traces/metrics (OpenTelemetry) with correlation IDs across Project → Task → Assignment → Run → Session → Connector.
- Boundary: Telemetry/privacy defaults for self-hosted remain an open platform question (`docs/14` §7).
- Evidence: `docs/14` §3.1, P-021; `docs/22` §3 (observability row).

### 18. Search/Memory — PostgreSQL relational + JSONB + FTS; pgvector only if justified
- Status: Accepted
- Reason: PostgreSQL relational + JSONB + full-text search is sufficient initially; avoid a separate vector database and embedding vendor lock-in.
- Boundary: pgvector is adopted only if a concrete justification (quality/cost) is evidenced. Canonical Memory remains Project OS-owned; third-party retrieval may only propose candidates.
- Evidence: `docs/14` §3.1; `docs/22` §4.6, §5 (Mem0 excluded as canonical).

### 19. Artifact storage — Filesystem first; S3-compatible later
- Status: Accepted
- Reason: Filesystem adapter first for self-hosted simplicity; S3-compatible adapter behind a port when required.
- Boundary: Large artifacts use immutable metadata/references; storage backend is swappable via port.
- Evidence: `docs/14` §3.1; `docs/22` §3 (primary data row).

## Explicit non-decisions

Do not introduce in the first usable slice (and none is selected by this ADR): NestJS; Next.js SSR; GraphQL; tRPC; microservice-per-module; Kubernetes; Redis/RabbitMQ; Temporal as the default workflow engine; OPA/OpenFGA; a separate vector database; Composio Cloud; the full Activepieces Engine; a second ORM; copying AWRP/agent-relay source; Paseo npm tarballs (license metadata missing); PowerSync (until conditional tests pass).

## License

- Status: Resolved / Accepted (formal publication authorization separate)
- Decision: Apache License 2.0; `LICENSE` published in the repository.
- Boundary: Formal publication authorization and any remaining licensing/ownership path (including AWRP source reuse) are separate gates; AWRP/agent-relay source copying remains blocked until explicitly authorized.
- Evidence: `docs/14` C-010 (RESOLVED 2026-11-12); repository `LICENSE`.

## Consequences

- Positive: A single, citable baseline for all module contracts and Work Packages; conditional candidates are hidden behind ports so adoption can be reversed without domain changes.
- Negative: Conditional items (DBOS, Paseo, Activepieces, PowerSync, Electron, Mobile) are not implementation-ready; their MRG/version gates remain. The repository still has no build system, `package.json`, or production code.
- Migration/compatibility: Node 24 compatibility lane remains until the stack is frozen; PostgreSQL 17.11 is the compatibility fallback for the 18.6 target.
- Security/operations: Paseo plugin backend is unsandboxed; Activepieces pieces need per-piece license/dependency audit; PowerSync requires high-trust replication role and allowlisted publications; DBOS `autoUpgrade` is Enterprise-only.

## Evidence and validation

- YU-392 (Linear): G3-W0 Engineering Decomposition & Shared Contracts; decision pack dated 2026-11-12.
- G3 spikes: `docs/26`, `docs/30` (DBOS), `docs/31` (Paseo/ACP), `docs/32` (Activepieces), `docs/33` (PowerSync), `docs/34` (Skills).
- Reuse assessment: `docs/22` (G2 complete; reuse matrix and exclusions).
- Open decisions: `docs/14` §3.1 (technology decisions table) and P-014–P-022.
- Local dev foundation: `docs/23` (Node/PG host availability; stack not frozen).
- Module/integration: `docs/24`, `docs/40`, `docs/43`, `docs/44` (MRG status).
- Upstream versions/licenses: recorded in the spike evidence and `docs/22` §7 (DBOS 5.5.0 MIT; Paseo 0.15.4 Apache-2.0 source, npm metadata missing; Activepieces 0.93.0 MIT outside EE; PowerSync Apache-2.0; Agent Skills Apache-2.0).

## Supersession

This ADR does not supersede an earlier ADR (none exists). It consolidates and formalizes the technology decisions recorded in `docs/14` §3.1 and the G3 spike evidence. It should be referenced by `docs/14`, `docs/40`, `docs/43`, and all module contracts as the technology authority. If a conditional candidate is rejected or replaced, a new ADR must supersede the relevant section here.