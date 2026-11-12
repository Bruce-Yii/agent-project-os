// Goal — outcome description under a Project (PC-2).

export type GoalId = string;
export type ProjectId = string;

export interface Goal {
  readonly id: GoalId;
  readonly projectId: ProjectId;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}