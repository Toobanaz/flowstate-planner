import { describe, expect, it } from "vitest";
import { getMoodProfile, normalizeMoods, planFlow, getLocalTimeContext, Task, Mood } from "./flowEngine";
import { toggleMood } from "@/components/MoodSelector";

const base: Task = {
  id: "t", title: "T", tag: "Admin", energy_required: 2, effort_level: "Low",
  schedule_preference: "morning", ai_classified: true, completed: false,
  created_at: "2026-04-06T00:00:00.000Z", override_bucket: null, override_date: null,
};
const morning = getLocalTimeContext(new Date(2026, 9, 10, 9, 0));
const tasks: Task[] = [
  { ...base, id: "small", tag: "Admin", energy_required: 2 },
  { ...base, id: "deep", tag: "Deep Work", energy_required: 4 },
  { ...base, id: "creative", tag: "Creative", energy_required: 3 },
];
const order = (moods: Mood[], energy = 5) =>
  planFlow(tasks, { energyLevel: energy, moods, notes: "" }, morning).doNow.map((t) => t.id);

describe("mood selection", () => {
  it("toggles and drops the oldest when a third is picked", () => {
    expect(toggleMood([], "Calm")).toEqual(["Calm"]);
    expect(toggleMood(["Calm", "Focused"], "Anxious")).toEqual(["Focused", "Anxious"]);
    expect(toggleMood(["Calm", "Focused"], "Calm")).toEqual(["Focused"]);
  });

  it("reads old single-mood records and caps at 2", () => {
    expect(normalizeMoods("Calm")).toEqual(["Calm"]);
    expect(normalizeMoods(null)).toEqual([]);
    expect(normalizeMoods(["Calm", "Bogus", "Focused", "Anxious"])).toEqual(["Calm", "Focused"]);
    expect(getMoodProfile("Overwhelmed")).toEqual(getMoodProfile(["Overwhelmed"]));
  });
});

describe("getMoodProfile combinations", () => {
  const cases: [Mood[], number, string][] = [
    [["Overwhelmed", "Motivated"], -1, "small-first"],
    [["Anxious", "Motivated"], -1, "small-first"],
    [["Overwhelmed", "Anxious"], -1, "small-first"],
    [["Anxious", "Focused"], -1, "small-first"],
    [["Overwhelmed", "Calm"], -1, "small-first"],
    [["Focused", "Motivated"], 1, "deep-first"],
    [["Focused", "Calm"], 0, "deep-first"],
    [["Focused"], 0, "deep-first"],
    [["Calm", "Motivated"], 1, "creative-first"],
    [["Calm"], 0, "creative-first"],
    [["Motivated"], 1, "balanced"],
    [[], 0, "balanced"],
  ];
  it.each(cases)("%j → modifier %i, %s", (moods, mod, priority) => {
    const p = getMoodProfile(moods);
    expect(p.energyModifier).toBe(mod);
    expect(p.priority).toBe(priority);
  });

  it("caps Do Now at 3 only when Overwhelmed is picked", () => {
    expect(getMoodProfile(["Overwhelmed", "Motivated"]).doNowLimit).toBe(3);
    expect(getMoodProfile(["Anxious", "Motivated"]).doNowLimit).toBeNull();
  });
});

describe("planFlow ordering by mood", () => {
  it("stress beats motivation: small tasks first", () => {
    expect(order(["Overwhelmed", "Motivated"])[0]).toBe("small");
  });
  it("Focused + Motivated puts deep work first", () => {
    expect(order(["Focused", "Motivated"])[0]).toBe("deep");
  });
  it("Calm puts creative work first", () => {
    expect(order(["Calm"])[0]).toBe("creative");
  });
  it("Motivated raises effective energy so deeper work fits now", () => {
    expect(order(["Motivated"], 3)).toContain("deep");
    expect(order([], 3)).not.toContain("deep");
  });
});
