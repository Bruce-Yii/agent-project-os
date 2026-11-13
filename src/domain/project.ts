// Project — durable center (PC-2, PC-3).

export type ProjectId = string;
export type PersonalSpaceId = string;

export type ProjectStatus = "draft" | "active" | "paused" | "archived" | "closed";

export interface Project {
  readonly id: ProjectId;
  readonly spaceId: PersonalSpaceId;
  name: string;
  goal: string;
  status: ProjectStatus;
  currentState: ProjectCurrentState | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCurrentState {
  readonly projectId: ProjectId;
  summary: string;
  freshness: string; // ISO timestamp of last update
  source: "owner" | "derived";
  version: number;
}

export const PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  draft: ["active"],
  active: ["paused", "archived", "closed"],
  paused: ["active"],
  archived: ["active"],
  closed: [],
};

export function canTransitionProject(from: ProjectStatus, to: ProjectStatus): boolean {
  return PROJECT_TRANSITIONS[from]?.includes(to) ?? false;
}