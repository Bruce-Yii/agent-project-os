file_path = r'D:\12412\DshWorktrees\agent-project-os\wp1a-wp1c-integration/src/commands/handlers.ts'.replace(chr(92), '/')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const assignment = await repos.assignments.findById(assignmentId);')
start = idx - 50
end = idx + 300
print(repr(content[start:end]))
