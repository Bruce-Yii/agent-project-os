export type AssignmentStatus = "pending" | "active" | "completed" | "cancelled";

export interface Assignment {
  id: string;
  taskId: string;
  agentId: string;
  runtimeId: string | null;
  status: AssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function canTransitionAssignment(from: AssignmentStatus, to: AssignmentStatus): boolean {
  const transitions: Record<AssignmentStatus, AssignmentStatus[]> = {
    pending: ["active", "cancelled"],
    active: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}