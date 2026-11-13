// Command envelope (minimal, per PC-4).

export interface CommandEnvelope {
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly actor: string; // PersonalOwner in WP1-A
  readonly personalSpaceId: string;
  readonly projectId?: string;
  readonly taskId?: string;
  readonly expectedVersion?: number;
  readonly createdAt: string;
  readonly correlationId: string;
  readonly causationId: string;
}

export type CommandIntent =
  | "BootstrapPersonalSpace"
  | "CreateProject"
  | "UpdateProject"
  | "ActivateProject"
  | "PauseProject"
  | "ResumeProject"
  | "ArchiveProject"
  | "RestoreProject"
  | "CloseProject"
  | "UpdateProjectCurrentState"
  | "CreateGoal"
  | "UpdateGoal"
  | "DeleteGoal"
  | "CreateTask"
  | "UpdateTask"
  | "ReparentTask"
  | "AddDependency"
  | "RemoveDependency"
  | "TransitionTaskState"
  | "ResolveDependency";

export interface Command {
  readonly envelope: CommandEnvelope;
  readonly intent: CommandIntent;
  readonly payload: Record<string, unknown>;
}