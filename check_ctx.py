file_path = r'D:\12412\DshWorktrees\agent-project-os\wp1a-wp1c-integration/src/commands/handlers.ts'.replace(chr(92), '/')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check what's around the StartRun assignment lookup
import re
idx = content.find('const assignment = await repos.assignments.findById(assignmentId);')
print(f'Found at index: {idx}')
# Print surrounding context
start = max(0, idx - 100)
end = min(len(content), idx + 200)
print(repr(content[start:end]))
