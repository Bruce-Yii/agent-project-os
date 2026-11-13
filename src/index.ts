// WP1-A entry point (experimental scaffold).
// Tech stack: PROPOSED (TypeScript + Node). Not frozen.
// License: NOT SELECTED (Gate D0). No production dependencies.

export type { PersonalSpace } from "./domain/personal-space.js";
export { createPersonalSpace } from "./domain/personal-space.js";

export type { Project, ProjectStatus, ProjectCurrentState } from "./domain/project.js";
export { canTransitionProject, PROJECT_TRANSITIONS } from "./domain/project.js";

export type { Task, TaskStatus } from "./domain/task.js";
export { canTransitionTask, TASK_TRANSITIONS } from "./domain/task.js";

export type { DependencyEdge } from "./domain/dependency.js";
export { wouldCreateCycle } from "./domain/dependency.js";

export type { Goal } from "./domain/goal.js";

export type { CommandEnvelope, Command, CommandIntent } from "./commands/envelope.js";

export { assertProjectTransition, assertTaskTransition } from "./state/guards.js";
