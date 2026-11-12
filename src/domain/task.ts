// Task — bounded unit of work (PC-2, PC-3 subset).

export type TaskId = string;
export type ProjectId = string;

export type TaskStatus = "backlog" | "ready" | "blocked" | "cancelled";

export interface Task {
  readonly id: TaskId;
  readonly projectId: ProjectId;
  title: string;
  scope: string;
  nonScope: string;
  acceptanceCriteria: string;
  parentId: TaskId | null;
  status: TaskStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["ready", "blocked", "cancelled"],
  ready: ["blocked", "cancelled"],
  blocked: ["ready", "cancelled"],
  cancelled: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}