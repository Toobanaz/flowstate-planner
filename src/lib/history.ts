import { Insight, Mood, Task, getLocalTimeContext, normalizeMoods } from "./flowEngine";

export interface DailyLog {
  id: string;
  energy_level: number;
  mood: string;
  moods: string[];
  notes: string | null;
  created_at: string;
}

export function localDateForTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isCarriedOver(task: Task, localDate = getLocalTimeContext().localDate): boolean {
  return !task.completed && localDateForTimestamp(task.created_at) < localDate;
}

export function generateLocalInsights(
  tasks: Task[],
  logs: DailyLog[],
  localDate = getLocalTimeContext().localDate
): Insight[] {
  const since = shiftDate(localDate, -6);
  const recentTasks = tasks.filter((task) => localDateForTimestamp(task.created_at) >= since);
  const recentLogs = logs.filter((log) => localDateForTimestamp(log.created_at) >= since);
  const carryovers = tasks.filter((task) => isCarriedOver(task, localDate));

  if (recentTasks.length === 0 && recentLogs.length === 0) {
    return [{
      emoji: "🌱",
      title: "Patterns Need Time",
      text: "Keep checking in and adding tasks. Your weekly patterns will appear here as your history grows.",
    }];
  }

  const insights: Insight[] = [];
  if (recentLogs.length > 0) {
    const average = recentLogs.reduce((sum, log) => sum + log.energy_level, 0) / recentLogs.length;
    const commonMood = mostCommonMood(recentLogs);
    insights.push({
      emoji: average >= 4 ? "⚡" : average <= 2 ? "🌿" : "✨",
      title: "Your Week So Far",
      text: `Your average energy is ${average.toFixed(1)}/5 across ${recentLogs.length} check-in${recentLogs.length === 1 ? "" : "s"}${commonMood ? `, most often feeling ${commonMood.toLowerCase()}` : ""}.`,
    });
  }

  const completed = recentTasks.filter((task) => task.completed).length;
  if (carryovers.length > 0) {
    insights.push({
      emoji: "↪️",
      title: "Tasks To Revisit",
      text: `${carryovers.length} unfinished task${carryovers.length === 1 ? " has" : "s have"} carried over. Pick the smallest one first, or remove anything that no longer matters.`,
    });
  } else if (recentTasks.length > 0) {
    insights.push({
      emoji: "✓",
      title: "Task Progress",
      text: `You currently have ${completed} of ${recentTasks.length} task${recentTasks.length === 1 ? "" : "s"} from the last 7 days completed.`,
    });
  }

  return insights.slice(0, 2);
}

function mostCommonMood(logs: DailyLog[]): Mood | null {
  const counts = new Map<Mood, number>();
  logs.flatMap((log) => normalizeMoods(log.moods?.length ? log.moods : log.mood)).forEach((mood) => {
    counts.set(mood, (counts.get(mood) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function shiftDate(localDate: string, days: number): string {
  const date = new Date(`${localDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
