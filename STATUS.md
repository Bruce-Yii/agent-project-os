# Repository Status

- Version: v0.2 documentation baseline
- Snapshot date: 2026-11-09
- Product phase: product/domain/architecture design
- Implementation: not started in this repository
- GitHub remote: https://github.com/Bruce-Yii/agent-project-os (public; full v0.2 documentation baseline committed to main)
- Initial documentation commit: `40c5925e7bb6139dfe35ea31ff7e6e01a57cf639`
- Technology stack: not frozen
- Feature scope: 32 functional groups retained; F12/F16 expanded for local Agent Session workbench and Daemon
- Confirmed new minimum requirement: Desktop can create/open a local Agent Session and continuously receive newly arriving messages
- New detailed specification: `docs/18-local-agent-session-subsystem.md`
- Next design gate: choose one real local Provider for end-to-end validation; settle Session / ProviderSessionRef / RuntimeProcess / SessionConnection boundaries and event replay/storage ownership before API/schema freeze
- Additional functional gaps now explicit: universal search/command palette, Project calendar/capacity planning, unified Agent/Project Attention Inbox, inspectable Context Pack, cross-Provider Context Handoff, Project bootstrap bundles, and guided import/migration

See [Open Decisions](docs/14-open-decisions.md), [Development Sequence](docs/12-development-roadmap.md), and [Local Agent Session Subsystem](docs/18-local-agent-session-subsystem.md).
