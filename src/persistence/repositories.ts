// Repository implementations (Drizzle + pg).
// Tech stack: PROPOSED (P-021).

import { eq, and } from "drizzle-orm";
import type { Db } from "./db.js";
import * as schema from "./schema.js";

export class PersonalSpaceRepository {
  constructor(private db: Db) {}

  async save(space: { id: string; owner: string; version: number }): Promise<void> {
    await this.db
      .insert(schema.personalSpaces)
      .values({ id: space.id, owner: space.owner, version: space.version })
      .onConflictDoUpdate({
        target: schema.personalSpaces.id,
        set: { owner: space.owner, version: space.version },
      });
  }

  async findById(id: string): Promise<typeof schema.personalSpaces.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(schema.personalSpaces)
      .where(eq(schema.personalSpaces.id, id));
    return rows[0] ?? null;
  }

  async findByOwner(owner: string): Promise<typeof schema.personalSpaces.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(schema.personalSpaces)
      .where(eq(schema.personalSpaces.owner, owner));
    return rows[0] ?? null;
  }
}

export class ProjectRepository {
  constructor(private db: Db) {}

  async save(project: {
    id: string;
    spaceId: string;
    name: string;
    goal: string;
    status: string;
    currentState: string | null;
    currentStateFreshness: string | null;
    currentStateSource: string | null;
    version: number;
    expectedVersion?: number;
  }): Promise<{ ok: boolean; reason?: string }> {
    // Atomic CAS: if expectedVersion is provided, only update if current version matches.
    if (project.expectedVersion !== undefined && project.expectedVersion !== null) {
      const result = await this.db
        .update(schema.projects)
        .set({
          name: project.name,
          goal: project.goal,
          status: project.status,
          currentState: project.currentState,
          currentStateFreshness: project.currentStateFreshness,
          currentStateSource: project.currentStateSource,
          version: project.version,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.projects.id, project.id),
            eq(schema.projects.version, project.expectedVersion),
          ),
        )
        .returning({ id: schema.projects.id });
      if (result.length === 0) {
        return { ok: false, reason: "STALE_VERSION" };
      }
      return { ok: true };
    }
    // No version check (initial insert or forced update).
    await this.db
      .insert(schema.projects)
      .values({
        id: project.id,
        spaceId: project.spaceId,
        name: project.name,
        goal: project.goal,
        status: project.status,
        currentState: project.currentState,
        currentStateFreshness: project.currentStateFreshness,
        currentStateSource: project.currentStateSource,
        version: project.version,
      })
      .onConflictDoUpdate({
        target: schema.projects.id,
        set: {
          name: project.name,
          goal: project.goal,
          status: project.status,
          currentState: project.currentState,
          currentStateFreshness: project.currentStateFreshness,
          currentStateSource: project.currentStateSource,
          version: project.version,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  }

  async findById(id: string): Promise<typeof schema.projects.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id));
    return rows[0] ?? null;
  }

  async findBySpace(spaceId: string): Promise<(typeof schema.projects.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.spaceId, spaceId));
  }
}

export class TaskRepository {
  constructor(private db: Db) {}

  async save(task: {
    id: string;
    projectId: string;
    title: string;
    scope: string;
    nonScope: string;
    acceptanceCriteria: string;
    parentId: string | null;
    status: string;
    version: number;
    expectedVersion?: number;
  }): Promise<{ ok: boolean; reason?: string }> {
    // Atomic CAS: if expectedVersion is provided, only update if current version matches.
    if (task.expectedVersion !== undefined && task.expectedVersion !== null) {
      const result = await this.db
        .update(schema.tasks)
        .set({
          title: task.title,
          scope: task.scope,
          nonScope: task.nonScope,
          acceptanceCriteria: task.acceptanceCriteria,
          parentId: task.parentId,
          status: task.status,
          version: task.version,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.tasks.id, task.id),
            eq(schema.tasks.version, task.expectedVersion),
          ),
        )
        .returning({ id: schema.tasks.id });
      if (result.length === 0) {
        return { ok: false, reason: "STALE_VERSION" };
      }
      return { ok: true };
    }
    // No version check (initial insert or forced update).
    await this.db
      .insert(schema.tasks)
      .values({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        scope: task.scope,
        nonScope: task.nonScope,
        acceptanceCriteria: task.acceptanceCriteria,
        parentId: task.parentId,
        status: task.status,
        version: task.version,
      })
      .onConflictDoUpdate({
        target: schema.tasks.id,
        set: {
          title: task.title,
          scope: task.scope,
          nonScope: task.nonScope,
          acceptanceCriteria: task.acceptanceCriteria,
          parentId: task.parentId,
          status: task.status,
          version: task.version,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  }

  async findById(id: string): Promise<typeof schema.tasks.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, id));
    return rows[0] ?? null;
  }

  async findByProject(projectId: string): Promise<(typeof schema.tasks.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId));
  }
}

export class GoalRepository {
  constructor(private db: Db) {}

  async save(goal: { id: string; projectId: string; title: string; description: string }): Promise<void> {
    await this.db
      .insert(schema.goals)
      .values({ id: goal.id, projectId: goal.projectId, title: goal.title, description: goal.description })
      .onConflictDoUpdate({
        target: schema.goals.id,
        set: { title: goal.title, description: goal.description, updatedAt: new Date() },
      });
  }

  async findByProject(projectId: string): Promise<(typeof schema.goals.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.goals)
      .where(eq(schema.goals.projectId, projectId));
  }
}

export class AgentSessionRepository {
  constructor(private db: Db) {}

  async save(session: {
    id: string;
    providerSessionId: string;
    provider: string;
    cwd?: string | null;
    title?: string | null;
    status?: string;
    projectId?: string | null;
    taskId?: string | null;
    assignmentId?: string | null;
    capabilities?: string | null;
  }): Promise<void> {
    await this.db
      .insert(schema.agentSessions)
      .values({
        id: session.id,
        providerSessionId: session.providerSessionId,
        provider: session.provider,
        cwd: session.cwd ?? null,
        title: session.title ?? null,
        status: session.status ?? "idle",
        projectId: session.projectId ?? null,
        taskId: session.taskId ?? null,
        assignmentId: session.assignmentId ?? null,
        capabilities: session.capabilities ?? null,
      })
      .onConflictDoUpdate({
        target: schema.agentSessions.id,
        set: {
          providerSessionId: session.providerSessionId,
          provider: session.provider,
          cwd: session.cwd ?? null,
          title: session.title ?? null,
          status: session.status ?? "idle",
          projectId: session.projectId ?? null,
          taskId: session.taskId ?? null,
          assignmentId: session.assignmentId ?? null,
          capabilities: session.capabilities ?? null,
          updatedAt: new Date(),
        },
      });
  }

  async findById(id: string): Promise<typeof schema.agentSessions.$inferSelect | null> {
    const rows = await this.db
      .select()
      .from(schema.agentSessions)
      .where(eq(schema.agentSessions.id, id));
    return rows[0] ?? null;
  }

  async findByProject(projectId: string): Promise<(typeof schema.agentSessions.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.agentSessions)
      .where(eq(schema.agentSessions.projectId, projectId));
  }

  async findAll(): Promise<(typeof schema.agentSessions.$inferSelect)[]> {
    return this.db.select().from(schema.agentSessions);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db
      .update(schema.agentSessions)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.agentSessions.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.agentSessions).where(eq(schema.agentSessions.id, id));
  }
}

export class DependencyRepository {
  constructor(private db: Db) {}

  async save(edge: { id: string; sourceTaskId: string; targetTaskId: string }): Promise<void> {
    await this.db
      .insert(schema.dependencyEdges)
      .values({ id: edge.id, sourceTaskId: edge.sourceTaskId, targetTaskId: edge.targetTaskId })
      .onConflictDoNothing();
  }

  async findByTarget(targetTaskId: string): Promise<(typeof schema.dependencyEdges.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.dependencyEdges)
      .where(eq(schema.dependencyEdges.targetTaskId, targetTaskId));
  }

  async findBySource(sourceTaskId: string): Promise<(typeof schema.dependencyEdges.$inferSelect)[]> {
    return this.db
      .select()
      .from(schema.dependencyEdges)
      .where(eq(schema.dependencyEdges.sourceTaskId, sourceTaskId));
  }
}
export class AssignmentRepository {
  constructor(private db: Db) {}
  async save(a: { id: string; taskId: string; agentId: string; runtimeId?: string | null; status?: string }) {
    await this.db.insert(schema.assignments).values({
      id: a.id, taskId: a.taskId, agentId: a.agentId, runtimeId: a.runtimeId ?? null, status: a.status ?? "pending",
    }).onConflictDoUpdate({ target: schema.assignments.id, set: { status: a.status ?? "pending", updatedAt: new Date() } });
  }
  async findById(id: string) {
    const rows = await this.db.select().from(schema.assignments).where(eq(schema.assignments.id, id));
    return rows[0] ?? null;
  }
  async findByTask(taskId: string) {
    return this.db.select().from(schema.assignments).where(eq(schema.assignments.taskId, taskId));
  }
  async findAll() { return this.db.select().from(schema.assignments); }
  async updateStatus(id: string, status: string) {
    await this.db.update(schema.assignments).set({ status, updatedAt: new Date() }).where(eq(schema.assignments.id, id));
  }
}

export class RunRepository {
  constructor(private db: Db) {}
  async save(r: { id: string; assignmentId: string; attempt?: number; status?: string; idempotencyKey?: string | null }) {
    await this.db.insert(schema.runs).values({
      id: r.id, assignmentId: r.assignmentId, attempt: r.attempt ?? 1, status: r.status ?? "queued", idempotencyKey: r.idempotencyKey ?? null,
    }).onConflictDoUpdate({ target: schema.runs.id, set: { status: r.status ?? "queued", updatedAt: new Date() } });
  }
  async findById(id: string) {
    const rows = await this.db.select().from(schema.runs).where(eq(schema.runs.id, id));
    return rows[0] ?? null;
  }
  async findByAssignment(assignmentId: string) {
    return this.db.select().from(schema.runs).where(eq(schema.runs.assignmentId, assignmentId));
  }
  async findAll() { return this.db.select().from(schema.runs); }
  async updateStatus(id: string, status: string) {
    await this.db.update(schema.runs).set({ status, updatedAt: new Date() }).where(eq(schema.runs.id, id));
  }
}

export class ArtifactRepository {
  constructor(private db: Db) {}
  async save(a: { id: string; runId: string; kind: string; immutableRef: string }) {
    await this.db.insert(schema.artifacts).values({ id: a.id, runId: a.runId, kind: a.kind, immutableRef: a.immutableRef });
  }
  async findById(id: string) {
    const rows = await this.db.select().from(schema.artifacts).where(eq(schema.artifacts.id, id));
    return rows[0] ?? null;
  }
  async findByRun(runId: string) {
    return this.db.select().from(schema.artifacts).where(eq(schema.artifacts.runId, runId));
  }
}

export class ReviewRepository {
  constructor(private db: Db) {}
  async save(r: { id: string; taskId: string; runId?: string | null; verdict?: string; evidenceRefs?: string | null }) {
    await this.db.insert(schema.reviews).values({
      id: r.id, taskId: r.taskId, runId: r.runId ?? null, verdict: r.verdict ?? "pending", evidenceRefs: r.evidenceRefs ?? null,
    }).onConflictDoUpdate({ target: schema.reviews.id, set: { verdict: r.verdict ?? "pending", evidenceRefs: r.evidenceRefs ?? null, updatedAt: new Date() } });
  }
  async findById(id: string) {
    const rows = await this.db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return rows[0] ?? null;
  }
  async findByTask(taskId: string) {
    return this.db.select().from(schema.reviews).where(eq(schema.reviews.taskId, taskId));
  }
  async findAll() { return this.db.select().from(schema.reviews); }
  async updateVerdict(id: string, verdict: string) {
    await this.db.update(schema.reviews).set({ verdict, updatedAt: new Date() }).where(eq(schema.reviews.id, id));
  }
}
