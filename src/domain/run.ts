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

// Retry contract: failed/interrupted are terminal for THIS attempt.
// A new attempt creates a NEW Run row with incremented attempt number.
// The same Run cannot be requeued; use StartRun to create a new attempt.
export function canTransitionRun(from: RunStatus, to: RunStatus): boolean {
  const transitions: Record<RunStatus, RunStatus[]> = {
    queued: ["running", "cancelled"],
    running: ["succeeded", "failed", "interrupted", "cancelled"],
    succeeded: [],
    failed: [],       // terminal for this attempt; new attempt via StartRun
    interrupted: [],  // terminal for this attempt; new attempt via StartRun
    cancelled: [],
  };
  return transitions[from]?.includes(to) ?? false;
}