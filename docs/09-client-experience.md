# 09 — Client Experience and Information Architecture

## 1. Shared product model, device-specific experience

Desktop, Mobile, and Web are clients of the same Project OS. They should not maintain separate task or permission semantics. Each client emphasizes the actions suited to its environment.

## 2. Global information architecture

Candidate global navigation:

- Home / Portfolio;
- universal Search / Command Palette;
- Projects;
- Inbox / Triage;
- Attention Center;
- Agents & Sessions;
- Workflows;
- Knowledge & Resources;
- Plugins & Connections;
- unified Attention / Inbox;
- Settings / Workspace.

These are navigation surfaces over shared domain objects, not separate authorities.

## 3. Desktop experience

Desktop is the primary full-capability environment:

- Project portfolio and global dashboard;
- full Project workspace with overview, goals, tasks, dependencies, people/Agents, discussions, knowledge, deliverables, review, activity;
- first-class Agent Session workbench with local Provider discovery, Session creation/attach/resume, continuously streamed new messages, bidirectional input, tool/permission events, terminal, files, diff, artifacts, and usage where supported;
- Session list with multi-session tabs/panes, pinning, unread state, search, filters, and direct Sessions that do not require a Task;
- inspectable Context Pack and explicit Project/Task/Run binding;
- cross-Provider Session handoff via a structured Context Handoff, clearly distinguished from native Session resume;
- local Daemon setup, Provider version/capability matrix, host health, event-gap diagnostics, and secure device pairing;
- parallel workspaces and execution isolation;
- deep review and approval workflows.

## 4. Project workspace

Recommended Project views:

1. Overview / Current State;
2. Goals & Milestones;
3. Work (list, board, tree, timeline, dependency graph);
4. People & Agents;
5. Discussions & Decisions;
6. Knowledge & Resources;
7. Deliverables & Reviews;
8. Activity / History.

Users should be able to navigate Project → Task → Assignment → Run → Session → Artifact and return without losing context.

## 5. Mobile experience

Mobile should support:

- portfolio and Project status;
- Task search, assignment, and status updates;
- attention items, questions, blockers, and approvals;
- reviewing reports, diffs, artifacts, and evidence;
- receiving new Agent Session messages and actionable permission prompts;
- sending follow-up instructions, steering/queueing a turn, and interrupting a Session where supported;
- connecting to an online local Daemon or remote Runtime;
- push notifications with grouped, actionable summaries.

Mobile does not need to reproduce a full IDE or pretend a local computer can run while powered off.

## 6. Web experience

Web supports cross-device access, team collaboration, Project overview, task management, review, Agent interaction, and remote control. Whether Web is a separate client or shared frontend package remains a technical decision.

## 7. Core UI interaction principles

- Default to Project-level information; allow drill-down into technical detail.
- Show actual state, not inferred optimism.
- Separate accountable owner, executor, and reviewer.
- Distinguish waiting, blocked, running, handoff, and accepted.
- Present Agent chat as one panel/view among several, not the whole application.
- A Session's message stream must be live while connected and recoverable after reconnect; show an explicit gap when the Provider cannot backfill missing events.
- Distinguish a Session from its process and each client connection; closing a UI window must not imply the Session ended.
- Show Provider capabilities honestly: native resume, process reattach, restart-with-context, and terminal-only fallback are different experiences.
- Make important evidence and external sources one click away.
- Show provider capability limits and host connectivity clearly.
- Reduce visual noise; summarize low-value events.

## 8. Acceptance criteria

- A user can understand a Project's status without opening an Agent Session.
- A user can navigate from Project to a specific Run and its evidence.
- A user can operate direct Agent mode and coordinated mode from the same Project.
- Desktop can create a local Agent Session and continuously display newly arriving messages.
- Desktop can reattach to an existing local Session after UI restart when the Provider/Daemon supports it, without creating a duplicate Session.
- Mobile/Web can observe or control an online local Session only through authenticated pairing and current permission checks.
- Mobile can approve/review/intervene on an online runtime without owning canonical state.
- Desktop and Web show consistent Task and Project state after reconnect.
