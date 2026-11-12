#!/usr/bin/env python3
"""Validate that the F01-F32 dependency graph in docs/24 is acyclic.

Parses the module responsibility matrix table, extracts F## -> F## edges
(PC-* contract references are ignored), and checks for cycles via
topological sort (Kahn's algorithm).

Usage:
    python scripts/validate_dag.py [--doc PATH]

Exit 0 if acyclic, exit 1 if cycles found.
"""

import argparse
import re
import sys
from pathlib import Path


def parse_matrix(doc_path: Path) -> dict[str, list[str]]:
    """Parse docs/24 matrix table into {F##: [F##, ...]}."""
    text = doc_path.read_text(encoding="utf-8")
    deps: dict[str, list[str]] = {}
    # Match table rows like: | F01 | ... | ... | F03, F04, PC-2 | ... |
    row_re = re.compile(r"^\|\s*(F\d{2})\s*\|.*?\|\s*([^|]+)\s*\|\s*(?:RESEARCH|PROTOTYPE|IMPLEMENTATION|MODULE)\s*READY\s*\|", re.MULTILINE)
    # Simpler: find all lines starting with | F##
    for line in text.splitlines():
        m = re.match(r"^\|\s*(F\d{2})\s*\|", line)
        if not m:
            continue
        fid = m.group(1)
        # The "Depends on" column is the 5th pipe-delimited field (index 4)
        parts = [p.strip() for p in line.split("|")]
        # parts[0] is empty (before first |), parts[1]=F##, parts[2]=name, parts[3]=workstream, parts[4]=module, parts[5]=depends on
        if len(parts) < 6:
            continue
        dep_field = parts[5]
        # Extract F## tokens only (ignore PC-* and prose)
        dep_ids = re.findall(r"F\d{2}", dep_field)
        deps[fid] = dep_ids
    return deps


def find_cycles(deps: dict[str, list[str]]) -> list[list[str]]:
    """Return list of cycles (each a list of node IDs) using DFS."""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in deps}
    parent = {}
    cycles: list[list[str]] = []

    def dfs(u: str, path: list[str]) -> None:
        color[u] = GRAY
        path.append(u)
        for v in deps.get(u, []):
            if v not in color:
                color[v] = WHITE
                deps[v] = []
            if color.get(v, WHITE) == WHITE:
                parent[v] = u
                dfs(v, path)
            elif color.get(v, WHITE) == GRAY:
                # Found a cycle
                idx = path.index(v)
                cycle = path[idx:] + [v]
                cycles.append(cycle)
        path.pop()
        color[u] = BLACK

    for node in list(deps.keys()):
        if color.get(node, WHITE) == WHITE:
            dfs(node, [])
    return cycles


def topological_sort(deps: dict[str, list[str]]) -> list[str] | None:
    """Return topological order if acyclic, else None."""
    in_degree = {n: 0 for n in deps}
    for u in deps:
        for v in deps[u]:
            if v not in in_degree:
                in_degree[v] = 0
            in_degree[v] += 0  # ensure exists
    # compute in-degree properly
    in_degree = {n: 0 for n in in_degree}
    for u in deps:
        for v in deps[u]:
            if v in in_degree:
                in_degree[v] += 1
            else:
                in_degree[v] = 1
                deps.setdefault(v, [])
    # Kahn's
    from collections import deque
    q = deque([n for n in in_degree if in_degree[n] == 0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in deps.get(u, []):
            in_degree[v] -= 1
            if in_degree[v] == 0:
                q.append(v)
    if len(order) != len(in_degree):
        return None
    return order


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate F01-F32 dependency DAG for cycles.")
    parser.add_argument("--doc", default="docs/24-module-responsibility-and-dependency-dag.md", help="Path to docs/24")
    args = parser.parse_args()
    doc_path = Path(args.doc)
    if not doc_path.is_file():
        print(f"ERROR: file not found: {doc_path}", file=sys.stderr)
        return 2

    deps = parse_matrix(doc_path)
    if not deps:
        print("ERROR: no F## rows parsed from matrix", file=sys.stderr)
        return 2

    print(f"Parsed {len(deps)} modules: {', '.join(sorted(deps))}")
    print()

    cycles = find_cycles(deps)
    if cycles:
        print("CYCLES DETECTED:")
        for c in cycles:
            print("  " + " -> ".join(c))
        print()
        print("DAG INVALID: cycles found. Exit 1.")
        return 1

    order = topological_sort(deps)
    if order is None:
        print("DAG INVALID: topological sort failed (cycle). Exit 1.")
        return 1

    print("DAG OK: no cycles detected.")
    print(f"Topological order ({len(order)} nodes):")
    print("  " + " -> ".join(order))
    return 0


if __name__ == "__main__":
    sys.exit(main())