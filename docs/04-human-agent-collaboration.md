# 04 — Human–Agent Collaboration Model

## 1. Product rule

Humans and Agents are first-class Project participants, but they are not interchangeable identities. A human can own a work outcome while an Agent executes a bounded assignment. A human can also execute a Task directly, and an Agent can collaborate without owning the Task.

## 2. Separate responsibility from execution

A Task should not have one overloaded `assignee` field for all meanings.

| Relation | Question answered | Typical value |
|---|---|---|
| Accountable owner | Who is responsible for the outcome? | Human or team |
| Executor | Who performs this specific work? | Human or Agent Assignment |
| Reviewer | Who assesses the deliverable? | Human or qualified Agent |
| Collaborator | Who contributes? | Human or Agent |
| Watcher | Who needs updates? | Human or team |

Linear's current delegation model demonstrates a useful pattern: a human assignee can remain responsible while an Agent is delegated to work on the Issue. Preserve that distinction without inheriting Linear's single-assignee data constraint as a product-wide limit.

## 3. Collaboration modes

### Mode A — Human-led

Human creates and performs work. Agents may be used for research, drafting, analysis, or review. The Project OS still tracks Tasks, deliverables, and decisions.

### Mode B — Direct Agent

Human selects a Provider/Agent and directly operates its Session. The Session can be linked to a Project or Task, but no Coordinator is required.

### Mode C — Delegated Task

Human defines a Work Package and delegates it to one Agent. The human remains accountable; the Agent executes within the assignment scope and returns evidence.

### Mode D — Coordinated multi-Agent

Coordinator creates or validates a task graph, creates multiple bounded Assignments, and routes independent work to different Agents/Runtimes. Dependencies and shared resources are explicit.

### Mode E — Team + Agent collaboration

Humans and Agents collaborate on the same Project. Human-owned work, Agent-owned execution, reviews, discussions, and decisions remain connected.

## 4. Assignment design

An Assignment should capture:

- task and project identity;
- assigned executor / Agent profile;
- accountable owner;
- runtime and capability requirements;
- task scope, non-scope, constraints, and acceptance criteria;
- authorized actions and risk tier;
- input/context pack references;
- expected output/evidence format;
- assignment version and state;
- created-by and approval provenance.

Reassignment should create a new assignment version or successor Assignment, not silently rewrite history.

## 5. Multi-Agent collaboration

Support:

- fan-out to independent work packages;
- one Agent plans, others execute;
- specialist Agent review;
- Agent-to-Agent handoff;
- subagents within an Agent runtime;
- human takeover and reassignment;
- conflict resolution when outputs overlap;
- aggregation of results into one Project-level view.

Do not force a permanent CEO/manager/worker org chart. Roles may be assigned per Project or per Assignment. Organizational hierarchy can exist for teams that need it, but it is not required for an individual Project.

## 6. Communication and context routing

- Project discussions are not automatically Tasks.
- Task messages can be attached to the Task or Session they concern.
- External conversation Threads can be subscribed to as context.
- A context subscription does not grant authority to act on the source or resource.
- A person’s explicit follow-up may resume an ended work item if its mandate is still valid.
- Agent messages must be attributed to the Agent/Session/Run that produced them.

The DSH Subscription concept is useful for context fan-out, but do not copy its domain object names without validating them against our Project/Task model.

## 7. Attention and human intervention

The user should be interrupted for:

- unresolved scope or product decisions;
- approval-required side effects;
- a real blocker that cannot be safely handled;
- conflicting or ambiguous Project state;
- deliverables requiring review;
- significant project-level changes.

Do not interrupt for every token, tool call, or routine progress update. Keep low-value telemetry in the Run timeline and surface concise summaries.

## 8. Acceptance criteria

- A human can remain accountable while an Agent executes.
- A Task can be human-only, Agent-only within authority, or mixed.
- Multiple Agents can work on independent assignments without sharing unsafe mutable state.
- Direct Agent Session use does not bypass Project permissions or event history.
- The Coordinator is optional for direct work and not a mandatory bottleneck.
- A human can pause, take over, reassign, review, and cancel work at any point permitted by policy.
