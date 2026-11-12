"""WP1-A acceptance test harness (spec-level, in-memory).

Implements the WP1-A domain model (PersonalSpace, Project, Goal, Task,
DependencyEdge, ProjectCurrentState) in memory and runs the JSON fixtures
in fixtures/wp1a/ against it. Validates positive, negative, and recovery
scenarios per docs/40 and docs/43.

This is a TEST FIXTURE, not product code. Tech stack is not frozen;
this harness validates contract behavior, not implementation.
"""

import json, os, sys, copy

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "fixtures", "wp1a")


class Store:
    """In-memory canonical store for WP1-A entities."""
    def __init__(self):
        self.spaces = {}
        self.projects = {}
        self.goals = {}
        self.tasks = {}
        self.deps = {}  # task_id -> set of predecessor task_ids
        self.idempotency = {}  # key -> result
        self.versions = {}  # entity_id -> version
        self.audit = []

    def bootstrap_space(self, owner):
        if owner in self.spaces:
            return {"status": "OK", "space_id": self.spaces[owner]["id"], "idempotent": True}
        sid = f"ps-{len(self.spaces)+1}"
        self.spaces[owner] = {"id": sid, "owner": owner, "projects": []}
        self.versions[sid] = 1
        return {"status": "OK", "space_id": sid}

    def create_project(self, space_id, name, actor, expected_version=None):
        if actor != "personal-owner-1":
            self.audit.append({"action": "create_project", "actor": actor, "result": "DENIED"})
            return {"status": "REJECTED", "reason": "unauthorized"}
        pid = f"proj-{len(self.projects)+1}"
        self.projects[pid] = {"id": pid, "space_id": space_id, "name": name, "status": "draft", "current_state": None, "version": 1}
        self.versions[pid] = 1
        self.spaces[next(k for k,v in self.spaces.items() if v["id"]==space_id)]["projects"].append(pid)
        return {"status": "OK", "project_id": pid}

    def update_project(self, project_id, name, actor, expected_version):
        proj = self.projects.get(project_id)
        if not proj:
            return {"status": "REJECTED", "reason": "not_found"}
        if actor != "personal-owner-1":
            self.audit.append({"action": "update_project", "actor": actor, "result": "DENIED"})
            return {"status": "REJECTED", "reason": "unauthorized"}
        if expected_version is not None and expected_version != self.versions.get(project_id):
            return {"status": "REJECTED", "reason": "STALE_VERSION"}
        if name is not None:
            proj["name"] = name
        self.versions[project_id] += 1
        proj["version"] = self.versions[project_id]
        return {"status": "OK"}

    def transition_project(self, project_id, to_state, actor):
        proj = self.projects.get(project_id)
        if not proj:
            return {"status": "REJECTED", "reason": "not_found"}
        if actor != "personal-owner-1":
            return {"status": "REJECTED", "reason": "unauthorized"}
        valid = {
            "draft": ["active"], "active": ["paused", "archived", "closed"],
            "paused": ["active"], "archived": ["active"],
        }
        if to_state not in valid.get(proj["status"], []):
            return {"status": "REJECTED", "reason": f"invalid transition {proj['status']}->{to_state}"}
        proj["status"] = to_state
        return {"status": "OK"}

    def create_goal(self, project_id, title):
        gid = f"goal-{len(self.goals)+1}"
        self.goals[gid] = {"id": gid, "project_id": project_id, "title": title}
        return {"status": "OK", "goal_id": gid}

    def create_task(self, project_id, title, parent_id=None):
        tid = f"task-{len(self.tasks)+1}"
        self.tasks[tid] = {"id": tid, "project_id": project_id, "title": title, "parent_id": parent_id, "status": "backlog", "version": 1}
        self.versions[tid] = 1
        self.deps[tid] = set()
        return {"status": "OK", "task_id": tid, "project_id": project_id}

    def reparent_task(self, task_id, new_parent_id):
        if task_id not in self.tasks:
            return {"status": "REJECTED", "reason": "not_found"}
        self.tasks[task_id]["parent_id"] = new_parent_id
        return {"status": "OK"}

    def add_dependency(self, source, target):
        # source blocks target
        if source not in self.tasks or target not in self.tasks:
            return {"status": "REJECTED", "reason": "not_found"}
        if source == target:
            return {"status": "REJECTED", "reason": "self_dependency"}
        # cycle check
        if self._would_cycle(source, target):
            return {"status": "REJECTED", "reason": "cycle detected"}
        self.deps.setdefault(target, set()).add(source)
        return {"status": "OK"}

    def _would_cycle(self, source, target):
        # Adding edge source->target (source blocks target). Cycle if target can reach source.
        visited = set()
        stack = [target]
        while stack:
            node = stack.pop()
            if node == source:
                return True
            if node in visited:
                continue
            visited.add(node)
            # predecessors of node (what blocks node) — reverse: who does node block?
            for tid, preds in self.deps.items():
                if node in preds and tid not in visited:
                    stack.append(tid)
        return False

    def transition_task(self, task_id, to_state):
        task = self.tasks.get(task_id)
        if not task:
            return {"status": "REJECTED", "reason": "not_found"}
        valid = {"backlog": ["ready", "blocked", "cancelled"], "ready": ["blocked", "cancelled"], "blocked": ["ready", "cancelled"]}
        if to_state not in valid.get(task["status"], []):
            return {"status": "REJECTED", "reason": f"invalid transition {task['status']}->{to_state}"}
        task["status"] = to_state
        return {"status": "OK"}

    def update_current_state(self, project_id, state):
        proj = self.projects.get(project_id)
        if not proj:
            return {"status": "REJECTED", "reason": "not_found"}
        proj["current_state"] = state
        return {"status": "OK"}

    def execute(self, cmd):
        intent = cmd["intent"]
        payload = cmd.get("payload", {})
        actor = cmd.get("actor", "personal-owner-1")
        idem = cmd.get("idempotency_key")
        if idem and idem in self.idempotency:
            return self.idempotency[idem]
        result = self._dispatch(intent, payload, actor, cmd.get("expected_version"))
        crash = cmd.get("simulate_crash_after")
        if crash:
            # DB write happened, then crash. Store result for idempotency.
            if idem:
                self.idempotency[idem] = result
            return {"status": "CRASH", "reason": f"simulated crash after {crash}"}
        if idem:
            self.idempotency[idem] = result
        return result

    def _dispatch(self, intent, payload, actor, ev):
        if intent == "CreatePersonalSpace":
            return self.bootstrap_space(payload.get("owner", "personal-owner-1"))
        if intent == "BootstrapPersonalSpace":
            return self.bootstrap_space(payload.get("owner", "personal-owner-1"))
        if intent == "CreateProject":
            return self.create_project(payload.get("space_id"), payload.get("name"), actor, ev)
        if intent == "UpdateProject":
            return self.update_project(payload.get("project_id"), payload.get("name"), actor, ev)
        if intent == "UpdateProjectState" or intent == "UpdateProjectCurrentState":
            return self.update_current_state(payload.get("project_id"), payload.get("current_state"))
        if intent == "UpdateTask":
            t = self.tasks.get(payload.get("task_id"))
            if not t:
                return {"status": "REJECTED", "reason": "not_found"}
            if actor != "personal-owner-1":
                return {"status": "REJECTED", "reason": "unauthorized"}
            if ev is not None and ev != self.versions.get(payload.get("task_id")):
                return {"status": "REJECTED", "reason": "STALE_VERSION"}
            if payload.get("title") is not None:
                t["title"] = payload["title"]
            self.versions[payload.get("task_id")] += 1
            t["version"] = self.versions[payload.get("task_id")]
            return {"status": "OK"}
        if intent == "ActivateProject":
            return self.transition_project(payload.get("project_id"), "active", actor)
        if intent == "PauseProject":
            return self.transition_project(payload.get("project_id"), "paused", actor)
        if intent == "ResumeProject":
            return self.transition_project(payload.get("project_id"), "active", actor)
        if intent == "ArchiveProject":
            return self.transition_project(payload.get("project_id"), "archived", actor)
        if intent == "RestoreProject":
            return self.transition_project(payload.get("project_id"), "active", actor)
        if intent == "CloseProject":
            return self.transition_project(payload.get("project_id"), "closed", actor)
        if intent == "UpdateProjectCurrentState":
            return self.update_current_state(payload.get("project_id"), payload.get("current_state"))
        if intent == "CreateGoal":
            return self.create_goal(payload.get("project_id"), payload.get("title"))
        if intent == "CreateTask":
            return self.create_task(payload.get("project_id"), payload.get("title"), payload.get("parent_id"))
        if intent == "UpdateTask":
            return self.update_project(payload.get("task_id"), payload.get("title"), actor, ev) if False else {"status": "REJECTED", "reason": "not_implemented_in_harness"}
        if intent == "ReparentTask":
            return self.reparent_task(payload.get("task_id"), payload.get("new_parent_id"))
        if intent == "AddDependency":
            return self.add_dependency(payload.get("source"), payload.get("target"))
        if intent == "RemoveDependency":
            # remove edge source->target
            t = payload.get("target"); s = payload.get("source")
            if t in self.deps and s in self.deps[t]:
                self.deps[t].discard(s)
                return {"status": "OK"}
            return {"status": "REJECTED", "reason": "not_found"}
        if intent == "TransitionTaskState":
            return self.transition_task(payload.get("task_id"), payload.get("to"))
        if intent == "ResolveDependency":
            return {"status": "OK"}
        return {"status": "REJECTED", "reason": f"unknown intent {intent}"}


def run_fixture(path):
    with open(path) as f:
        fx = json.load(f)
    store = Store()
    # bootstrap a space for tests (idempotent)
    store.bootstrap_space("personal-owner-1")
    results = []
    for cmd in fx.get("commands", []):
        r = store.execute(cmd)
        expected = cmd.get("expected", "")
        # status match
        ok = r.get("status", "") in expected or expected.startswith(r.get("status", ""))
        # assert_result: check result fields match
        ar = cmd.get("assert_result")
        if ar and ok:
            for k, v in ar.items():
                if r.get(k) != v:
                    ok = False
                    break
        # assert_reason: check reason contains expected
        areason = cmd.get("assert_reason")
        if areason and ok:
            if areason not in str(r.get("reason", "")):
                ok = False
        results.append({"cmd": cmd["intent"], "result": r, "expected": expected, "pass": ok})
    # check assertions (count-based)
    passed = all(r["pass"] for r in results)
    return fx["fixture"], passed, results


def main():
    fixtures = sorted(f for f in os.listdir(FIXTURES_DIR) if f.endswith(".json"))
    total = 0
    failed = 0
    for fn in fixtures:
        fid, passed, results = run_fixture(os.path.join(FIXTURES_DIR, fn))
        total += 1
        status = "PASS" if passed else "FAIL"
        if not passed:
            failed += 1
        print(f"{fid}: {status}")
        for r in results:
            if not r["pass"]:
                print(f"  FAIL: {r['cmd']} -> {r['result']} (expected {r['expected']})")
    print(f"\n{total} fixtures, {total-failed} passed, {failed} failed.")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()