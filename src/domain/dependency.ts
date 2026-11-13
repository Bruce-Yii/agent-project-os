// DependencyEdge — blocks relation (PC-2).

export type TaskId = string;

export interface DependencyEdge {
  readonly source: TaskId; // predecessor (blocks)
  readonly target: TaskId; // successor (blocked)
  readonly createdAt: string;
}

export function wouldCreateCycle(
  edges: Map<TaskId, Set<TaskId>>,
  source: TaskId,
  target: TaskId
): boolean {
  // Adding edge source->target creates cycle if target can reach source.
  const visited = new Set<TaskId>();
  const stack: TaskId[] = [target];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === source) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const [tid, preds] of edges) {
      if (preds.has(node) && !visited.has(tid)) {
        stack.push(tid);
      }
    }
  }
  return false;
}