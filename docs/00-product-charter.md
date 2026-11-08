# 00 — Product Charter

**Status:** Product direction confirmed at concept level; target users, detailed interaction, and success thresholds remain hypotheses.  
**Last reviewed:** 2026-11-09

## 1. Product definition

**Agent Project OS** is a project-centered operating environment that unifies long-lived project management, human–Agent collaboration, multi-Agent execution, knowledge, workflows, integrations, and cross-device control.

A user should be able to manage a project as a persistent body of work: its purpose, people, Agents, goals, tasks, decisions, resources, execution history, deliverables, and current state remain connected even when an Agent, model, device, or conversation changes.

The product is not defined by a particular Agent framework. It is not a wrapper around one coding Agent, a clone of Linear, or a port of DeepSeek DSH.

## 2. Core user problem

The AWRP → Linear operating history exposed a recurring organizational problem:

- A Project outlives a chat window, local session, Agent process, and individual task.
- Work is spread across Notion, Linear, GitHub, local workspaces, Agent sessions, and external tools.
- Humans repeatedly translate goals into tasks, move context between Agents, check status, chase handoffs, reconstruct state, and validate claimed completion.
- Existing tools each cover part of the workflow, but the user still acts as the manual integration layer.
- A system that only improves Agent execution can still leave the human managing the surrounding project manually.

**Product value:** move the user from manually operating many Agent conversations to managing durable Projects in which people, Agents, tools, and work products are organized together.

## 3. Product north star

For a given level of project complexity:

- reduce time and attention spent manually coordinating Agents and reconstructing work;
- increase the amount of work that is genuinely completed and accepted against explicit criteria;
- preserve user control over decisions, permissions, and consequential side effects.

Candidate measurement model:

`Accepted project outcomes / (human coordination time + execution cost + rework)`

This is a measurement hypothesis, not a finalized metric.

## 4. Intended users (hypotheses)

1. **High-frequency AI users:** individuals running several long-lived projects with multiple Agent providers and external tools.
2. **Project owners / AI product managers:** people coordinating research, product, engineering, operations, and deliverables across humans and Agents.
3. **Small cross-functional teams:** teams that need a shared Project view while allowing each member and Agent to execute through their preferred tools.
4. **Developers and researchers:** users who need local runtimes, isolated workspaces, multi-Agent execution, evidence, and review.

The product is not coding-only. Coding is an important integration-rich scenario, not the boundary of the domain model.

## 5. Product scope — full capability map

The full product includes all 32 functional groups in [01 — Functional Catalog](01-functional-catalog.md):

- workspace and organization;
- portfolio, project, goals, milestones, lifecycle;
- task hierarchy, dependencies, intake, triage, current state;
- human and Agent participation, collaboration, discussion;
- Agent registry, direct sessions, delegation, multi-Agent coordination;
- assignments, runs, runtime nodes, local/remote execution;
- workflows, triggers, planning, autonomous execution as a sub-capability;
- knowledge, project memory, skills, Project bootstrap templates, and inspectable Context Packs;
- plugins, third-party integrations, cross-Provider Context Handoff, and guided migration;
- unified Attention Inbox, Project calendar/capacity planning, and universal Search/Command Palette;
- deliverables, evidence, review, approval, policy, audit;
- visualization, Desktop/Mobile/Web, attention center;
- observability, cost, data portability, reliability, and deployment.

**Complete scope is retained.** Engineering order can be staged; that does not authorize deleting or redefining a capability from the product vision.

## 6. Core experience principles

### 6.1 People stand at the Project level

The default view is a Project or portfolio view, not a forced Agent chat. Users see goals, progress, task relationships, participants, active execution, risks, deliverables, and decisions. They can drill down to any Task, Run, Session, Artifact, or external source when needed.

### 6.2 People and Agents are both participants

The system must support human-only work, Agent-only execution within an authorized scope, and mixed collaboration. Do not assume every Task needs an Agent or every Project needs an AI manager.

### 6.3 Direct and coordinated Agent usage coexist

A user can open a specific local or remote Agent directly. A user can also delegate a bounded Task to a Coordinator that plans and dispatches work across multiple Agents. Neither mode should break the same Project/Task state model.

### 6.4 Project continuity is independent of execution continuity

Closing a window, changing Agent providers, moving between devices, or replacing a runtime must not erase the Project or its Work Package history.

### 6.5 Review is based on evidence

A report is not proof. Deliverables, source versions, tests, external state, and acceptance criteria must be available to the reviewer. Human approval is required for actions whose risk or authority demands it.

### 6.6 The system should absorb coordination complexity

The user should not need to manually route every message, create a new Task for each retry, or keep every Agent window alive. Avoid adding process steps that do not improve a user-visible outcome.

## 7. Important product boundaries

| Not the product | Correct interpretation |
|---|---|
| AWRP v2 | AWRP is a source of execution reliability and handoff principles, not the product boundary. |
| Linear clone | Linear's project/task model is a reference; our model must also represent Agents, Runs, Sessions, context, tools, and cross-project execution. |
| Agent chat launcher | Directly opening local Agents is one feature inside a wider Project OS. |
| DeepSeek DSH port | DSH provides event-driven execution and authorization ideas; our system remains provider- and project-framework-agnostic. |
| AI company simulator | Agent roles and delegation can be modeled without forcing a CEO/org-chart metaphor. |
| Autonomous personal task bot | Autonomous execution is one sub-capability within project management and collaboration. |
| Skill marketplace alone | Skills are reusable behavior packages; they do not own project/task state or grant permissions. |

## 8. Key user journeys

### Journey A — Mixed human/Agent project

Create a Project → define goals and milestones → connect repositories and documents → invite human participants → define Work Packages → assign human accountability and Agent execution separately → review progress and dependencies → inspect deliverables → accept or request changes → preserve decisions and current state.

### Journey B — Direct local Agent session

Connect a local Agent provider → select a Project and working directory → open or resume a Session → interact directly → attach the Session and resulting Artifacts to a Task or Project → allow later review and coordination without losing the session's provenance.

### Journey C — Multi-Agent task delegation

Describe an outcome → Coordinator assembles authorized Project context → proposes a bounded task graph and acceptance criteria → user approves required decisions → Scheduler assigns independent work to suitable Agents/runtimes → execution is isolated → results are reviewed → downstream work becomes eligible.

### Journey D — Cross-device project control

Desktop runs local work → phone/Web shows the same canonical Project state → user reviews a result or makes a decision → the command reaches an online local Daemon or remote runtime → execution continues and its result returns to the Project.

### Journey E — Autonomous execution sub-capability

A user has a validated personal execution Skill distilled from their established Agent workflow. Within an explicitly authorized Project/Task scope, the autonomy feature can use that Skill as an execution method. The Project OS still owns state, permissions, scheduling, Runtime, evidence, and review. The Skill is not a separate product or a second execution engine.

## 9. Product success indicators (to validate)

- time spent manually coordinating Agent work per accepted deliverable;
- percentage of delegated work accepted without repeated context reconstruction;
- task duplication and stale-state rate;
- handoff delivery and session recovery success;
- time from result submission to verified acceptance;
- cross-device intervention success;
- percentage of user notifications that require a meaningful action;
- rate of unauthorized or duplicated external side effects;
- cost per accepted outcome.

## 10. Product decision status

**Confirmed:** independent complete product; Project-centered; durable Project/Task state; multi-Agent; direct local Agent access through plugins; Desktop + Mobile + Web; external integrations; visualization; humans operate at Project level; learn from DSH without binding to it; full scope must not be weakened.

**Not frozen:** initial customer segment, monetization, open-source strategy, detailed UI, exact object schema, runtime deployment topology, technology stack, autonomy policy, and launch sequencing.

