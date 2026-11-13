import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canTransitionProject } from "../domain/project.js";
import { canTransitionTask } from "../domain/task.js";
import { wouldCreateCycle } from "../domain/dependency.js";

describe("WP1-A domain model", () => {
  it("project: draft -> active is valid", () => {
    assert.equal(canTransitionProject("draft", "active"), true);
  });
  it("project: active -> closed is valid", () => {
    assert.equal(canTransitionProject("active", "closed"), true);
  });
  it("project: closed -> active is invalid", () => {
    assert.equal(canTransitionProject("closed", "active"), false);
  });
  it("task: backlog -> ready is valid", () => {
    assert.equal(canTransitionTask("backlog", "ready"), true);
  });
  it("task: cancelled -> ready is invalid", () => {
    assert.equal(canTransitionTask("cancelled", "ready"), false);
  });
  it("dependency: cycle detection works", () => {
    const edges = new Map<string, Set<string>>();
    edges.set("t1", new Set());
    edges.set("t2", new Set(["t1"]));
    assert.equal(wouldCreateCycle(edges, "t1", "t2"), false);
    assert.equal(wouldCreateCycle(edges, "t2", "t1"), true);
  });
});