"""Verify tracked snapshot manifest and SHA256 digests; do not self-hash CHECKSUMS.sha256."""
import hashlib
import json
from pathlib import Path
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
files = manifest.get("files", [])
errors = []

if not isinstance(files, list) or any(not isinstance(p, str) for p in files):
    raise SystemExit("Invalid manifest files")
if len(files) != len(set(files)):
    errors.append("duplicate manifest paths")
if "CHECKSUMS.sha256" in files:
    errors.append("CHECKSUMS.sha256 must not hash itself (self-reference impossible)")

entries = {}
for line in (root / "CHECKSUMS.sha256").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    parts = line.split(maxsplit=1)
    if len(parts) != 2 or len(parts[0]) != 64:
        errors.append(f"invalid checksum record: {line!r}")
        continue
    digest, path = parts
    if path in entries:
        errors.append(f"duplicate checksum record: {path}")
    entries[path] = digest

missing = set(files) - set(entries)
extra = set(entries) - set(files)
if missing:
    errors.append(f"manifest paths missing checksums: {sorted(missing)}")
if extra:
    errors.append(f"unexpected checksum paths: {sorted(extra)}")
for relative in files:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing file: {relative}")
    elif relative in entries:
        got = hashlib.sha256(path.read_bytes()).hexdigest()
        if got != entries[relative]:
            errors.append(f"checksum mismatch: {relative}")

print(f"Manifest paths: {len(files)}; checksum entries: {len(entries)}")
if errors:
    for error in errors:
        print("FAIL:", error)
    sys.exit(1)
print("PASS: exact manifest coverage and all listed SHA256 values match")
