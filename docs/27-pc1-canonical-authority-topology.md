# 27 — PC-1 Canonical Authority Topology (Draft ADR)

**Status:** ACCEPTED FOR WP1-A SCOPE (2026-11-12). Authority invariant (single Control Plane writer) accepted. Deployment topology (sync transport, packaging) remains open pending YU-396 and Gate D2. Global status remains DRAFT/PROPOSED.
**Issue:** YU-392 (P0-1). **Owner:** W0 (sole writer).
**Personal-only:** single human Personal Owner; Agent/Runtime/Connector are execution actors.

## 1. Problem

Project OS must have exactly one canonical writer for domain state per deployment, while supporting local-first UX, offline clients, remote control, and multiple runtimes. Without this, cached replicas, offline writes, and concurrent Agent writes can silently diverge.

## 2. Options compared

### A. Local-first (single device is authority)

- Canonical writer: the Desktop app's local SQLite/DB on the user's primary machine.
- Clients (mobile/web) are read-only observers or offline caches; writes queue as commands to the primary.
- Pros: works offline; no server required; simplest for personal use.
- Cons: no access when primary machine is off; multi-device write conflicts; backup/recovery burden on user.
- Offline rule: client caches are read-only snapshots; queued commands are not accepted state until primary acknowledges.

### B. Self-hosted Hub (user-owned server is authority)

- Canonical writer: a user-deployed Hub/Control Plane (single Postgres instance).
- Desktop/mobile/web are clients; local daemon reports execution.
- Pros: multi-device consistent; server-side authority; standard backup.
- Cons: requires a running server; user must operate it; offline clients can only read cached state.

### C. Hybrid (local daemon + cloud/self-hosted relay)

- Canonical writer: a chosen authority (local Hub or cloud) selected per PersonalSpace (alias: workspace); local daemon participates as a runtime node, not authority.
- Pros: flexible; supports both solo and remote.
- Cons: most complex; risk of authority ambiguity if not explicitly selected.

## 3. Decision (DRAFT — not frozen)

- **Canonical writer is always exactly one Control Plane instance per PersonalSpace**, selected at PersonalSpace creation (Local Hub or Self-hosted Server). Desktop/mobile/web are clients; the Local Runtime Daemon is an execution node, never the canonical writer.
- **Local-first mode** is a deployment where the Control Plane runs on the user's primary machine (co-located with the daemon). It is still the single writer; clients connect to it. This is Option A's UX with Option B's authority model.
- **No client-side canonical writes.** Offline clients may draft commands; a command becomes state only after the Control Plane accepts it (idempotency key + expected version + policy check).
- **Authority selection is explicit and recorded** (`personal_space.authority_mode`, alias `workspace.authority_mode`: `local-hub` | `self-hosted-server`). Changing it requires migration, not a toggle.
- PowerSync (YU-396) and connector results may alter the sync topology but not the authority model: clients remain non-authoritative.

## 4. Rules

- **Replicas/caches:** clients hold read-only projections with a sync cursor. They never write canonical state directly.
- **Offline writes:** clients enqueue `Command` objects (with idempotency key, expected version, actor). On reconnect, commands are submitted in order; the Control Plane accepts/rejects each with a receipt. Rejected commands surface as conflicts for user resolution.
- **Local Runtime Node authority:** executes Agent Sessions and tool calls; reports results as commands/events to the Control Plane. It does not own Project/Task/Run state.
- **Conflict resolution:** if two clients submit conflicting commands, the Control Plane applies version checks; the loser receives a `REJECTED` receipt with reason and the current version.
- **Recovery:** on Control Plane restart, clients resync from their last cursor. In-flight commands are reconciled by idempotency key (no duplicate side effects).
- **No exactly-once claim:** at-least-once delivery with idempotent handlers; duplicates are deduplicated by idempotency key.

## 5. Personal-only note

Single Personal Owner means no multi-writer contention from human collaborators. But Agent/Runtime/Connector execution actors still produce writes; the authority model above applies unchanged. Team/multi-tenant authority is out of scope for this phase.

Naming: `PersonalSpace` is canonical; `Workspace`/`workspace_id` is accepted as a compatibility alias during the personal phase. No Organization semantics.

## 6. Consequences

- Positive: unambiguous authority; simple conflict model; supports offline without silent divergence.
- Negative: offline clients cannot accept state; requires Control Plane availability for writes.
- Migration: authority mode change requires data export/import, not in-place toggle.

## 7. Open (not blocked on YU-396)

PowerSync (YU-396) affects **sync transport** (client cache implementation) but NOT the authority model. The single-Control-Plane-writer invariant is accepted independently. PowerSync choice is a separate sync-transport ADR/gate.

- Sync transport (PowerSync vs custom) affects client cache implementation but not authority.
- Self-hosted Hub packaging (Docker Compose) is a deployment decision (Gate D2), not an authority decision.

## 8. Evidence

- Notion 01 §8, docs/05 §9, docs/11 §8, docs/12 §2.
- YU-396 PowerSync spike pending.
