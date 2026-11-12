# Module Contract: <Module Name>

- Module ID: Fxx / Mxx
- Status: Proposed | Approved | Implemented | Verified
- Owner:
- Depends on:
- Source-of-truth document:

## Purpose and user value

## User scenarios

## In scope

## Out of scope

## Domain objects owned

## Inputs and outputs

## Commands and events

## State machine and invariants

## Permissions and external effects

## Failure, retry, and recovery behavior

## Observability and audit

## API / event contracts

## Acceptance criteria

## Acceptance evidence (gates, see docs/46 §2 and §4)

Record evidence for each applicable gate; passing a prior gate is necessary but never sufficient for a later one.

- **MRG — Module Readiness:** accepted bounded contract, dependencies/tested ports, environment, ownership, planned tests, security/effects boundaries, reviewer and rollback. Passes before work begins.
- **Task Acceptance:** correct remote diff, behavior against contract, relevant tests, negative paths, absence of regressions/unapproved side effects, independent review (per-task claim-to-evidence matrix).
- **Module Acceptance:** real consumer completes the promised module-local workflow on actual product code and durable state; domain invariants/persistence; security at real boundaries; failure/recovery with named restarts; integration/compatibility; operability (clean checkout install/build/migrate/run/test, diagnostics, rollback). Mocks are supporting, not proof.
- **Integration Acceptance:** cross-module journey, shared IDs/events/transactions/permissions, failure/recovery, version compatibility, no duplicate effects (see docs/46 §5).
- **Release Acceptance:** intended user full journey, install/upgrade/rollback, security/secret hygiene, observability, supported clients, actual deployment environment.

Remote evidence packet per docs/46 §6 (SHAs, CI run head SHA, claim-to-evidence matrix, reviewer independence, risks/rollback) is mandatory before handoff.

## Tests and verification evidence

## Open questions and ADRs
