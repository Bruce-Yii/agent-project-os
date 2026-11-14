export type ReviewVerdict = "pending" | "changes_required" | "accepted" | "rejected";

export interface Review {
  id: string;
  taskId: string;
  runId: string | null;
  verdict: ReviewVerdict;
  evidenceRefs: string | null;
  createdAt: Date;
  updatedAt: Date;
}