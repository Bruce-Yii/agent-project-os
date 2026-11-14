file_path = "D:/12412/DshWorktrees/agent-project-os/wp1a-wp1c-integration/src/commands/handlers.ts"
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find StartRun function
start_idx = None
for i, line in enumerate(lines):
    if '// ---------- StartRun ----------' in line:
        start_idx = i
        break

# Find the assignment findById line after StartRun
for i in range(start_idx, len(lines)):
    if 'const assignment = await repos.assignments.findById(assignmentId);' in lines[i]:
        # Insert lock before this line
        lock_lines = [
            '  // DB-level serialization: lock the assignment row first.\n',
            "  await db.execute(sql`SELECT id FROM assignments WHERE id = ${assignmentId} FOR UPDATE`);\n",
            '\n',
            '  // Re-read assignment after acquiring lock (avoid stale state).\n',
        ]
        lines[i:i] = lock_lines
        # Now find and remove the old lock block (was after findById + empty line)
        # Search for the old lock comment
        for j in range(i + 5, len(lines)):
            if 'DB-level serialization for concurrent StartRun' in lines[j]:
                # Remove comment line, lock line, and empty line after
                # Find start of comment block
                k = j
                while k > 0 and (lines[k-1].strip() == '' or 'DB-level' in lines[k-1]):
                    k -= 1
                # Remove from k to j+2
                del lines[k:j+3]
                break
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Done')