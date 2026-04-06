export type TaskTag = "Deep Work" | "Creative" | "Admin" | "Social" | "Errands";
export type Mood = "Focused" | "Overwhelmed" | "Calm" | "Anxious" | "Motivated";
export type SchedulePreference = "morning" | "afternoon" | "evening";
export type EffortLevel = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  tag: TaskTag | null;
  energy_required: number;
  effort_level: EffortLevel | null;
  schedule_preference: SchedulePreference | null;
  ai_classified: boolean;
  completed: boolean;
  created_at: string;
}

export interface UserState {
  energyLevel: number;
  mood: Mood | null;
  notes: string;
}

export interface FlowResult {
  doNow: Task[];
  doLater: Task[];
  avoid: Task[];
  aiSuggestion?: AISuggestion;
  timeline: {
    morning: Task[];
    afternoon: Task[];
    evening: Task[];
  };
}

export interface AISuggestion {
  try_first: string;
  avoid_now: string;
}

export interface AIPlanResponse {
  suggestion: AISuggestion;
  schedule: Array<{
    task: string;
    time: "Morning" | "Afternoon" | "Evening";
  }>;
}

export interface Insight {
  emoji: string;
  title: string;
  text: string;
}

const taskEnergyMap: Record<TaskTag, number> = {
  "Deep Work": 5,
  Creative: 4,
  Admin: 2,
  Social: 3,
  Errands: 2,
};

export function getTaskEnergy(task: Task): number {
  if (task.energy_required) return task.energy_required;
  if (task.tag) return taskEnergyMap[task.tag] ?? 3;
  return 3;
}

export function planFlow(tasks: Task[], state: UserState): FlowResult {
  let moodModifier = 0;
  if (state.mood === "Overwhelmed" || state.mood === "Anxious") moodModifier = -1;
  if (state.mood === "Motivated") moodModifier = 1;

  const effectiveEnergy = Math.min(5, Math.max(1, state.energyLevel + moodModifier));

  const doNow: Task[] = [];
  const doLater: Task[] = [];
  const avoid: Task[] = [];

  const activeTasks = tasks.filter((t) => !t.completed);
  const sorted = [...activeTasks].sort((a, b) => getTaskEnergy(a) - getTaskEnergy(b));

  for (const task of sorted) {
    const required = getTaskEnergy(task);
    if (required <= effectiveEnergy) {
      doNow.push(task);
    } else if (required === effectiveEnergy + 1) {
      doLater.push(task);
    } else {
      avoid.push(task);
    }
  }

  // Smart UX: if overwhelmed, limit doNow to small tasks (max 3)
  if (state.mood === "Overwhelmed" && doNow.length > 3) {
    const overflow = doNow.splice(3);
    doLater.push(...overflow);
  }

  // Low energy: suggest fewer
  if (effectiveEnergy <= 2 && doNow.length > 2) {
    const overflow = doNow.splice(2);
    doLater.push(...overflow);
  }

  // If focused, prioritize deep work to top
  if (state.mood === "Focused") {
    doNow.sort((a, b) => getTaskEnergy(b) - getTaskEnergy(a));
  }

  // Build the timeline from every active task so AI scheduling can guide the whole day.
  const timeline = { morning: [] as Task[], afternoon: [] as Task[], evening: [] as Task[] };
  for (const task of activeTasks) {
    const pref = task.schedule_preference;
    if (pref) {
      timeline[pref].push(task);
    } else {
      // Auto-assign based on energy
      const energy = getTaskEnergy(task);
      if (energy >= 4) timeline.morning.push(task);
      else if (energy >= 3) timeline.afternoon.push(task);
      else timeline.evening.push(task);
    }
  }

  return { doNow, doLater, avoid, timeline };
}

export function generateId(): string {
  return crypto.randomUUID();
}
