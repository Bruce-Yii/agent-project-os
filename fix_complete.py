file_path = r'D:\12412\DshWorktrees\agent-project-os\wp1a-wp1c-integration/src/commands/handlers.ts'.replace(chr(92), '/')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix CompleteAssignment
old1 = '''  const assignment = await repos.assignments.findById(assignmentId);
  if (!assignment) return { status: "REJECTED", reason: "ASSIGNMENT_NOT_FOUND" };
  // Guard: assignment cannot be completed while a run is still active.
  const runs = await repos.runs.findByAssignment(assignmentId);
  if (runs.some((r: any) => r.status === "queued" || r.status === "running")) {
    return { status: "REJECTED", reason: "ACTIVE_RUN_EXISTS" };
  }
  if (!canTransitionAssignment(assignment.status as any, "completed")) {'''
new1 = '''  // Lock the assignment row first.
  await db.execute(sqlSELECT id FROM assignments WHERE id =  FOR UPDATE);
  const assignment = await repos.assignments.findById(assignmentId);
  if (!assignment) return { status: "REJECTED", reason: "ASSIGNMENT_NOT_FOUND" };
  // Guard: assignment cannot be completed while a run is still active.
  const runs = await repos.runs.findByAssignment(assignmentId);
  if (runs.some((r: any) => r.status === "queued" || r.status === "running")) {
    return { status: "REJECTED", reason: "ACTIVE_RUN_EXISTS" };
  }
  if (!canTransitionAssignment(assignment.status as any, "completed")) {'''
assert old1 in content, 'CompleteAssignment pattern not found'
content = content.replace(old1, new1)

# Fix CancelAssignment
old2 = '''  const assignment = await repos.assignments.findById(assignmentId);
  if (!assignment) return { status: "REJECTED", reason: "ASSIGNMENT_NOT_FOUND" };
  // Guard: assignment cannot be cancelled while a run is still active.
  const runs = await repos.runs.findByAssignment(assignmentId);
  if (runs.some((r: any) => r.status === "queued" || r.status === "running")) {
    return { status: "REJECTED", reason: "ACTIVE_RUN_EXISTS" };
  }
  if (!canTransitionAssignment(assignment.status as any, "cancelled")) {'''
new2 = '''  // Lock the assignment row first.
  await db.execute(sqlSELECT id FROM assignments WHERE id =  FOR UPDATE);
  const assignment = await repos.assignments.findById(assignmentId);
  if (!assignment) return { status: "REJECTED", reason: "ASSIGNMENT_NOT_FOUND" };
  // Guard: assignment cannot be cancelled while a run is still active.
  const runs = await repos.runs.findByAssignment(assignmentId);
  if (runs.some((r: any) => r.status === "queued" || r.status === "running")) {
    return { status: "REJECTED", reason: "ACTIVE_RUN_EXISTS" };
  }
  if (!canTransitionAssignment(assignment.status as any, "cancelled")) {'''
assert old2 in content, 'CancelAssignment pattern not found'
content = content.replace(old2, new2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
