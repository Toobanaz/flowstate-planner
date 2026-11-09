import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuestTask, deleteGuestTask, loadGuestLogs, loadGuestTasks, saveGuestDailyLog, updateGuestTask } from "./guestStorage";

describe("guest storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
  });

  it("persists guest tasks, completion, and deletion in this browser", () => {
    const task = createGuestTask("Reply to email", null, "15:00");
    expect(loadGuestTasks()[0]).toMatchObject({ id: task.id, title: "Reply to email", tag: "Admin", completed: false });

    updateGuestTask(task.id, { completed: true });
    expect(loadGuestTasks()[0].completed).toBe(true);

    deleteGuestTask(task.id);
    expect(loadGuestTasks()).toEqual([]);
  });

  it("persists guest check-ins for local insights", () => {
    saveGuestDailyLog(4, ["Focused"], "Ready to work");
    expect(loadGuestLogs()[0]).toMatchObject({ energy_level: 4, moods: ["Focused"] });
  });
});
