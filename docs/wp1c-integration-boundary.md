# WP1-C Integration Boundary

## 1. What's real vs mock

### Real (in this mock shell)
- Health check (`GET /api/health`) — reports `mode: mock-in-memory`.
- Capabilities (`GET /v1/capabilities`) — enumerates real vs mock.
- Projects: create / read / list (in-memory, non-persistent).
- Tasks: create / read / list (in-memory; validates `projectId` exists → 404 `PROJECT_NOT_FOUND`).
- Reviews: list pending (in-memory).
- Project current-state read (in-memory stub).
- Input validation: `name`/`title` required non-empty strings.
- IDs use `crypto.randomUUID()` (not `Date.now()`).
- Server binds `127.0.0.1` only.

### Mock / not implemented
- Persistence: no PostgreSQL; in-memory only, lost on restart.
- `POST /v1/commands`: returns `501 NOT_IMPLEMENTED` for every intent. No command execution.
- Agent sessions, providers, runs, assignments, artifacts, approvals: not implemented.
- Current-state writes: not implemented.
- Events / cursors / SSE / WebSocket: not implemented.

## 2. What requires WP1-A Gate 0 PASS
- Real persistence (PostgreSQL + Drizzle) replacing in-memory Maps.
- Domain code for projects/tasks/goals/dependencies/current-state.
- Command envelope processing (`POST /v1/commands` real implementation).
- Migrations, recovery, restart semantics (GP-07).
- WP1-A module contract v0.1 re-issued after Gate 0.

## 3. Package.json conflict and resolution plan

### Conflict
- This WP1-C worktree `package.json` declares Fastify + React + Vite (web/API shell).
- WP1-A worktree declares TypeScript + Drizzle + pg (server domain/persistence).
- Both currently occupy the repository root `package.json` slot in their own worktrees.
- Merging both verbatim would overwrite one toolchain with the other.

### Resolution plan (W0 integration)
- W0 merges worktrees into a single root.
- Combine dependencies: keep both Fastify (WP1-C) and Drizzle/pg/TypeScript (WP1-A) in one root `package.json`.
- Scripts: keep `typecheck` (tsc), `build` (tsc + vite build), `test` (WP1-A), `dev:api`, `dev:web`.
- Until integration, WP1-C keeps its own `package.json` and documents the conflict here.
- WP1-C scripts `npm run typecheck` (node --check) and `npm run build` (vite build) are defined so they do not collide with WP1-A's `tsc`-based toolchain during isolated work.

## 4. API contract (endpoints, request/response shapes)

### Health
- `GET /api/health` → `{ status, service, version, mode: "mock-in-memory" }`

### Capabilities
- `GET /v1/capabilities` → `{ service, version, mode, real[], mock[], requires[] }`

### Projects
- `GET /v1/projects` → `{ projects: Project[] }`
- `GET /v1/projects/:id` → `Project` or 404 `{ reason: "NOT_FOUND" }`
- `POST /v1/projects` body `{ name (required non-empty string), goal? }` → 201 `Project` or 400 `{ reason: "MISSING_NAME" }`
  - `Project`: `{ id ("proj-<uuid>"), name, goal, status: "draft", createdAt (ISO), version: 1 }`

### Tasks
- `GET /v1/projects/:id/tasks` → `{ tasks: Task[] }`
- `POST /v1/tasks` body `{ projectId (required), title (required non-empty string), scope?, acceptanceCriteria? }`
  - → 201 `Task` or 400 `{ reason: "MISSING_FIELDS" }` or 404 `{ reason: "PROJECT_NOT_FOUND" }`
  - `Task`: `{ id ("task-<uuid>"), projectId, title, scope, acceptanceCriteria, status: "backlog", version: 1, createdAt }`

### Commands
- `POST /v1/commands` body `{ intent (required), payload?, envelope? }`
  - → 501 `{ status: "NOT_IMPLEMENTED", intent, mode, message }` (all intents unimplemented)
  - → 400 `{ reason: "MISSING_FIELDS" }` if intent missing

### Current State
- `GET /v1/projects/:id/current-state` → `{ projectId, currentState, version }` or 404

### Reviews
- `GET /v1/reviews/pending` → `{ reviews: Review[] }`

### Error shape
- `{ reason: string, message?: string }` with appropriate HTTP status.