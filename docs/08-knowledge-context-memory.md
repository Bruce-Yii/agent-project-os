# 08 — Knowledge, Project Memory, and Context Assembly

## 1. Purpose

Knowledge exists to help humans and Agents understand the Project and make better decisions. It is not a dumping ground for every Session transcript or execution log.

## 2. Knowledge layers

| Layer | Typical content | Lifetime |
|---|---|---|
| Workspace knowledge | shared standards, organization rules, reusable methods | long-lived |
| Project knowledge | goals, research, architecture, decisions, resources | Project lifetime |
| Task context | task scope, constraints, acceptance, relevant evidence | Task lifetime |
| Session context | provider conversation and recent working context | provider/runtime lifecycle |
| Decision memory | confirmed decisions and supersession history | until superseded/expired |
| Experience memory | reusable methods, verified lessons, high-value failures | reviewed and versioned |

## 3. Provenance model

Every durable knowledge item should preserve:

- source type and source ID/URL;
- author/actor and capture method;
- created/updated time and observed version;
- scope (workspace/project/task/provider);
- confidence/verification status;
- permission/visibility;
- supersedes/superseded-by relation;
- whether it is user-confirmed, Agent-proposed, or externally verified.

A newer timestamp does not automatically make a source more authoritative.

## 4. Context assembly

For each Assignment/Run, assemble a bounded Context Pack:

1. Project purpose and current phase;
2. Task goal, scope, non-scope, hard constraints, acceptance criteria;
3. relevant confirmed decisions and current policies;
4. only the necessary source documents/resources;
5. current Task dependencies and blockers;
6. relevant prior Run summaries and evidence;
7. live external facts with freshness labels;
8. permitted actions and approval boundaries.

Avoid dumping the entire Project history into every Agent prompt. Retrieval must be relevance-, permission-, and freshness-aware.

## 5. Project Current State and memory are different

- **Current State** answers: what is happening now, what is blocked/waiting, what is accepted, and what happens next?
- **Knowledge/Memory** answers: what do we know, why do we believe it, what decisions were made, and what methods have worked?

Current State is operational and frequently refreshed. Knowledge is durable and selectively curated.

## 6. Knowledge extraction gate

After a Task/Project outcome:

- durable result → link to canonical Project knowledge or artifact;
- reusable method → candidate Skill/Knowledge item after validation;
- lasting decision → Decision record with rationale and scope;
- high-value failure → incident/experience record with prevention;
- transient logs and low-value chatter → retain only in execution history/retention store;
- no durable value → do not duplicate mechanically.

## 7. Notion and other external knowledge connectors

Notion can be one Knowledge Provider. It should not be hard-coded as the only native knowledge database or allowed to become an implicit second primary state store.

Connector rules:

- external IDs and page/database relations are mapped explicitly;
- read and write permissions are separate;
- imported material carries provenance and sync version;
- Agent drafts do not overwrite confirmed decisions without an authorized write path;
- execution telemetry is not automatically written back as long-form knowledge;
- conflicts are surfaced, not silently resolved by last-write-wins.

## 8. Acceptance criteria

- Every context item has provenance and permission scope.
- A Task Context Pack can be reconstructed from canonical Project state and references.
- Stale knowledge is identified or superseded rather than silently treated as current.
- Agent output is not automatically promoted to durable memory.
- Knowledge extraction is selective and does not duplicate external source material unnecessarily.

