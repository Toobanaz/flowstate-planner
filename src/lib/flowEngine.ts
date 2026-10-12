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
  override_bucket: string | null;
  override_date: string | null;
}

export interface PlannedTask extends Task {
  reason: string;
}

export interface UserState {
  energyLevel: number;
  mood: Mood | null;
  notes: string;
}

export interface FlowResult {
  doNow: PlannedTask[];
  doLater: PlannedTask[];
  avoid: PlannedTask[];
  tomorrow: PlannedTask[];
  localTime: LocalTimeContext;
  aiSuggestion?: AISuggestion;
  timeline: {
    morning: PlannedTask[];
    afternoon: PlannedTask[];
    evening: PlannedTask[];
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

export interface LocalTimeContext {
  localDate: string;
  localTime: string;
  hour: number;
  timeZone: string;
  period: SchedulePreference;
}

export function getLocalTimeContext(now = new Date()): LocalTimeContext {
  const hour = now.getHours();
  return {
    localDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    localTime: `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    hour,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    period: hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening",
  };
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

export function isOverrideActive(task: Task, localDate: string): boolean {
  return task.override_bucket === "do_now" && task.override_date === localDate;
}

export function planFlow(tasks: Task[], state: UserState, localTime = getLocalTimeContext()): FlowResult {
  let moodModifier = 0;
  if (state.mood === "Overwhelmed" || state.mood === "Anxious") moodModifier = -1;
  if (state.mood === "Motivated") moodModifier = 1;

  const effectiveEnergy = Math.min(5, Math.max(1, state.energyLevel + moodModifier));

  const doNow: PlannedTask[] = [];
  const doLater: PlannedTask[] = [];
  const avoid: PlannedTask[] = [];
  const tomorrow: PlannedTask[] = [];
  const timeline = { morning: [] as PlannedTask[], afternoon: [] as PlannedTask[], evening: [] as PlannedTask[] };
  const periods: SchedulePreference[] = ["morning", "afternoon", "evening"];
  const currentIndex = periods.indexOf(localTime.period);

  const activeTasks = tasks.filter((t) => !t.completed);
  const sorted = [...activeTasks].sort((a, b) => getTaskEnergy(a) - getTaskEnergy(b));

  for (const task of sorted) {
    const required = getTaskEnergy(task);

    if (isOverrideActive(task, localTime.localDate)) {
      const planned: PlannedTask = {
        ...task,
        reason: "You chose to do this now — your choice overrides the planner for today.",
      };
      doNow.push(planned);
      timeline[localTime.period].push(planned);
      continue;
    }

    if (localTime.hour < 6 || (localTime.hour >= 18 && required >= 4)) {
      tomorrow.push({
        ...task,
        reason:
          localTime.hour < 6
            ? `It's ${localTime.localTime} — rest first. This fits tomorrow morning.`
            : `Needs ${required}/5 energy and it's already evening — best tackled tomorrow morning.`,
      });
      continue;
    }
    if (required > effectiveEnergy + 1) {
      avoid.push({
        ...task,
        reason: `Needs ${required}/5 energy, but you're at ${effectiveEnergy}/5 — revisit when your energy is higher.`,
      });
      continue;
    }
    const preferred = task.schedule_preference ?? (required >= 4 ? "morning" : required >= 3 ? "afternoon" : localTime.period);
    let slotIndex = Math.max(currentIndex, periods.indexOf(preferred));
    if (required > effectiveEnergy && slotIndex === currentIndex) slotIndex += 1;
    const slot = periods[slotIndex];
    if (!slot) {
      tomorrow.push({
        ...task,
        reason: `No good slot left today — planned for tomorrow morning instead.`,
      });
      continue;
    }
    if (slot === localTime.period && required <= effectiveEnergy) {
      const planned: PlannedTask = {
        ...task,
        reason: `Needs ${required}/5 energy — you have ${effectiveEnergy}/5, so it fits your ${localTime.period}.`,
      };
      doNow.push(planned);
      timeline[slot].push(planned);
    } else {
      const planned: PlannedTask = {
        ...task,
        reason:
          required > effectiveEnergy
            ? `Needs ${required}/5 energy — just above your current ${effectiveEnergy}/5, so save it for ${slot}.`
            : `Needs ${required}/5 energy — a better fit for ${slot}.`,
      };
      doLater.push(planned);
      timeline[slot].push(planned);
    }
  }

  // Smart UX: if overwhelmed, limit doNow to small tasks (max 3)
  if (state.mood === "Overwhelmed" && doNow.length > 3) {
    const overflow = doNow.splice(3);
    overflow.forEach((t) => {
      t.reason = "You're feeling overwhelmed, so the list stays short — this moves to later.";
    });
    doLater.push(...overflow);
  }

  // Low energy: suggest fewer
  if (effectiveEnergy <= 2 && doNow.length > 2) {
    const overflow = doNow.splice(2);
    overflow.forEach((t) => {
      t.reason = `Your energy is ${effectiveEnergy}/5, so the list stays short — this moves to later.`;
    });
    doLater.push(...overflow);
  }

  // If focused, prioritize deep work to top
  if (state.mood === "Focused") {
    doNow.sort((a, b) => getTaskEnergy(b) - getTaskEnergy(a));
  }

  return { doNow, doLater, avoid, tomorrow, localTime, timeline };
}

export function generateId(): string {
  return crypto.randomUUID();
}
