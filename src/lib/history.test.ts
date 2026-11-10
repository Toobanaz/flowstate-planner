import { describe, expect, it } from "vitest";
import { Task } from "./flowEngine";
import { generateLocalInsights, isCarriedOver } from "./history";

const task: Task = {
  id: "task-1",
  title: "Write outline",
  tag: "Creative",
  energy_required: 3,
  effort_level: "Medium",
  schedule_preference: null,
  ai_classified: true,
  completed: false,
  created_at: "2026-11-06T12:00:00.000Z",
  override_bucket: null,
  override_date: null,
  deadline_date: null,
  deadline_time: null,
};

describe("task history", () => {
  it("identifies unfinished tasks from before today as carryovers", () => {
    expect(isCarriedOver(task, "2026-11-07")).toBe(true);
    expect(isCarriedOver({ ...task, completed: true }, "2026-11-07")).toBe(false);
  });

  it("creates useful insights without relying on the AI gateway", () => {
    const insights = generateLocalInsights(
      [task],
      [{
        id: "log-1",
        energy_level: 2,
        mood: "Overwhelmed",
        moods: ["Overwhelmed"],
        notes: null,
        created_at: "2026-11-07T08:00:00.000Z",
      }],
      "2026-11-07"
    );

    expect(insights).toHaveLength(2);
    expect(insights[0].text).toContain("2.0/5");
    expect(insights[1].text).toContain("1 unfinished task");
  });

  it("uses completed timer history to report the user's real pace", () => {
    const insights = generateLocalInsights([
      { ...task, completed: true, actual_seconds: 1800 },
    ], [], "2026-11-07");

    expect(insights[0]).toMatchObject({ title: "Your Real Pace" });
    expect(insights[0].text).toContain("30 minutes");
  });
});
