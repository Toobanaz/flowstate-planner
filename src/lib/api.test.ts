import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  order: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  from: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mocks.from,
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

import {
  classifyTaskAI,
  fetchTasks,
  planFlowAI,
  updateTaskClassification,
  updateTaskSchedules,
} from "./api";
import { getLocalTimeContext } from "./flowEngine";

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({
      select: mocks.select,
      update: mocks.update,
    });
    mocks.select.mockReturnValue({ order: mocks.order });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.order.mockResolvedValue({ data: [], error: null });
    mocks.eq.mockResolvedValue({ error: null });
    mocks.invoke.mockResolvedValue({ data: {}, error: null });
  });

  it("maps effort_level from fetched task rows", async () => {
    mocks.order.mockResolvedValueOnce({
      data: [
        {
          id: "task-1",
          title: "Write outline",
          tag: "Creative",
          energy_required: 4,
          effort_level: "Medium",
          schedule_preference: "morning",
          ai_classified: true,
          completed: false,
          created_at: "2026-04-06T00:00:00.000Z",
        },
      ],
      error: null,
    });

    const tasks = await fetchTasks();

    expect(tasks[0]).toMatchObject({
      id: "task-1",
      effort_level: "Medium",
      schedule_preference: "morning",
      ai_classified: true,
    });
  });

  it("persists classification category, energy, effort, and ai flag", async () => {
    await updateTaskClassification("task-1", "Admin", 2, "Low");

    expect(mocks.update).toHaveBeenCalledWith({
      tag: "Admin",
      energy_required: 2,
      effort_level: "Low",
      ai_classified: true,
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", "task-1");
  });

  it("normalizes AI classification responses into the app shape", async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: { category: "Deep Work", energy_required: 5, effort_level: "High" },
      error: null,
    });

    await expect(classifyTaskAI("Write strategy")).resolves.toEqual({
      category: "Deep Work",
      energy_required: 5,
      effort_level: "High",
    });
  });

  it("persists AI schedule updates", async () => {
    await updateTaskSchedules([
      { id: "task-1", schedule: "morning" },
      { id: "task-2", schedule: "evening" },
    ]);

    expect(mocks.update).toHaveBeenCalledWith({ schedule_preference: "morning" });
    expect(mocks.update).toHaveBeenCalledWith({ schedule_preference: "evening" });
  });

  it("calls the AI planner with user state and task summaries", async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: {
        suggestion: { try_first: "Start small.", avoid_now: "Avoid multitasking." },
        schedule: [{ task: "Write outline", time: "Morning" }],
      },
      error: null,
    });

    const localTime = getLocalTimeContext(new Date(2026, 9, 10, 20, 30));
    const result = await planFlowAI(
      { energyLevel: 4, moods: ["Focused"], notes: "" },
      [
        {
          id: "task-1",
          title: "Write outline",
          tag: "Creative",
          energy_required: 4,
          effort_level: "Medium",
          schedule_preference: null,
          ai_classified: true,
          completed: false,
          created_at: "2026-04-06T00:00:00.000Z",
          override_bucket: null,
          override_date: null,
        },
      ],
      localTime
    );

    expect(mocks.invoke).toHaveBeenCalledWith("plan-flow-ai", {
      body: {
        energy_level: 4,
        moods: ["Focused"],
        local_context: localTime,
        tasks: [
          {
            id: "task-1",
            title: "Write outline",
            category: "Creative",
            energy_required: 4,
            effort_level: "Medium",
          },
        ],
      },
    });
    expect(result.suggestion.try_first).toBe("Start small.");
  });
});
