# Work Package: <Outcome>

- ID:
- Owner:
- Workstream:
- Status:
- Depends on:

## Goal

## Scope

## Non-scope

## Hard constraints

## Interfaces

- Consumes:
- Produces:

## Files / modules owned

## Acceptance criteria

## Acceptance contract (see docs/46 §3)

- **Outcome:** observable user/downstream result after the work, with a concrete success example.
- **Scope / non-scope and affected interfaces:** exact input/output, data ownership, state invariants, permissions, externally visible effects.
- **Test oracle:** expected result and exact failure reason/state for positive, negative, and recovery cases; real implementation path, not an implementer-designed simulation.
- **Critical risk gates:** security, data loss, concurrency, billing/cost, irreversible effects, external write, migration, provider disconnect, compatibility as applicable (mark N/A with reason).
- **Independent reviewer and artifact location:** intended GitHub branch/PR path and immutable SHA plus relevant contract version.

## Remote evidence packet (see docs/46 §6)

- Project / Issue / work package / acceptance-contract version / verdict requested.
- Repository, full head and base SHAs, branch, PR, changed paths, diff summary; uncommitted/untracked state.
- Remote locations (with SHAs) of implementation, migration, fixtures, harness, review reports.
- CI run URL/ID with actual head SHA and required job conclusions; commands, counts, skipped/flaky, environment, raw output.
- Claim-to-evidence matrix: acceptance ID → expected → actual → remote file/line/log/CI → reviewer verdict.
- Real scenario evidence (read-after-write, restart/recovery, negatives, side effects); mocks vs real targets labeled.
- Reviewer identity/independence, unresolved risk, impact, rollback, next gate.

## Verification plan

## Risks and external side effects

## Handoff format

## Next action
