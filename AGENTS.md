# Agent Instructions — Agent Project OS

Read the root `README.md` first. Before changing product behavior or shared contracts, read:

1. `docs/00-product-charter.md`
2. `docs/01-functional-catalog.md`
3. `docs/02-domain-model.md`
4. the module-specific design document you are changing
5. `docs/14-open-decisions.md`
6. `docs/17-agent-development-contract.md`
7. `docs/18-local-agent-session-subsystem.md` when touching Provider adapters, Session, Daemon, message streaming, terminal, or cross-device Session control.

## Product constraints

- The product is a complete, Project-centered OS for humans and multiple Agents. Do not narrow it into a coding-agent launcher, chat UI, Linear clone, or DSH port.
- Preserve the full 32-group functional scope. Implementation order may be staged; product scope may not be silently deleted.
- Project is durable. Task, Assignment, Run, and Session are different objects.
- Human accountability and Agent execution are separate.
- Direct Agent use and Coordinator-driven work both remain supported.
- Desktop must create/open local Agent Sessions and continuously receive new messages. Do not reduce this to a link-out or one-shot CLI invocation.
- Keep Project OS Session identity, ProviderSessionRef, RuntimeProcess, and SessionConnection distinct.
- Continuous streaming requires backpressure, event cursors, reconnect/reconciliation, deduplication, and explicit event-gap handling; never claim a complete transcript if events were missed.
- Prefer official structured Provider APIs/SDKs/protocols; terminal UI automation is an opaque fallback and must expose its limitations.
- A direct Session may exist without a Task; explicit Project/Task binding is auditable and cannot silently cross context/permission boundaries.
- Autonomous execution is a sub-capability. Personal Execution Skill is a supporting method input, not a separate product, state engine, or permission grant.
- A Run handoff is not Task acceptance. Review requires evidence.
- External systems own their live facts. Do not replace GitHub/Notion/Feishu truth with stale local copies.
- Technology choices and proposed schema are not frozen unless an accepted ADR says otherwise.

## Work discipline

- Before creating a new abstraction, search the existing domain model and feature catalog.
- Before creating a new Task, search for an existing Work Package with the same outcome boundary.
- Do not create a new Task/Issue for every Agent run, retry, or status refresh.
- Keep one owner per shared contract/schema file during parallel work.
- Use a separate branch/worktree for independent workstreams. Never share one mutable checkout between concurrent coding Agents.
- Do not reset, stash, discard, force-push, or overwrite another worker's uncommitted changes.
- Do not change a domain contract without an ADR and impact review.
- Enforce permissions in code/runtime boundaries, not only in prompts.
- Never place secrets in prompts, code, docs, logs, or artifacts.

## Evidence and completion

- Do not claim code, tests, or external actions succeeded without observing the actual result.
- Report exact changed files, branch/commit, tests and output, acceptance evidence, external side effects, remaining risks, and next action.
- Read back external writes when supported.
- If an external side effect has an unknown outcome, reconcile before retrying.
- Update the owning documentation and `docs/14-open-decisions.md` when a material decision changes.

