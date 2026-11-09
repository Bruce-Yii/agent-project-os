# Changelog

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

# Changelog

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

