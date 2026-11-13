// State machine guards (PC-3 subset for WP1-A).

import { ProjectStatus, canTransitionProject } from "../domain/project.js";
import { TaskStatus, canTransitionTask } from "../domain/task.js";

export function assertProjectTransition(from: ProjectStatus, to: ProjectStatus): void {
  if (!canTransitionProject(from, to)) {
    throw new Error(`Invalid project transition: ${from} -> ${to}`);
  }
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
  }
}