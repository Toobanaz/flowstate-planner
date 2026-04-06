import { describe, expect, it } from "vitest";
import { planFlow, Task, UserState } from "./flowEngine";

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

describe("planFlow", () => {
  it("uses energy and mood to split tasks into now, later, and avoid buckets", () => {
    const tasks: Task[] = [
      { ...baseTask, id: "low", title: "Reply to email", tag: "Admin", energy_required: 2 },
      { ...baseTask, id: "medium", title: "Sketch homepage", tag: "Creative", energy_required: 4 },
      { ...baseTask, id: "high", title: "Draft strategy", tag: "Deep Work", energy_required: 5 },
    ];

    const result = planFlow(tasks, calmState);

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

    const result = planFlow(tasks, calmState);

    expect(result.timeline.morning.map((task) => task.id)).toEqual(["morning"]);
    expect(result.timeline.evening.map((task) => task.id)).toEqual(["evening"]);
    expect(result.timeline.afternoon).toEqual([]);
  });
});
