export type TaskTag = "Deep Work" | "Creative" | "Admin" | "Social" | "Errands";
export type Mood = "Focused" | "Overwhelmed" | "Calm" | "Anxious" | "Motivated";

export interface Task {
  id: string;
  title: string;
  tag: TaskTag;
  createdAt: string;
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
}

const taskEnergyMap: Record<TaskTag, number> = {
  "Deep Work": 5,
  Creative: 4,
  Admin: 2,
  Social: 3,
  Errands: 2,
};

export function planFlow(tasks: Task[], state: UserState): FlowResult {
  let moodModifier = 0;
  if (state.mood === "Overwhelmed" || state.mood === "Anxious") moodModifier = -1;
  if (state.mood === "Motivated") moodModifier = 1;

  const effectiveEnergy = Math.min(5, Math.max(1, state.energyLevel + moodModifier));

  const doNow: Task[] = [];
  const doLater: Task[] = [];
  const avoid: Task[] = [];

  // Sort tasks by energy requirement for smarter ordering
  const sorted = [...tasks].sort(
    (a, b) => taskEnergyMap[a.tag] - taskEnergyMap[b.tag]
  );

  for (const task of sorted) {
    const required = taskEnergyMap[task.tag];
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
    doNow.sort((a, b) => taskEnergyMap[b.tag] - taskEnergyMap[a.tag]);
  }

  return { doNow, doLater, avoid };
}

export function generateId(): string {
  return crypto.randomUUID();
}
