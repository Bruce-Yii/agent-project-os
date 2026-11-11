import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('.')
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
expected = {}
for line in (root / 'CHECKSUMS.sha256').read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    parts = line.split()
    if len(parts) >= 2:
        expected[parts[1]] = parts[0]

missing_files = []
missing_entries = []
mismatches = []
for relative in manifest.get('files', []):
    path = root / relative
    if not path.is_file():
        missing_files.append(relative)
        continue
    if relative not in expected:
        missing_entries.append(relative)
        continue
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected[relative]:
        mismatches.append(relative)

print(f"Manifest files: {len(manifest.get('files', []))}")
print(f"Checksum entries: {len(expected)}")
if missing_files:
    print('Missing manifest files:')
    for item in missing_files:
        print(f'  - {item}')
if missing_entries:
    print('Manifest files without checksum entry:')
    for item in missing_entries:
        print(f'  - {item}')
if mismatches:
    print('Hash mismatches:')
    for item in mismatches:
        print(f'  - {item}')
if missing_files or missing_entries or mismatches:
    sys.exit(1)
print('All listed manifest hashes match.')