file_path = r'D:\12412\DshWorktrees\agent-project-os\wp1a-wp1c-integration/src/commands/handlers.ts'.replace(chr(92), '/')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the StartRun section specifically
start_idx = content.find('// ---------- StartRun ----------')
end_idx = content.find('// ---------- CompleteRun ----------')
start_run_section = content[start_idx:end_idx]
print(repr(start_run_section[:400]))
