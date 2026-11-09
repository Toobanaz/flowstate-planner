import { DailyLog } from "./history";
import { EffortLevel, Task, TaskTag } from "./flowEngine";

const TASKS_KEY = "flowstate.guest.tasks.v1";
const LOGS_KEY = "flowstate.guest.logs.v1";

export function loadGuestTasks(): Task[] {
  return readArray<Task>(TASKS_KEY);
}

export function createGuestTask(title: string, deadlineDate: string | null, deadlineTime: string | null): Task {
  const classification = classifyGuestTask(title);
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    tag: classification.category,
    energy_required: classification.energy_required,
    effort_level: classification.effort_level,
    schedule_preference: null,
    ai_classified: false,
    completed: false,
    created_at: new Date().toISOString(),
    override_bucket: null,
    override_date: null,
    deadline_date: deadlineDate,
    deadline_time: deadlineTime,
  };
  writeArray(TASKS_KEY, [task, ...loadGuestTasks()]);
  return task;
}

export function updateGuestTask(id: string, update: Partial<Task>): void {
  writeArray(TASKS_KEY, loadGuestTasks().map((task) => task.id === id ? { ...task, ...update } : task));
}

export function deleteGuestTask(id: string): void {
  writeArray(TASKS_KEY, loadGuestTasks().filter((task) => task.id !== id));
}

export function loadGuestLogs(): DailyLog[] {
  return readArray<DailyLog>(LOGS_KEY);
}

export function saveGuestDailyLog(energyLevel: number, moods: string[], notes: string): void {
  const log: DailyLog = {
    id: crypto.randomUUID(),
    energy_level: energyLevel,
    mood: moods[0] ?? "",
    moods,
    notes,
    created_at: new Date().toISOString(),
  };
  writeArray(LOGS_KEY, [log, ...loadGuestLogs()]);
}

export function classifyGuestTask(title: string): {
  category: TaskTag;
  energy_required: number;
  effort_level: EffortLevel;
} {
  const text = title.toLowerCase();
  if (/email|reply|invoice|form|schedule|book|organize|admin/.test(text)) {
    return { category: "Admin", energy_required: 2, effort_level: "Low" };
  }
  if (/buy|shop|grocery|pick up|drop off|errand/.test(text)) {
    return { category: "Errands", energy_required: 2, effort_level: "Low" };
  }
  if (/call|meet|message|visit|family|friend/.test(text)) {
    return { category: "Social", energy_required: 3, effort_level: "Medium" };
  }
  if (/design|draw|write|draft|brainstorm|create|paint/.test(text)) {
    return { category: "Creative", energy_required: 4, effort_level: "High" };
  }
  return { category: "Deep Work", energy_required: 4, effort_level: "High" };
}

function readArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Guest storage is unavailable in this browser");
  }
}
