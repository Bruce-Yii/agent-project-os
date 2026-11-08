# Agent Project OS

> Development documentation · v0.2 · 2026-11-09  
> Working name; product brand is not frozen.

An independent, Project-centered operating system for humans and multiple AI Agents to organize long-lived work across projects, tasks, knowledge, execution environments, tools, and devices.

**The product is organized around Projects, not Agent chats.** People own goals and important decisions. The system maintains project and work state. Humans and Agents can both participate in work. Agent Sessions, Runs, Providers, and machines are replaceable execution resources.

This repository is a product and engineering design baseline. It is not an implementation repository yet.

## Current status

- Product direction: confirmed at the concept level by the product owner.
- Full capability scope: preserved; implementation may be staged, but the product is not reduced to an Agent client or execution relay.
- Domain model and architecture: design proposals; review required before schema/API freeze.
- Code: not started in this repository.
- Release / production evidence: none.
- Local Agent Session: Desktop must create/open a local Agent Session and continuously receive new messages.

## Read in dependency order

| Order | Document | Main question |
|---:|---|---|
| 00 | [Product charter](docs/00-product-charter.md) | Why this product, for whom, and what must remain true? |
| 01 | [Functional catalog](docs/01-functional-catalog.md) | What capabilities belong to the complete product? |
| 02 | [Domain model](docs/02-domain-model.md) | What are the durable objects, relations, states, and authorities? |
| 03 | [Project and work management](docs/03-project-and-work-management.md) | How do Projects, Goals, Tasks, dependencies, and Current State work? |
| 04 | [Human–Agent collaboration](docs/04-human-agent-collaboration.md) | How do humans and Agents share responsibility and work? |
| 05 | [Execution and runtime](docs/05-execution-runtime.md) | How are assignments, runs, sessions, runtimes, and recovery represented? |
| 06 | [Delivery, review, and governance](docs/06-review-delivery-governance.md) | How do we prove work is done and authorize side effects? |
| 07 | [Orchestration and autonomy](docs/07-orchestration-and-autonomy.md) | How are work planned, routed, triggered, and continued? |
| 08 | [Knowledge and context](docs/08-knowledge-context-memory.md) | How does durable project knowledge inform execution? |
| 09 | [Client experience](docs/09-client-experience.md) | How should Desktop, Mobile, and Web expose the same Project OS? |
| 10 | [Plugins and integrations](docs/10-plugins-integrations.md) | How do Providers and external systems connect safely? |
| 11 | [Platform, security, and reliability](docs/11-platform-security-reliability.md) | What infrastructure makes the product dependable? |
| 12 | [Development sequence](docs/12-development-roadmap.md) | In what dependency order should the system be built? |
| 13 | [Competitor and reuse analysis](docs/13-competitor-and-reuse-analysis.md) | What should be learned from existing products and projects? |
| 14 | [Open decisions](docs/14-open-decisions.md) | What is confirmed, proposed, or unresolved? |
| 15 | [Glossary](docs/15-glossary.md) | What do the terms mean? |
| 16 | [Source traceability](docs/16-source-traceability.md) | Where did each capability and design rule come from? |
| 17 | [Agent development contract](docs/17-agent-development-contract.md) | How should multiple developers and Agent windows work safely? |
| 18 | [Local Agent Session subsystem](docs/18-local-agent-session-subsystem.md) | How does Desktop create/attach local Agent Sessions and continuously receive new messages? |

Templates: [ADR](docs/templates/ADR.md), [Module contract](docs/templates/module-contract.md), [Work package](docs/templates/work-package.md).

## Product invariants

1. Project is stable; windows, Agents, Providers, Sessions, Runs, and machines are dynamic.
2. Task ≠ Assignment ≠ Run ≠ Session.
3. Human responsibility and Agent execution are separate.
4. Agent completion is not acceptance; acceptance requires evidence.
5. Direct Agent use and coordinated multi-Agent work are both first-class.
6. Project management is broader than coding.
7. Autonomous execution is a sub-capability, not the product identity.
8. External systems retain authority over their live facts.
9. The complete product scope remains visible; delivery is staged by dependency.
10. Complexity must reduce user coordination, not create more of it.
11. Local Agent Sessions are a first-class Desktop capability.
12. Direct Session use is supported without a Task; Project/Task/Run binding is explicit.

## Status labels

- `CONFIRMED`: explicitly established by the product owner.
- `PROPOSED`: a design recommendation; not yet frozen.
- `VALIDATION REQUIRED`: depends on current code, external API, user research, licensing, or a real test.
- `REJECTED / NON-GOAL`: explicitly not part of the intended product direction.
- `IMPLEMENTED`: may only be used after code exists and independent verification passes.

Do not promote a proposal to a confirmed decision just because it appears in a document.

## Primary lineage

- [AWRP repository](https://github.com/Bruce-Yii/agent-relay) — historical protocol and implementation evidence.
- [Linear Personal Project OS](https://linear.app/yi383775/project/personal-project-oslinear-notion-governance-a75ee24846a2) — actual Linear + Notion operating model.
- [Notion product definition](https://app.notion.com/p/40f1e795caee812cb4e6d122fea4d784) and [system architecture](https://app.notion.com/p/40f1e795caee8100a6a9fa9a5de3437d) — current design references.
- [DeepSeek DSH](https://github.com/deepseek-ai/dsh-superagent-prototype), [Paperclip](https://github.com/paperclipai/paperclip), [Paseo](https://github.com/getpaseo/paseo), [Superset](https://github.com/superset-sh/superset), [OpenHands](https://github.com/All-Hands-AI/OpenHands), [Conductor](https://github.com/Conductor-OSS/conductor).
- Provider references: [Codex App Server](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md), [Claude Agent SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions), [OpenCode Server](https://opencode.ai/docs/server/), [Pi RPC](https://pi.dev/docs/latest/rpc).

## Contribution rules

- Change the document that owns the subject; do not duplicate the same contract.
- Update `14-open-decisions.md` when a material decision changes.
- Record architecture-changing decisions with an ADR.
- Stabilize domain/API contracts before parallel implementation.
- Use isolated branches/worktrees for parallel work; never share one mutable checkout between independent Agents.
- Do not add production code, credentials, private customer data, or Provider secrets to this documentation repository.
