# 15 — Glossary

| Term | Meaning in Agent Project OS | Must not be confused with |
|---|---|---|
| Workspace | top-level collaboration and permission boundary | Project |
| Project | stable identity for a long-lived line of work | repository, chat, Agent, or task list |
| Goal | desired outcome | Task or milestone |
| Milestone | meaningful stage/checkpoint | Run |
| Task / Work Package | bounded work with scope and acceptance criteria | Assignment, Run, Session |
| Subtask | decomposed child Task | dependency edge |
| Dependency | relation constraining order/readiness | parent-child hierarchy |
| Accountable owner | person/team responsible for outcome | Agent executor |
| Participant | human, Agent, team, or service identity involved in work | Provider |
| Agent Profile | logical execution identity/configuration | Provider or Runtime Node |
| Provider | adapter/harness/API family | Agent Profile |
| Runtime Node | machine/environment that executes work | client device or Session |
| Assignment | authorized delegation of a bounded responsibility | Run |
| Run | one concrete execution attempt | Task or Session |
| Session | provider-managed conversation/process | Project or Run |
| Event | durable fact about a state change or important action | free-form log line |
| Checkpoint | resumable execution state/reference | completed Run |
| Artifact | durable output or immutable pointer | Evidence |
| Evidence | fact supporting a claim or review | Artifact alone |
| Review | assessment against acceptance criteria | Approval |
| Approval | scoped authorization for an action | review verdict |
| Current State | compact operational snapshot of Project status | long-term knowledge or chat summary |
| Knowledge | curated durable information with provenance | every Session message |
| Decision | durable conclusion with rationale and scope | discussion message |
| Resource | reusable external object such as repository or document | Project |
| Source | connector/event producer | Trigger |
| Trigger | normalized immutable incoming event | Task |
| Eval | policy/intake judgment about what an event means | execution Run |
| Mandate | scope and strength of granted authority | context pack |
| Thread | ordered communication/event stream | Project or Task |
| Subscription | relation routing context/events to a work item | permission grant |
| Workflow | versioned trigger/condition/action definition | Task lifecycle |
| Skill | reusable method for Agent behavior | state machine or permission system |
| Personal Execution Skill | validated user-specific method profile that can inform autonomous execution | standalone product or control plane |
| Live Truth | current fact owned by an external system | cached Project OS snapshot |
| Handoff | executor's structured delivery of result and evidence | Task acceptance |
| Autonomy | optional continuation of authorized work | product identity |


### Local Agent Daemon

A user-machine background service that discovers/manages local Agent Providers, supervises processes, maintains Session connections, streams/replays events, and exposes authenticated local/remote control to Project OS clients. It does not own canonical Project/Task state.

### Provider Session Reference

The Provider-native conversation/thread identifier and related resumability metadata. It is distinct from the Project OS Session ID and from the process currently connected to it.

### Runtime Process

The actual CLI/server process executing or hosting a Provider Session. It may exit while the Provider's durable conversation remains resumable.

### Session Connection

A transient transport or client subscription to a Session. Disconnecting a client does not necessarily end the Session or process.

### Session Binding

An explicit, auditable association between a Session and a Project, Task, Assignment, or Run. A direct Session may be unbound.

### Context Snapshot

An immutable/versioned reference to the Project/Task resources, instructions, Skills, and permission context supplied when a Session or Run begins.

### Event Gap

A known interval of Provider/Daemon event history that could not be recovered after disconnect. It must be visible to the user and must not be presented as a complete transcript.

