export type TaskTag = "Deep Work" | "Creative" | "Admin" | "Social" | "Errands";
export type Mood = "Focused" | "Overwhelmed" | "Calm" | "Anxious" | "Motivated";
export type SchedulePreference = "morning" | "afternoon" | "evening";
export type EffortLevel = "Low" | "Medium" | "High";
export type OverrideBucket = "do_now";

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
  deadline_date: string | null;
  deadline_time: string | null;
}

export interface PlannedTask extends Task {
  reason: string;
  isOverridden: boolean;
}

export interface UserState {
  energyLevel: number;
  moods: Mood[];
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

export const MAX_MOODS = 2;
const ALL_MOODS: Mood[] = ["Focused", "Overwhelmed", "Calm", "Anxious", "Motivated"];

/** Accepts new array records and old single-mood records ("Calm") alike. */
export function normalizeMoods(input: unknown): Mood[] {
  const list = Array.isArray(input) ? input : typeof input === "string" && input ? [input] : [];
  const valid = list.filter((m): m is Mood => ALL_MOODS.includes(m as Mood));
  return Array.from(new Set(valid)).slice(0, MAX_MOODS);
}

export type MoodPriority = "small-first" | "deep-first" | "creative-first" | "balanced";

export interface MoodProfile {
  /** Added to the energy slider value before clamping to 1–5. */
  energyModifier: number;
  /** How the Do Now list is ordered. */
  priority: MoodPriority;
  /** Optional cap on Do Now length (overwhelm keeps the list short). */
  doNowLimit: number | null;
}

/**
 * Single source of truth for how mood combinations shape the plan.
 * Rules are checked top-down; the first matching priority wins:
 *
 * 1. Overwhelmed or Anxious present → small tasks first, energy −1.
 *    This wins even when Motivated is also picked: stress beats drive.
 *    Overwhelmed additionally caps Do Now at 3 tasks.
 * 2. Focused + Motivated → deep work first, energy +1.
 * 3. Focused alone (or with Calm) → deep work first, no energy change.
 * 4. Calm (alone or with Motivated) → creative & personal tasks first.
 * 5. Motivated alone → +1 energy, balanced order.
 *
 * Energy modifiers never stack beyond ±1.
 */
export function getMoodProfile(input: unknown): MoodProfile {
  const moods = normalizeMoods(input);
  const has = (m: Mood) => moods.includes(m);

  if (has("Overwhelmed") || has("Anxious")) {
    return { energyModifier: -1, priority: "small-first", doNowLimit: has("Overwhelmed") ? 3 : null };
  }
  const energyModifier = has("Motivated") ? 1 : 0;
  if (has("Focused")) return { energyModifier, priority: "deep-first", doNowLimit: null };
  if (has("Calm")) return { energyModifier, priority: "creative-first", doNowLimit: null };
  return { energyModifier, priority: "balanced", doNowLimit: null };
}

/** Turns explicit workload wishes in the optional check-in note into a Do Now capacity. */
export function getNoteDoNowLimit(notes: string): number | null {
  const text = notes.trim().toLowerCase();
  if (!text) return null;
  if (/\b(?:pick|choose|focus on|finish|do|start with)\s+(?:just\s+)?one\b|\bone (?:thing|task)\b/.test(text)) {
    return 1;
  }
  if (/\b(?:short|small|manageable) list\b|\b(?:a few|few things)\b|\btoo much on my plate\b/.test(text)) {
    return 3;
  }
  return null;
}

const creativeRank: Record<string, number> = { Creative: 0, Social: 1, Errands: 2 };

function sortByPriority(list: PlannedTask[], priority: MoodPriority) {
  if (priority === "deep-first") list.sort((a, b) => getTaskEnergy(b) - getTaskEnergy(a));
  else if (priority === "creative-first")
    list.sort((a, b) => (creativeRank[a.tag ?? ""] ?? 9) - (creativeRank[b.tag ?? ""] ?? 9) || getTaskEnergy(a) - getTaskEnergy(b));
  else list.sort((a, b) => getTaskEnergy(a) - getTaskEnergy(b));
}

export function planFlow(tasks: Task[], state: UserState, localTime = getLocalTimeContext()): FlowResult {
  const profile = getMoodProfile(state.moods);
  const effectiveEnergy = Math.min(5, Math.max(1, state.energyLevel + profile.energyModifier));
  const statedEnergy = state.energyLevel;

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
    const deadlineDate = task.deadline_date ?? (task.deadline_time ? localTime.localDate : null);
    const deadlinePeriod = task.deadline_time ? periodForTime(task.deadline_time) : null;
    const deadlineMinutes = task.deadline_time ? minutesForTime(task.deadline_time) : null;
    const nowMinutes = localTime.hour * 60 + Number(localTime.localTime.slice(3, 5));

    // Today-only user override always wins, even over avoid/tomorrow rules.
    if (isOverrideActive(task, localTime.localDate)) {
      const planned = withPlacement(task, "You chose to do this now — your choice overrides the planner for today.", true);
      doNow.push(planned);
      timeline[localTime.period].push(planned);
      continue;
    }

    if (deadlineDate && deadlineDate < localTime.localDate) {
      const planned = withPlacement(task, "Deadline has passed — make this the next priority.");
      doNow.push(planned);
      timeline[localTime.period].push(planned);
      continue;
    }

    if (deadlineDate === tomorrowDate(localTime.localDate)) {
      tomorrow.push(withPlacement(task, task.deadline_time
        ? `Due tomorrow at ${formatTime(task.deadline_time)} — plan it for tomorrow ${deadlinePeriod}.`
        : "Due tomorrow — plan it early enough to finish comfortably."));
      continue;
    }

    if (deadlineDate === localTime.localDate && (!deadlineMinutes || deadlineMinutes <= nowMinutes || deadlinePeriod === localTime.period)) {
      const planned = withPlacement(task, task.deadline_time
        ? `Due today at ${formatTime(task.deadline_time)} — prioritize it in this ${localTime.period}.`
        : "Due today — prioritize it now while there is still time.");
      doNow.push(planned);
      timeline[localTime.period].push(planned);
      continue;
    }

    // Late-night rest, and demanding evening tasks wait for tomorrow.
    if (localTime.hour < 6 || (localTime.hour >= 18 && required >= 4)) {
      tomorrow.push(withPlacement(task, tomorrowReason(required, localTime)));
      continue;
    }
    if (required > effectiveEnergy + 1 && deadlineDate !== localTime.localDate) {
      avoid.push(withPlacement(task, energyMismatchReason(required, effectiveEnergy, statedEnergy)));
      continue;
    }

    const preferred = task.schedule_preference ?? (required >= 4 ? "morning" : required >= 3 ? "afternoon" : localTime.period);
    let slotIndex = Math.max(currentIndex, periods.indexOf(preferred));
    if (deadlineDate === localTime.localDate && deadlinePeriod) {
      const deadlineIndex = periods.indexOf(deadlinePeriod);
      slotIndex = required > effectiveEnergy ? deadlineIndex : Math.min(slotIndex, deadlineIndex);
    }
    if (required > effectiveEnergy && slotIndex === currentIndex && deadlineDate !== localTime.localDate) slotIndex += 1;
    const slot = periods[slotIndex];
    if (!slot) {
      tomorrow.push(withPlacement(task, "No good slot left today — moved to tomorrow"));
      continue;
    }
    if (slot === localTime.period && required <= effectiveEnergy) {
      const planned = withPlacement(task, `Needs ${required}/5 energy, within your ${effectiveEnergy}/5 energy now`);
      doNow.push(planned);
      timeline[slot].push(planned);
    } else {
      const planned = withPlacement(task, laterReason(required, effectiveEnergy, statedEnergy, slot));
      doLater.push(planned);
      timeline[slot].push(planned);
    }
  }

  // Overwhelm: keep Do Now short (today-only overrides stay put).
  sortByPriority(doNow, profile.priority);
  prioritizeDeadlines(doNow, localTime.localDate);
  const noteLimit = getNoteDoNowLimit(state.notes);
  const doNowLimit = smallestLimit(profile.doNowLimit, noteLimit);
  if (doNowLimit !== null && doNow.length > doNowLimit) {
    const urgentCount = doNow.filter((task) => isDueTodayOrEarlier(task, localTime.localDate)).length;
    const overflow = takeNonOverrideOverflow(doNow, Math.max(doNowLimit, urgentCount));
    overflow.forEach((t) => {
      t.reason = noteLimit !== null && noteLimit === doNowLimit
        ? "You asked for a smaller focus list, so this moves to later."
        : "You're feeling overwhelmed, so the list stays short — this moves to later.";
    });
    doLater.push(...overflow);
  }

  // Low energy: suggest fewer.
  if (effectiveEnergy <= 2 && doNow.length > 2) {
    const urgentCount = doNow.filter((task) => isDueTodayOrEarlier(task, localTime.localDate)).length;
    const overflow = takeNonOverrideOverflow(doNow, Math.max(2, urgentCount));
    overflow.forEach((t) => {
      t.reason = `Your energy is ${effectiveEnergy}/5, so the list stays short — this moves to later.`;
    });
    doLater.push(...overflow);
  }

  return { doNow, doLater, avoid, tomorrow, localTime, timeline };
}

function smallestLimit(...limits: Array<number | null>): number | null {
  const values = limits.filter((limit): limit is number => limit !== null);
  return values.length ? Math.min(...values) : null;
}

function prioritizeDeadlines(tasks: PlannedTask[], localDate: string): void {
  const rank = (task: Task) => isDueTodayOrEarlier(task, localDate) ? 0 : 1;
  tasks.sort((a, b) => rank(a) - rank(b));
}

function isDueTodayOrEarlier(task: Task, localDate: string): boolean {
  const deadlineDate = task.deadline_date ?? (task.deadline_time ? localDate : null);
  return deadlineDate !== null && deadlineDate <= localDate;
}

function minutesForTime(time: string): number {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function periodForTime(time: string): SchedulePreference {
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

function tomorrowDate(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function withPlacement(task: Task, reason: string, isOverridden = false): PlannedTask {
  return { ...task, reason, isOverridden };
}

/** Drops non-override tasks past the limit; user-picked tasks are never overflowed out. */
function takeNonOverrideOverflow(tasks: PlannedTask[], limit: number): PlannedTask[] {
  const overflowIds = new Set(tasks.filter((task) => !task.isOverridden).slice(limit).map((task) => task.id));
  const overflow = tasks.filter((task) => overflowIds.has(task.id));
  const kept = tasks.filter((task) => !overflowIds.has(task.id));
  tasks.splice(0, tasks.length, ...kept);
  return overflow;
}

function energyMismatchReason(required: number, effectiveEnergy: number, statedEnergy: number): string {
  return effectiveEnergy === statedEnergy
    ? `Needs ${required}/5 energy, you're at ${statedEnergy}`
    : `Needs ${required}/5 energy, available energy is ${effectiveEnergy}/5 after mood adjustment`;
}

function laterReason(
  required: number,
  effectiveEnergy: number,
  statedEnergy: number,
  slot: SchedulePreference
): string {
  if (required > effectiveEnergy) {
    const energy = effectiveEnergy === statedEnergy
      ? `you're at ${statedEnergy}`
      : `available energy is ${effectiveEnergy}/5 after mood adjustment`;
    return `Needs ${required}/5 energy, ${energy}; try ${slot}`;
  }
  return `Better in the ${slot} for a ${required}/5 energy task`;
}

function tomorrowReason(required: number, localTime: LocalTimeContext): string {
  if (localTime.hour < 6) return `It's ${localTime.localTime} — rest first; this fits tomorrow`;
  return `Needs ${required}/5 energy; too demanding for ${localTime.period}, moved to tomorrow`;
}

export function generateId(): string {
  return crypto.randomUUID();
}
