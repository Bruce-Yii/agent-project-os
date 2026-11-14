export interface Artifact {
  id: string;
  runId: string;
  kind: string;
  immutableRef: string;
  createdAt: Date;
}