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
  override_bucket: null,
  override_date: null,
};

const calmState: UserState = {
  energyLevel: 3,
  moods: ["Calm"],
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

    const result = planFlow(tasks, { ...calmState, energyLevel: 5 }, morning);

    expect(result.timeline.morning.map((task) => task.id)).toEqual(["morning"]);
    expect(result.timeline.evening.map((task) => task.id)).toEqual(["evening"]);
    expect(result.timeline.afternoon).toEqual([]);
  });

  it("defers demanding evening tasks even when energy is high", () => {
    const evening = getLocalTimeContext(new Date(2026, 9, 10, 20, 15));
    const result = planFlow([
      baseTask,
      { ...baseTask, id: "light", title: "Reply to email", energy_required: 2, schedule_preference: "morning" },
    ], { ...calmState, energyLevel: 5, moods: ["Motivated"] }, evening);
    expect(result.tomorrow.map((task) => task.id)).toEqual(["task-1"]);
    expect(result.doNow.map((task) => task.id)).toEqual(["light"]);
    expect(result.timeline.morning).toEqual([]);
    expect(result.timeline.afternoon).toEqual([]);
    expect(result.timeline.evening.map((task) => task.id)).toEqual(["light"]);
  });

  it("does not schedule past morning slots in the afternoon", () => {
    const result = planFlow([baseTask], { ...calmState, energyLevel: 5 }, getLocalTimeContext(new Date(2026, 9, 10, 14)));
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

  it("never puts afternoon or evening preferences in Do Now during morning", () => {
    const result = planFlow([
      { ...baseTask, id: "afternoon", energy_required: 4, schedule_preference: "afternoon" },
      { ...baseTask, id: "morning", energy_required: 3, schedule_preference: "morning" },
      { ...baseTask, id: "evening", energy_required: 2, schedule_preference: "evening" },
    ], { ...calmState, energyLevel: 4 }, morning);
    expect(result.doNow.map((task) => task.id)).toEqual(["morning"]);
    expect(result.doLater.map((task) => task.id)).toEqual(["evening", "afternoon"]);
  });

  it("does not schedule avoided tasks in the timeline", () => {
    const result = planFlow([baseTask], { ...calmState, energyLevel: 1 }, morning);
    expect(result.avoid.map((t) => t.id)).toEqual([baseTask.id]);
    expect(Object.values(result.timeline).flat()).toEqual([]);
  });

  it("moves energy-mismatched current tasks later, or tomorrow if no period remains", () => {
    const task = { ...baseTask, energy_required: 3, schedule_preference: "morning" as const };
    const state = { ...calmState, energyLevel: 2 };
    const early = planFlow([task], state, morning);
    expect(early.doNow).toEqual([]);
    expect(early.timeline.afternoon.map((item) => item.id)).toEqual([task.id]);
    expect(early.timeline.afternoon.map((t) => t.id)).toEqual([task.id]);
    const late = planFlow([task], state, getLocalTimeContext(new Date(2026, 9, 10, 20)));
    expect(late.tomorrow.map((t) => t.id)).toEqual([task.id]);
    expect(late.doNow).toEqual([]);
  });

  it("keeps buckets exclusive and limits low-energy recommendations", () => {
    const tasks = Array.from({ length: 6 }, (_, index) => ({ ...baseTask, id: String(index), energy_required: 2 }));
    const result = planFlow(tasks, { ...calmState, energyLevel: 2 }, morning);
    const ids = [...result.doNow, ...result.doLater, ...result.avoid, ...result.tomorrow].map((task) => task.id);
    expect(new Set(ids).size).toBe(tasks.length);
    expect(ids).toHaveLength(tasks.length);
    expect(result.doNow).toHaveLength(2);
    expect(result.doLater).toHaveLength(4);
  });

  it("returns a value-based reason for every placement bucket", () => {
    const result = planFlow([
      { ...baseTask, id: "now", energy_required: 2, schedule_preference: "morning" },
      { ...baseTask, id: "later", energy_required: 3, schedule_preference: "afternoon" },
      { ...baseTask, id: "aside", energy_required: 5 },
    ], calmState, morning);

    expect(result.doNow[0].reason).toBe("Needs 2/5 energy, within your 3/5 energy now");
    expect(result.doLater[0].reason).toBe("Better in the afternoon for a 3/5 energy task");
    expect(result.avoid[0].reason).toBe("Needs 5/5 energy, you're at 3");

    const eveningResult = planFlow(
      [{ ...baseTask, id: "tomorrow", energy_required: 4 }],
      { ...calmState, energyLevel: 5 },
      getLocalTimeContext(new Date(2026, 9, 10, 20))
    );
    expect(eveningResult.tomorrow[0].reason)
      .toBe("Needs 4/5 energy; too demanding for evening, moved to tomorrow");
  });

  it("keeps today's override in Do Now across replanning and expires it the next day", () => {
    const overridden = {
      ...baseTask,
      override_bucket: "do_now" as const,
      override_date: morning.localDate,
    };

    const firstPlan = planFlow([overridden], { ...calmState, energyLevel: 1 }, morning);
    expect(firstPlan.doNow[0]).toMatchObject({ id: baseTask.id, isOverridden: true });

    const replanned = planFlow(firstPlan.doNow, { ...calmState, energyLevel: 1, mood: "Overwhelmed" }, morning);
    expect(replanned.doNow[0]).toMatchObject({ id: baseTask.id, isOverridden: true });

    const nextMorning = getLocalTimeContext(new Date(2026, 9, 11, 9, 30));
    const nextDay = planFlow([overridden], { ...calmState, energyLevel: 1 }, nextMorning);
    expect(nextDay.doNow).toEqual([]);
    expect(nextDay.avoid.map((task) => task.id)).toEqual([baseTask.id]);
  });
});
