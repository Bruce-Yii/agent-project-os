# 03 — Project and Work Management

## 1. Project is the stable work container

A Project is not a repository, a chat, an Agent, or a list of tasks alone. It is a durable work context with a purpose, outcomes, participants, resources, tasks, decisions, deliverables, and current state.

Project must support:
- individual and team work;
- multiple repositories and external resources;
- multiple workstreams and subprojects;
- human-only, Agent-assisted, and mixed execution;
- long periods of dormancy and later resumption;
- cross-window and cross-device continuity.

## 2. Project information model

Recommended Project sections:

1. **Overview:** purpose, outcome, owner, status, dates, health, current phase.
2. **Goals & Milestones:** outcomes and staged checkpoints.
3. **Work:** task list, board, hierarchy, dependencies, timeline.
4. **People & Agents:** accountable owners, collaborators, active assignments, Agent availability.
5. **Discussions & Decisions:** threads, decision records, unresolved questions.
6. **Knowledge & Resources:** docs, repositories, links, environments, external systems.
7. **Deliverables & Reviews:** PRs, files, reports, demos, evidence, accepted outputs.
8. **Activity:** meaningful state changes, Agent handoffs, external updates, approvals.

This is one Project workspace with multiple views, not eight independent products.

## 3. Project hierarchy

Candidate hierarchy:

`Workspace → Portfolio/Initiative → Project → Subproject/Workstream → Goal/Milestone → Task`

The hierarchy is for navigation and aggregation. It does not replace dependency relationships.

A Project can span more than one repository, team, or Agent provider. A repository may serve more than one Project. Do not equate Project ID with repository ID.

## 4. Work Package rules

A Task/Work Package must have a meaningful work boundary:

- a goal or expected outcome;
- scope and non-scope;
- constraints and relevant context;
- acceptance criteria;
- owner/accountability;
- optional executor/Agent assignment;
- dependencies and evidence references where relevant.

Do not create a new Task for each Agent run, retry, status refresh, or small correction. Reuse the existing Task while the work boundary remains the same. Create a new Task only when a genuinely independent outcome, ownership boundary, or acceptance boundary exists.

This rule carries forward the practical Linear Issue-creation contract: Issues represented bounded Work Packages; Run-level churn stayed inside the existing Issue's execution history.

## 5. Task hierarchy and dependency graph

- Parent/child means decomposition.
- Dependency means ordering/constraint.
- `blocks`, `blocked_by`, `related_to`, `duplicates`, `supersedes` are distinct relations.
- A Task can be a child of one parent in the primary hierarchy but have multiple dependencies.
- Dependency cycles must be rejected or explicitly represented as a non-executable planning relation.
- Cross-project dependencies are allowed only with explicit visibility and permission.

## 6. Intake and Triage

New work can arrive from a person, integration, Agent discovery, workflow, or external event.

Recommended intake pipeline:

1. Normalize incoming request/event and retain source identity.
2. Resolve Workspace and candidate Project.
3. Search for an existing matching Task or Decision.
4. Classify: new Work Package, follow-up, context-only message, duplicate, or ignore.
5. Evaluate authorization and source policy.
6. Create or update the canonical object only when a real boundary exists.
7. Route unresolved ambiguity to the user or Project owner.

Triage is a staging area, not an alternate source of truth. Accepted items become normal Project Tasks.

## 7. Lifecycle semantics

Candidate task state meanings:

| State | Meaning | Does it imply Agent is running? |
|---|---|---|
| Backlog | Discovered, not ready or not prioritized | No |
| Ready | Scope and acceptance are clear; eligible to start | No |
| In Progress | An owner has actively taken responsibility or execution is active | Usually, but not necessarily |
| Waiting | External dependency, time, approval, or event is awaited | No |
| Blocked | Internal issue prevents progress | No |
| In Review | A deliverable awaits acceptance | No |
| Accepted | Acceptance criteria passed | No |
| Canceled | Intentionally stopped | No |
| Duplicate | Covered by another canonical Task | No |

Run status is independent. A Task may be In Progress while a Run is queued, and a Task may be In Review after the Run ended.

## 8. Project Current State

Current State is a compact, recoverable summary of the Project's actual operational situation, not a long conversation summary.

Candidate fields:

- project goal and current phase;
- status and last verified timestamp;
- active Work Packages and their owners/executors;
- waiting external dependencies and expected next event;
- internal blockers;
- review/approval queue;
- latest accepted deliverables;
- key decisions and constraints;
- concrete next actions;
- links to live external truth and source records.

Current State is assembled from canonical Project/Task/Run/Review state and refreshed external facts. Human-authored conclusions remain distinguishable from generated summaries. It must expose staleness and unknown states.

## 9. Project liveness and dormancy

A Project is operationally Active only when it has at least one current action: active Work Package, explicit waiting dependency, current research/approval gate, or concrete next action. Long-term importance alone does not mean the Project is currently active.

Dormant does not mean deleted or completed. Durable knowledge remains available and the Project can be reactivated.

## 10. Views

- portfolio list/board/timeline;
- Project overview;
- Task list and board;
- task hierarchy/tree;
- dependency graph;
- milestone timeline;
- calendar and workload/capacity;
- blocked/waiting/review inbox;
- people and Agent workload;
- deliverable and decision views.

Views are projections over the same domain model. A change from a board must update the same canonical Task state as a change from a task detail view.

## 11. Acceptance criteria for this domain

- A Project can be created, paused, resumed, archived, and reopened without losing identity or history.
- A Project can contain multiple workstreams and repositories.
- Task hierarchy and dependency graph remain distinct and valid.
- A single Task can contain multiple Run attempts without duplicate Task creation.
- Project Current State can be reconstructed after a new client/window starts.
- Waiting, Blocked, In Review, and Accepted are not conflated.
- Dormant Projects are not falsely shown as active.
- Intake deduplicates and links follow-ups before creating new Work Packages.

