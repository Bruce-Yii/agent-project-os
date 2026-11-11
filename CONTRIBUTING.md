# Contributing

This repository is documentation-first. Read `README.md`, `AGENTS.md`,
and `docs/17-agent-development-contract.md` before proposing changes.

## Branches and worktrees

- Use one branch, and an isolated worktree when needed, per workstream.
- Never share a mutable checkout between concurrent coding Agents.
- Use names such as `feat/<task>-short-description` or `docs/<topic>`.

## Change rules

- Change the document that owns the subject; do not duplicate contracts.
- Update `docs/14-open-decisions.md` when a material decision changes.
- Record architecture-changing decisions with an ADR.
- Do not add production code, credentials, private customer data, or provider secrets.
- Do not modify files outside your assigned ownership.

## Pull requests

- Keep changes focused and reviewable.
- Include changed files, verification commands and output, and known risks.
- Ensure CI is checked on the first pull request that uses
  `.github/workflows/ci.yml`.
- Never include secrets or real credentials. Use `.env.example` placeholders only.
