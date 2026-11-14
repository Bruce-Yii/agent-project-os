export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "interrupted" | "cancelled";

export interface Run {
  id: string;
  assignmentId: string;
  attempt: number;
  status: RunStatus;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function canTransitionRun(from: RunStatus, to: RunStatus): boolean {
  const transitions: Record<RunStatus, RunStatus[]> = {
    queued: ["running", "cancelled"],
    running: ["succeeded", "failed", "interrupted", "cancelled"],
    succeeded: [],
    failed: ["queued"],
    interrupted: ["queued", "cancelled"],
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}