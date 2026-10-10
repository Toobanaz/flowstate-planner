import { describe, expect, it } from "vitest";
import { planFlow, Task, UserState, getLocalTimeContext } from "./flowEngine";

const baseTask: Task = {
  id: "task-1",
  title: "Write proposal",
  tag: "Deep Work",
  energy_required: 5,
  effort_level: "High",
  schedule_preference: null,
  ai_classified: true,
  completed: false,
  created_at: "2026-04-06T00:00:00.000Z",
};

const calmState: UserState = {
  energyLevel: 3,
  mood: "Calm",
  notes: "",
};

const morning = getLocalTimeContext(new Date(2026, 9, 10, 9, 30));

describe("planFlow", () => {
  it("uses energy and mood to split tasks into now, later, and avoid buckets", () => {
    const tasks: Task[] = [
      { ...baseTask, id: "low", title: "Reply to email", tag: "Admin", energy_required: 2 },
      { ...baseTask, id: "medium", title: "Sketch homepage", tag: "Creative", energy_required: 4 },
      { ...baseTask, id: "high", title: "Draft strategy", tag: "Deep Work", energy_required: 5 },
    ];

    const result = planFlow(tasks, calmState, morning);

    expect(result.doNow.map((task) => task.id)).toEqual(["low"]);
    expect(result.doLater.map((task) => task.id)).toEqual(["medium"]);
    expect(result.avoid.map((task) => task.id)).toEqual(["high"]);
  });

  it("uses persisted schedule preferences for every active task in the timeline", () => {
    const tasks: Task[] = [
      { ...baseTask, id: "morning", title: "Deep writing", schedule_preference: "morning" },
      { ...baseTask, id: "evening", title: "Buy groceries", tag: "Errands", energy_required: 1, schedule_preference: "evening" },
      { ...baseTask, id: "done", title: "Finished call", completed: true, schedule_preference: "afternoon" },
    ];

    const result = planFlow(tasks, calmState, morning);

    expect(result.timeline.morning.map((task) => task.id)).toEqual(["morning"]);
    expect(result.timeline.evening.map((task) => task.id)).toEqual(["evening"]);
    expect(result.timeline.afternoon).toEqual([]);
  });

  it("defers demanding evening tasks even when energy is high", () => {
    const evening = getLocalTimeContext(new Date(2026, 9, 10, 20, 15));
    const result = planFlow([
      baseTask,
      { ...baseTask, id: "light", title: "Reply to email", energy_required: 2, schedule_preference: "morning" },
    ], { ...calmState, energyLevel: 5, mood: "Motivated" }, evening);
    expect(result.tomorrow.map((task) => task.id)).toEqual(["task-1"]);
    expect(result.doNow.map((task) => task.id)).toEqual(["light"]);
    expect(result.timeline.morning).toEqual([]);
    expect(result.timeline.afternoon).toEqual([]);
    expect(result.timeline.evening.map((task) => task.id)).toEqual(["light"]);
  });

  it("does not schedule past morning slots in the afternoon", () => {
    const result = planFlow([baseTask], calmState, getLocalTimeContext(new Date(2026, 9, 10, 14)));
    expect(result.timeline.morning).toEqual([]);
    expect(result.timeline.afternoon.map((task) => task.id)).toEqual(["task-1"]);
  });

  it("encourages rest before 6am and excludes completed tasks", () => {
    const result = planFlow([baseTask, { ...baseTask, id: "done", completed: true }], calmState,
      getLocalTimeContext(new Date(2026, 9, 11, 2)));
    expect(result.doNow).toEqual([]);
    expect(result.tomorrow.map((task) => task.id)).toEqual(["task-1"]);
  });

  it("captures a local calendar date and evening boundary", () => {
    expect(getLocalTimeContext(new Date(2026, 9, 10, 18, 5))).toMatchObject({
      localDate: "2026-10-10", localTime: "18:05", hour: 18, period: "evening",
    });
    expect(getLocalTimeContext(new Date(2026, 9, 10, 17, 59)).period).toBe("afternoon");
  });
});
