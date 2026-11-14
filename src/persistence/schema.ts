// Drizzle schema for WP1-A (Personal Project Foundation).
// Tech stack: PostgreSQL + Drizzle (per YU-392 decision pack).
// Tech stack status: PROPOSED (P-021/P-022 not frozen).

import { pgTable, text, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const personalSpaces = pgTable("personal_spaces", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  version: integer("version").notNull().default(1),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  spaceId: text("space_id").notNull().references(() => personalSpaces.id),
  name: text("name").notNull(),
  goal: text("goal").notNull().default(""),
  status: text("status").notNull().default("draft"),
  currentState: text("current_state"),
  currentStateFreshness: text("current_state_freshness"),
  currentStateSource: text("current_state_source"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  scope: text("scope").notNull().default(""),
  nonScope: text("non_scope").notNull().default(""),
  acceptanceCriteria: text("acceptance_criteria").notNull().default(""),
  parentId: text("parent_id"),
  status: text("status").notNull().default("backlog"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dependencyEdges = pgTable("dependency_edges", {
  id: text("id").primaryKey(),
  sourceTaskId: text("source_task_id").notNull().references(() => tasks.id),
  targetTaskId: text("target_task_id").notNull().references(() => tasks.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectCurrentStates = pgTable("project_current_states", {
  projectId: text("project_id").primaryKey().references(() => projects.id),
  summary: text("summary").notNull().default(""),
  freshness: text("freshness").notNull(),
  source: text("source").notNull().default("owner"),
  version: integer("version").notNull().default(1),
});

export const agentSessions = pgTable("agent_sessions", {
  id: text("id").primaryKey(),
  providerSessionId: text("provider_session_id").notNull(),
  provider: text("provider").notNull(),
  cwd: text("cwd"),
  title: text("title"),
  status: text("status").notNull().default("idle"),
  projectId: text("project_id"),
  taskId: text("task_id"),
  assignmentId: text("assignment_id"),
  capabilities: text("capabilities"), // JSON
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  agentId: text("agent_id").notNull(),
  runtimeId: text("runtime_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const runs = pgTable("runs", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull().references(() => assignments.id),
  attempt: integer("attempt").notNull().default(1),
  status: text("status").notNull().default("queued"),
  idempotencyKey: text("idempotency_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  assignmentAttemptUnique: uniqueIndex("runs_assignment_id_attempt_unique").on(table.assignmentId, table.attempt),
}));

export const artifacts = pgTable("artifacts", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull().references(() => runs.id),
  kind: text("kind").notNull(),
  immutableRef: text("immutable_ref").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  runId: text("run_id").references(() => runs.id),
  verdict: text("verdict").notNull().default("pending"),
  evidenceRefs: text("evidence_refs"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});