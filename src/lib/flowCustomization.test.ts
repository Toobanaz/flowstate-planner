import { describe, expect, it } from "vitest";
import { FlowResult, PlannedTask, getLocalTimeContext } from "./flowEngine";
import { moveFlowTask, removeFlowTask } from "./flowCustomization";

const makeTask = (id: string): PlannedTask => ({
  id, title: id, tag: "Admin", energy_required: 2, effort_level: "Low", schedule_preference: null,
  ai_classified: true, completed: false, created_at: "2026-11-07T08:00:00.000Z", override_bucket: null,
  override_date: null, deadline_date: null, deadline_time: null, reason: "Planned automatically", isOverridden: false,
});

const now = makeTask("now");
const later = makeTask("later");
const aside = makeTask("aside");
const result: FlowResult = {
  doNow: [now], doLater: [later], avoid: [aside], tomorrow: [],
  localTime: getLocalTimeContext(new Date(2026, 10, 7, 9)),
  timeline: { morning: [now], afternoon: [], evening: [later] },
};

describe("flow customization", () => {
  it("moves a task between exclusive plan zones", () => {
    const moved = moveFlowTask(result, "now", "later-evening", 0);
    expect(moved.doNow).toEqual([]);
    expect(moved.doLater.map((task) => task.id)).toEqual(["now", "later"]);
    expect(moved.timeline.evening.map((task) => task.id)).toEqual(["now", "later"]);
    expect(moved.timeline.morning).toEqual([]);
    expect(moved.doLater[0]).toMatchObject({ reason: "You placed this task here.", isOverridden: true });
  });

  it("reorders tasks inside a zone", () => {
    const withTwo = moveFlowTask(result, "aside", "do-now");
    const reordered = moveFlowTask(withTwo, "aside", "do-now", 0);
    expect(reordered.doNow.map((task) => task.id)).toEqual(["aside", "now"]);
    expect(reordered.timeline.morning.map((task) => task.id)).toEqual(["aside", "now"]);
  });

  it("removes one finished task without replanning the rest", () => {
    const customized = moveFlowTask(result, "aside", "do-now", 0);
    const remaining = removeFlowTask(customized, "now");
    expect(remaining.doNow.map((task) => task.id)).toEqual(["aside"]);
    expect(remaining.timeline.morning.map((task) => task.id)).toEqual(["aside"]);
    expect(remaining.timeline.evening.map((task) => task.id)).toEqual(["later"]);
  });
});
