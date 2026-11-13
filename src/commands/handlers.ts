// Handler functions for WP1-A commands.
// Each handler receives a HandlerContext (or (command, context)) and runs inside
// the CommandExecutor's Drizzle transaction.

import { randomUUID } from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import type { Db } from "../persistence/db.js";
import * as schema from "../persistence/schema.js";
import {
  PersonalSpaceRepository,
  ProjectRepository,
  TaskRepository,
  GoalRepository,
  DependencyRepository,
} from "../persistence/repositories.js";
import { createPersonalSpace } from "../domain/personal-space.js";
import { canTransitionProject } from "../domain/project.js";
import { canTransitionTask } from "../domain/task.js";
import { wouldCreateCycle } from "../domain/dependency.js";
import { assertProjectTransition, assertTaskTransition } from "../state/guards.js";
import type { Command, CommandEnvelope } from "./envelope.js";
import type { CommandResult } from "./executor.js";

export interface HandlerContext {
  db: Db;
  command: Command;
  executor?: unknown;
}

function makeRepos(db: Db) {
  return {
    personalSpaces: new PersonalSpaceRepository(db),
    projects: new ProjectRepository(db),
    tasks: new TaskRepository(db),
    goals: new GoalRepository(db),
    dependencies: new DependencyRepository(db),
  };
}

function resolveContext(args: unknown[]): HandlerContext {
  if (args.length === 1 && args[0] && typeof args[0] === "object") {
    const o = args[0] as Record<string, unknown>;
    if (o.command && (o.db || o.tx || o.database || o.repos)) {
      return o as unknown as HandlerContext;
    }
    // maybe a Command passed alone? cannot execute without db; but keep
    if (o.envelope && o.intent) {
      // no db; caller must have attached? fall through
    }
  }
  if (args.length >= 2) {
    const [a, b] = args;
    const isCmd = (x: unknown) =>
      typeof x === "object" && x !== null && "envelope" in (x as object) && "intent" in (x as object);
    if (isCmd(a) && b && typeof b === "object") {
      return { ...(b as object), command: a } as HandlerContext;
    }
    if (isCmd(b) && a && typeof a === "object") {
      return { ...(a as object), command: b } as HandlerContext;
    }
  }
  // fallback: first arg
  return args[0] as HandlerContext;
}

function payload(ctx: HandlerContext): Record<string, unknown> {
  return (ctx.command.payload ?? {}) as Record<string, unknown>;
}

function env(ctx: HandlerContext): CommandEnvelope {
  return ctx.command.envelope;
}

function checkVersion(current: number | null | undefined, expected: number | undefined): void {
  if (expected !== undefined && expected !== null) {
    if (current !== expected) throw new Error("STALE_VERSION");
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

// ---------- BootstrapPersonalSpace ----------

export async function BootstrapPersonalSpace(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);
  const owner = str(p.owner) ?? e.actor;
  const spaceId = str(p.personalSpaceId) ?? str(p.spaceId) ?? e.personalSpaceId ?? `ps-${owner}`;

  const existing = await repos.personalSpaces.findById(spaceId);
  if (existing) {
    checkVersion(existing.version, num(e.expectedVersion));
    return { status: "OK", personalSpaceId: spaceId, owner: existing.owner, version: existing.version, created: false };
  }
  // also check by owner
  const byOwner = await repos.personalSpaces.findByOwner(owner);
  if (byOwner) {
    checkVersion(byOwner.version, num(e.expectedVersion));
    return { status: "OK", personalSpaceId: byOwner.id, owner: byOwner.owner, version: byOwner.version, created: false };
  }

  const space = createPersonalSpace(owner);
  const finalId = spaceId || space.id;
  await repos.personalSpaces.save({ id: finalId, owner, version: 1 });
  return { status: "OK", personalSpaceId: finalId, owner, version: 1, created: true };
}

// ---------- CreateProject ----------

export async function CreateProject(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const spaceId = str(p.spaceId) ?? str(p.personalSpaceId) ?? e.personalSpaceId;
  // ensure space exists
  let space = spaceId ? await repos.personalSpaces.findById(spaceId) : null;
  if (!space) {
    const owner = e.actor;
    const sid = spaceId ?? `ps-${owner}`;
    const byOwner = await repos.personalSpaces.findByOwner(owner);
    if (byOwner) {
      space = byOwner;
    } else {
      await repos.personalSpaces.save({ id: sid, owner, version: 1 });
      space = await repos.personalSpaces.findById(sid);
    }
  }
  const finalSpaceId = space?.id ?? spaceId ?? `ps-${e.actor}`;

  const name = str(p.name) ?? "Untitled Project";
  const goal = str(p.goal) ?? "";
  const projectId = str(p.projectId) ?? str(p.id) ?? `proj-${randomUUID()}`;

  const existing = await repos.projects.findById(projectId);
  if (existing) {
    return { status: "REJECTED", reason: "ALREADY_EXISTS", projectId };
  }

  await repos.projects.save({
    id: projectId,
    spaceId: finalSpaceId,
    name,
    goal,
    status: "draft",
    currentState: null,
    currentStateFreshness: null,
    currentStateSource: null,
    version: 1,
  });

  return { status: "OK", projectId, spaceId: finalSpaceId, name, projectStatus: "draft", entityStatus: "draft", version: 1 };
}

// ---------- UpdateProject ----------

export async function UpdateProject(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const projectId = str(p.projectId) ?? str(p.id) ?? e.projectId;
  if (!projectId) return { status: "REJECTED", reason: "MISSING_PROJECT_ID" };

  const project = await repos.projects.findById(projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };

  // Space ownership check: project must belong to the command's personal space.
  const cmdSpaceId = e.personalSpaceId;
  if (cmdSpaceId && project.spaceId !== cmdSpaceId) {
    return { status: "REJECTED", reason: "unauthorized" };
  }

  checkVersion(project.version, num(e.expectedVersion));

  const name = str(p.name) ?? project.name;
  const goal = str(p.goal) ?? project.goal;

  const saveResult = await repos.projects.save({
    id: project.id,
    spaceId: project.spaceId,
    name,
    goal,
    status: project.status,
    currentState: project.currentState,
    currentStateFreshness: project.currentStateFreshness,
    currentStateSource: project.currentStateSource,
    version: project.version + 1,
    expectedVersion: project.version,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === "STALE_VERSION") throw new Error("STALE_VERSION");
    return { status: "REJECTED", reason: saveResult.reason ?? "SAVE_FAILED" };
  }

  return { status: "OK", projectId, name, goal, version: project.version + 1 };
}

// helper for status transitions
async function transitionProject(ctx: HandlerContext, target: string): Promise<CommandResult> {
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);
  const projectId = str(p.projectId) ?? str(p.id) ?? e.projectId;
  if (!projectId) return { status: "REJECTED", reason: "MISSING_PROJECT_ID" };
  const project = await repos.projects.findById(projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };

  const cmdSpaceId = e.personalSpaceId;
  if (cmdSpaceId && project.spaceId !== cmdSpaceId) {
    return { status: "REJECTED", reason: "unauthorized" };
  }

  checkVersion(project.version, num(e.expectedVersion));
  if (!canTransitionProject(project.status as any, target as any)) {
    return { status: "REJECTED", reason: "INVALID_TRANSITION" };
  }
  try {
    assertProjectTransition(project.status as any, target as any);
  } catch {
    return { status: "REJECTED", reason: "INVALID_TRANSITION" };
  }

  const saveResult = await repos.projects.save({
    id: project.id,
    spaceId: project.spaceId,
    name: project.name,
    goal: project.goal,
    status: target,
    currentState: project.currentState,
    currentStateFreshness: project.currentStateFreshness,
    currentStateSource: project.currentStateSource,
    version: project.version + 1,
    expectedVersion: project.version,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === "STALE_VERSION") throw new Error("STALE_VERSION");
    return { status: "REJECTED", reason: saveResult.reason ?? "SAVE_FAILED" };
  }

  return { status: "OK", projectId, from: project.status, to: target, version: project.version + 1 };
}

export async function ActivateProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "active");
}
export async function PauseProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "paused");
}
export async function ResumeProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "active");
}
export async function ArchiveProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "archived");
}
export async function RestoreProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "active");
}
export async function CloseProject(...args: unknown[]): Promise<CommandResult> {
  return transitionProject(resolveContext(args), "closed");
}

// ---------- UpdateProjectCurrentState ----------

export async function UpdateProjectCurrentState(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const projectId = str(p.projectId) ?? str(p.id) ?? e.projectId;
  if (!projectId) return { status: "REJECTED", reason: "MISSING_PROJECT_ID" };
  const project = await repos.projects.findById(projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };

  const cmdSpaceId = e.personalSpaceId;
  if (cmdSpaceId && project.spaceId !== cmdSpaceId) {
    return { status: "REJECTED", reason: "unauthorized" };
  }

  checkVersion(project.version, num(e.expectedVersion));

  const summary = str(p.summary) ?? str(p.currentState) ?? "";
  const freshness = str(p.freshness) ?? new Date().toISOString();
  const source = (str(p.source) as "owner" | "derived") ?? "owner";

  const saveResult = await repos.projects.save({
    id: project.id,
    spaceId: project.spaceId,
    name: project.name,
    goal: project.goal,
    status: project.status,
    currentState: summary,
    currentStateFreshness: freshness,
    currentStateSource: source,
    version: project.version + 1,
    expectedVersion: project.version,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === "STALE_VERSION") throw new Error("STALE_VERSION");
    return { status: "REJECTED", reason: saveResult.reason ?? "SAVE_FAILED" };
  }

  // Upsert project_current_states table (within same tx, no error swallowing)
  await db
    .insert(schema.projectCurrentStates)
    .values({
      projectId,
      summary,
      freshness,
      source,
      version: 1,
    })
    .onConflictDoUpdate({
      target: schema.projectCurrentStates.projectId,
      set: { summary, freshness, source, version: sql`${schema.projectCurrentStates.version} + 1` },
    });

  return { status: "OK", projectId, summary, freshness, source, version: project.version + 1 };
}

// ---------- Goals ----------

export async function CreateGoal(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const projectId = str(p.projectId) ?? e.projectId;
  if (!projectId) return { status: "REJECTED", reason: "MISSING_PROJECT_ID" };
  const project = await repos.projects.findById(projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };
  if (num(e.expectedVersion) !== undefined) checkVersion(project.version, num(e.expectedVersion));

  const goalId = str(p.goalId) ?? str(p.id) ?? `goal-${randomUUID()}`;
  const title = str(p.title) ?? "Untitled Goal";
  const description = str(p.description) ?? "";

  await repos.goals.save({ id: goalId, projectId, title, description });
  return { status: "OK", goalId, projectId, title, version: project.version };
}

export async function UpdateGoal(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const projectId = str(p.projectId) ?? e.projectId;
  const goalId = str(p.goalId) ?? str(p.id);
  if (!goalId) return { status: "REJECTED", reason: "MISSING_GOAL_ID" };

  // find goal
  let goalRow: any = null;
  if (projectId) {
    const rows = await repos.goals.findByProject(projectId);
    goalRow = rows.find((r: any) => r.id === goalId) ?? null;
  } else {
    // search all? not available; try direct db
    const rows = await db.select().from(schema.goals).where(eq(schema.goals.id, goalId));
    goalRow = rows[0] ?? null;
  }
  if (!goalRow) return { status: "REJECTED", reason: "NOT_FOUND" };

  const title = str(p.title) ?? goalRow.title;
  const description = str(p.description) ?? goalRow.description;

  await repos.goals.save({ id: goalId, projectId: goalRow.projectId, title, description });
  return { status: "OK", goalId, title, description };
}

export async function DeleteGoal(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const p = payload(ctx);

  const goalId = str(p.goalId) ?? str(p.id);
  if (!goalId) return { status: "REJECTED", reason: "MISSING_GOAL_ID" };

  await db.delete(schema.goals).where(eq(schema.goals.id, goalId));
  return { status: "OK", goalId, deleted: true };
}

// ---------- Tasks ----------

export async function CreateTask(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const projectId = str(p.projectId) ?? e.projectId;
  if (!projectId) return { status: "REJECTED", reason: "MISSING_PROJECT_ID" };
  const project = await repos.projects.findById(projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };
  if (num(e.expectedVersion) !== undefined) checkVersion(project.version, num(e.expectedVersion));

  const taskId = str(p.taskId) ?? str(p.id) ?? `task-${randomUUID()}`;
  const existing = await repos.tasks.findById(taskId);
  if (existing) return { status: "REJECTED", reason: "ALREADY_EXISTS", taskId };

  const parentId = (p.parentId === null ? null : str(p.parentId)) ?? null;
  if (parentId) {
    const parent = await repos.tasks.findById(parentId);
    if (!parent || parent.projectId !== projectId) {
      return { status: "REJECTED", reason: "INVALID_PARENT" };
    }
  }

  await repos.tasks.save({
    id: taskId,
    projectId,
    title: str(p.title) ?? "Untitled Task",
    scope: str(p.scope) ?? "",
    nonScope: str(p.nonScope) ?? str(p.non_scope) ?? "",
    acceptanceCriteria: str(p.acceptanceCriteria) ?? str(p.acceptance_criteria) ?? "",
    parentId,
    status: "backlog",
    version: 1,
  });

  return { status: "OK", taskId, projectId, taskStatus: "backlog", entityStatus: "backlog", version: 1 };
}

export async function UpdateTask(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const taskId = str(p.taskId) ?? str(p.id) ?? e.taskId;
  if (!taskId) return { status: "REJECTED", reason: "MISSING_TASK_ID" };
  const task = await repos.tasks.findById(taskId);
  if (!task) return { status: "REJECTED", reason: "NOT_FOUND" };

  const project = await repos.projects.findById(task.projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };
  const cmdSpaceId = e.personalSpaceId;
  if (cmdSpaceId && project.spaceId !== cmdSpaceId) {
    return { status: "REJECTED", reason: "unauthorized" };
  }

  checkVersion(task.version, num(e.expectedVersion));

  const parentId =
    p.parentId === undefined
      ? task.parentId
      : p.parentId === null
      ? null
      : str(p.parentId) ?? task.parentId;

  const saveResult = await repos.tasks.save({
    id: task.id,
    projectId: task.projectId,
    title: str(p.title) ?? task.title,
    scope: str(p.scope) ?? task.scope,
    nonScope: str(p.nonScope) ?? str(p.non_scope) ?? task.nonScope,
    acceptanceCriteria: str(p.acceptanceCriteria) ?? str(p.acceptance_criteria) ?? task.acceptanceCriteria,
    parentId,
    status: task.status,
    version: task.version + 1,
    expectedVersion: task.version,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === "STALE_VERSION") throw new Error("STALE_VERSION");
    return { status: "REJECTED", reason: saveResult.reason ?? "SAVE_FAILED" };
  }

  return { status: "OK", taskId, version: task.version + 1 };
}

export async function ReparentTask(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const taskId = str(p.taskId) ?? str(p.id) ?? e.taskId;
  if (!taskId) return { status: "REJECTED", reason: "MISSING_TASK_ID" };
  const task = await repos.tasks.findById(taskId);
  if (!task) return { status: "REJECTED", reason: "NOT_FOUND" };
  checkVersion(task.version, num(e.expectedVersion));

  const newParentId = p.parentId === null ? null : str(p.parentId) ?? str(p.newParentId);
  if (newParentId === taskId) {
    return { status: "REJECTED", reason: "INVALID_PARENT" };
  }
  if (newParentId) {
    const parent = await repos.tasks.findById(newParentId);
    if (!parent || parent.projectId !== task.projectId) {
      return { status: "REJECTED", reason: "INVALID_PARENT" };
    }
    // cycle guard: ensure taskId is not an ancestor of newParent
    let cur: string | null = newParentId;
    const visited = new Set<string>();
    while (cur) {
      if (cur === taskId) {
        return { status: "REJECTED", reason: "CYCLE" };
      }
      if (visited.has(cur)) break;
      visited.add(cur);
      const row = await repos.tasks.findById(cur);
      cur = row?.parentId ?? null;
    }
  }

  await repos.tasks.save({
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    scope: task.scope,
    nonScope: task.nonScope,
    acceptanceCriteria: task.acceptanceCriteria,
    parentId: (newParentId ?? null) as string | null,
    status: task.status,
    version: task.version + 1,
  });

  return { status: "OK", taskId, parentId: newParentId, version: task.version + 1 };
}

export async function AddDependency(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);

  const sourceTaskId = str(p.sourceTaskId) ?? str(p.source);
  const targetTaskId = str(p.targetTaskId) ?? str(p.target);
  if (!sourceTaskId || !targetTaskId) {
    return { status: "REJECTED", reason: "MISSING_TASK_IDS" };
  }
  if (sourceTaskId === targetTaskId) {
    return { status: "REJECTED", reason: "SELF_DEPENDENCY" };
  }

  const source = await repos.tasks.findById(sourceTaskId);
  const target = await repos.tasks.findById(targetTaskId);
  if (!source || !target) return { status: "REJECTED", reason: "NOT_FOUND" };
  if (source.projectId !== target.projectId) {
    return { status: "REJECTED", reason: "CROSS_PROJECT" };
  }

  // build edge map for project
  const tasks = await repos.tasks.findByProject(source.projectId);
  const edges = new Map<string, Set<string>>();
  for (const t of tasks) edges.set(t.id, new Set());
  // load existing edges: need all edges for these tasks; use db query
  const existingEdges = await db
    .select()
    .from(schema.dependencyEdges);
  for (const e of existingEdges) {
    if (edges.has(e.targetTaskId)) {
      edges.get(e.targetTaskId)!.add(e.sourceTaskId);
    }
    if (!edges.has(e.sourceTaskId)) edges.set(e.sourceTaskId, new Set());
    if (!edges.has(e.targetTaskId)) edges.set(e.targetTaskId, new Set());
  }

  if (wouldCreateCycle(edges, sourceTaskId, targetTaskId)) {
    return { status: "REJECTED", reason: "CYCLE" };
  }

  await repos.dependencies.save({
    id: `dep-${randomUUID()}`,
    sourceTaskId,
    targetTaskId,
  });

  return { status: "OK", sourceTaskId, targetTaskId };
}

export async function RemoveDependency(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const p = payload(ctx);

  const edgeId = str(p.edgeId) ?? str(p.id);
  const sourceTaskId = str(p.sourceTaskId) ?? str(p.source);
  const targetTaskId = str(p.targetTaskId) ?? str(p.target);

  if (edgeId) {
    await db.delete(schema.dependencyEdges).where(eq(schema.dependencyEdges.id, edgeId));
    return { status: "OK", edgeId, removed: true };
  }
  if (sourceTaskId && targetTaskId) {
    await db
      .delete(schema.dependencyEdges)
      .where(
        and(
          eq(schema.dependencyEdges.sourceTaskId, sourceTaskId),
          eq(schema.dependencyEdges.targetTaskId, targetTaskId)
        )
      );
    return { status: "OK", sourceTaskId, targetTaskId, removed: true };
  }
  return { status: "REJECTED", reason: "MISSING_IDENTIFIERS" };
}

export async function TransitionTaskState(...args: unknown[]): Promise<CommandResult> {
  const ctx = resolveContext(args);
  const db = (ctx.db ?? (ctx as any).tx ?? (ctx as any).database) as Db;
  const repos = makeRepos(db);
  const p = payload(ctx);
  const e = env(ctx);

  const taskId = str(p.taskId) ?? str(p.id) ?? e.taskId;
  if (!taskId) return { status: "REJECTED", reason: "MISSING_TASK_ID" };
  const task = await repos.tasks.findById(taskId);
  if (!task) return { status: "REJECTED", reason: "NOT_FOUND" };

  const project = await repos.projects.findById(task.projectId);
  if (!project) return { status: "REJECTED", reason: "NOT_FOUND" };
  const cmdSpaceId = e.personalSpaceId;
  if (cmdSpaceId && project.spaceId !== cmdSpaceId) {
    return { status: "REJECTED", reason: "unauthorized" };
  }

  checkVersion(task.version, num(e.expectedVersion));

  const toStatus = str(p.toStatus) ?? str(p.status) ?? str(p.to);
  if (!toStatus) return { status: "REJECTED", reason: "MISSING_STATUS" };

  if (!canTransitionTask(task.status as any, toStatus as any)) {
    return { status: "REJECTED", reason: "INVALID_TRANSITION" };
  }
  try {
    assertTaskTransition(task.status as any, toStatus as any);
  } catch {
    return { status: "REJECTED", reason: "INVALID_TRANSITION" };
  }

  const saveResult = await repos.tasks.save({
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    scope: task.scope,
    nonScope: task.nonScope,
    acceptanceCriteria: task.acceptanceCriteria,
    parentId: task.parentId,
    status: toStatus,
    version: task.version + 1,
    expectedVersion: task.version,
  });

  if (!saveResult.ok) {
    if (saveResult.reason === "STALE_VERSION") throw new Error("STALE_VERSION");
    return { status: "REJECTED", reason: saveResult.reason ?? "SAVE_FAILED" };
  }

  return { status: "OK", taskId, from: task.status, to: toStatus, version: task.version + 1 };
}

// Aliases / handle-prefixed exports for compatibility
export const handleBootstrapPersonalSpace = BootstrapPersonalSpace;
export const handleCreateProject = CreateProject;
export const handleUpdateProject = UpdateProject;
export const handleActivateProject = ActivateProject;
export const handlePauseProject = PauseProject;
export const handleResumeProject = ResumeProject;
export const handleArchiveProject = ArchiveProject;
export const handleRestoreProject = RestoreProject;
export const handleCloseProject = CloseProject;
export const handleUpdateProjectCurrentState = UpdateProjectCurrentState;
export const handleCreateGoal = CreateGoal;
export const handleUpdateGoal = UpdateGoal;
export const handleDeleteGoal = DeleteGoal;
export const handleCreateTask = CreateTask;
export const handleUpdateTask = UpdateTask;
export const handleReparentTask = ReparentTask;
export const handleAddDependency = AddDependency;
export const handleRemoveDependency = RemoveDependency;
export const handleTransitionTaskState = TransitionTaskState;

// handlers map
export const handlers: Record<string, (...args: unknown[]) => Promise<CommandResult>> = {
  BootstrapPersonalSpace,
  CreateProject,
  UpdateProject,
  ActivateProject,
  PauseProject,
  ResumeProject,
  ArchiveProject,
  RestoreProject,
  CloseProject,
  UpdateProjectCurrentState,
  CreateGoal,
  UpdateGoal,
  DeleteGoal,
  CreateTask,
  UpdateTask,
  ReparentTask,
  AddDependency,
  RemoveDependency,
  TransitionTaskState,
};