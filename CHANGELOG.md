# Changelog

## v0.6 — 2026-11-10

### Added
- Added `docs/21-architecture-review.md` with the six-journey coverage map, 32-group module ownership map, core object/state authority map, degraded-path review, and prioritized architecture findings.
- Completed G1 as an architecture audit on the existing PR #1 branch; critical decisions remain owned by G2/G3 and block parallel implementation.

### Corrected
- Renamed the implementation-stage acceptance labels in `docs/12` to Stage 0–7 gates, avoiding collision with the separate G0–G5 preparation gates.
- Updated README, STATUS, manifest, and checksums to documentation baseline v0.6.
- Corrected the G0 report's next-gate pointer to G2 after the G1 architecture audit passed.
- Recomputed all 30 `CHECKSUMS.sha256` entries using a SHA-256 implementation that passes the standard `abc` known-vector test; withdrew the earlier unverified 21/30 mismatch count.

### Not changed
- No schema, API, event contract, deployment topology, Provider, or technology stack was frozen.
- No product code was added and no parallel implementation was authorized.

## v0.5 — 2026-11-10

### Added
- Added `docs/20-design-baseline.md` with the G0 asset inventory, layered authority model, Notion-to-Git ownership map, repository snapshots, and discrepancy register.
- Completed G0 on the existing PR #1 branch; G1–G5 remain not started and PR merge remains pending.

### Corrected
- Aligned README, STATUS, CHANGELOG, manifest, and checksums to documentation baseline v0.5.
- Corrected the section numbers in `docs/06` and `docs/07` to match their filenames and README order.
- Defined the existing `N` source key in `docs/16` as new-product synthesis grounded in product-owner-confirmed design.
- Removed a duplicate top-level Changelog heading.

### Not changed
- No product code or runtime implementation was added.
- No technology stack, schema, or deployment topology was frozen.
- No product scope was removed; the complete 32-group target remains.

## v0.4 — 2026-11-10

### Added
- Added `docs/19-pre-development-readiness.md` for the pre-implementation sequence: G0 design baseline, G1 architecture review, G2 mature-module reuse assessment, G3 engineering decomposition, G4 independently usable release roadmap, and G5 documentation handoff.
- Clarified that G0–G5 are preparation gates, distinct from the implementation sequence in docs/12.
- Recorded the design-stage GO decision and the rule that feasibility can be assessed from product design, architecture, source research, mature technical paths, and reuse analysis; a prototype or full competitor E2E run is not a prerequisite.
- Preserved the complete 32-group scope, Project-first model, direct Agent and Coordinator modes, DeepSeek DSH as an architectural input, and Experience-to-Skill as a supporting capability.

### Not changed
- No product code or runtime implementation was added.
- No technology stack or deployment topology was frozen.
- No gate is claimed as complete; G0–G5 remain NOT STARTED.
- Existing docs/00–18 and ownership rules remain in place; this adds a preparation plan, not a parallel documentation hierarchy.

## v0.3 — 2026-11-09

### Added / clarified
- Expanded the Product Charter into the canonical PRD: product origin, user problem, positioning, target users, jobs-to-be-done, value proposition, unified-system requirements, user journeys, non-functional requirements, success measures, risks, and explicit boundaries.
- Recorded the design lineage as AWRP + our Linear Project/Current State operating model + DeepSeek DSH, with the distinct contribution and non-goals of each source.
- Confirmed the open-source and free self-hosted product direction: complete core capabilities without mandatory subscription gating; users bring their own model/provider credentials and bear chosen inference/hosting/third-party costs.
- Added a more precise definition of unification across identity, domain model, state, context, coordination, governance, and clients.
- Expanded competitor analysis to acknowledge Paperclip, Paseo, and OpenHands Agent Canvas as open-source/self-hosted overlaps; differentiated by Project-centered lifecycle and integration quality rather than claiming free self-hosting is unique.
- Added competitive proof journeys and a self-hosted distribution validation gate.

### Not frozen
- Exact open-source license, contribution governance, initial launch segment, first coherent release boundary, hosted service model, technology stack, and canonical deployment topology.
- No code implementation or production capability is claimed by this documentation update.

## v0.2 — 2026-11-09

### Added
- `docs/18-local-agent-session-subsystem.md`: implementation-grade product/runtime contract for local Agent Session creation, attachment, continuous message streaming, commands, reconnect/replay, security, multi-client access, and acceptance.
- F32 Universal Search and Command Palette.
- Expanded explicit product candidates: unified Attention/Inbox, inspectable Context Pack, cross-Provider Context Handoff, Project bootstrap bundles, and guided migration/import with provenance and rollback planning.
- Official Provider reference matrix for Codex App Server, Claude Agent SDK, OpenCode Server, and Pi RPC.

### Expanded
- F11 Agent Registry: Provider capability discovery, versioning, and native/emulated/unsupported/unknown capability reporting.
- F12 Agent Session Workbench: first-class local Session creation/opening and continuous new-message reception; direct unbound Sessions; attach/resume; event replay and multi-client interaction.
- F16 Runtime Nodes: Local Daemon lifecycle, process supervision, event spool, reconnect, pairing, and host-offline truth.
- F02/F27: explicit human/Agent/Runtime capacity and calendar/scheduling views.
- F29/F30: Session attention, unread state, event gaps, Daemon health, and Session-level usage/observability.
- Domain model: ProviderSessionRef, RuntimeProcess, SessionConnection, SessionBinding, SessionTurn, SessionEventCursor, and Session Command Receipt boundaries.
- Development roadmap and Agent contributor contract: local Session E2E gate, provider capability contract, stream backpressure, idempotent commands, and event-gap handling.

### Confirmed product requirement
- Desktop must be able to create/open a Session with a local Agent and continuously receive newly arriving messages.

### Not changed
- Product remains the complete Project-centered OS for people and multiple Agents.
- Autonomous execution remains a sub-capability; Personal Execution Skill remains a supporting method input.
- Technology stack remains unfrozen; no code implementation or production capability is claimed.
