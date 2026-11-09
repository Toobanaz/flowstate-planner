import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import {
  AIPlanResponse,
  EffortLevel,
  Insight,
  OverrideBucket,
  SchedulePreference,
  Task,
  TaskTag,
  UserState,
  getTaskEffort,
  getTaskEnergy,
  getTaskTag,
  getLocalTimeContext,
} from "./flowEngine";
import type { DailyLog } from "./history";
import { getObviousTaskClassification } from "./taskClassification";

export interface TaskClassification {
  category: TaskTag;
  energy_required: number;
  effort_level: EffortLevel;
}

type TaskRow = Tables<"tasks">;

async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// Tasks CRUD
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbTask);
}

export async function createTask(title: string, deadlineDate: string | null = null, deadlineTime: string | null = null): Promise<Task> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ title, user_id: userId, deadline_date: deadlineDate, deadline_time: deadlineTime })
    .select()
    .single();
  if (error) throw error;
  return mapDbTask(data);
}

export async function updateTaskClassification(
  id: string,
  tag: TaskTag,
  energy: number,
  effortLevel: EffortLevel
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ tag, energy_required: energy, effort_level: effortLevel, ai_classified: true })
    .eq("id", id);
  if (error) throw error;
}

export async function updateTaskSchedule(id: string, schedule: SchedulePreference): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ schedule_preference: schedule })
    .eq("id", id);
  if (error) throw error;
}

export async function updateTaskSchedules(
  updates: Array<{ id: string; schedule: SchedulePreference }>
): Promise<void> {
  await Promise.all(updates.map(({ id, schedule }) => updateTaskSchedule(id, schedule)));
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
  if (error) throw error;
}

export async function updateTaskOverride(
  id: string,
  overrideBucket: OverrideBucket,
  localDate: string
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ override_bucket: overrideBucket, override_date: localDate })
    .eq("id", id);
  if (error) throw error;
}

// Daily logs
export async function saveDailyLog(energyLevel: number, moods: string[], notes: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase.from("daily_logs").insert({
    energy_level: energyLevel,
    mood: moods[0],
    moods,
    notes,
    user_id: userId,
  });
  if (error) throw error;
}

export async function fetchRecentDailyLogs(): Promise<DailyLog[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// AI classify
export async function classifyTaskAI(taskText: string): Promise<TaskClassification> {
  const { data, error } = await supabase.functions.invoke("classify-task", {
    body: { task: taskText },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return getObviousTaskClassification(taskText) ?? normalizeClassification(data);
}

// AI plan suggestions + scheduling
export async function planFlowAI(state: UserState, tasks: Task[], localTime = getLocalTimeContext()): Promise<AIPlanResponse> {
  const { data, error } = await supabase.functions.invoke("plan-flow-ai", {
    body: {
      energy_level: state.energyLevel,
      moods: state.moods,
      notes: state.notes,
      local_context: localTime,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        category: getTaskTag(task),
        energy_required: getTaskEnergy(task),
        effort_level: getTaskEffort(task),
        deadline_date: task.deadline_date,
        deadline_time: task.deadline_time,
      })),
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// AI insights
export async function getInsightsAI(
  currentMoods: string[] = [],
  localTime = getLocalTimeContext()
): Promise<Insight[]> {
  const { data, error } = await supabase.functions.invoke("get-insights", {
    body: { moods: currentMoods, local_context: localTime },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.insights || [];
}

function mapDbTask(row: TaskRow): Task {
  const corrected = getObviousTaskClassification(row.title);
  return {
    id: row.id,
    title: row.title,
    tag: corrected?.category ?? (row.tag as TaskTag | null),
    energy_required: corrected?.energy_required ?? row.energy_required ?? 3,
    effort_level: corrected?.effort_level ?? (row.effort_level as EffortLevel | null) ?? null,
    schedule_preference: row.schedule_preference as SchedulePreference | null,
    ai_classified: row.ai_classified ?? false,
    completed: row.completed ?? false,
    created_at: row.created_at,
    override_bucket: row.override_bucket ?? null,
    override_date: row.override_date ?? null,
    deadline_date: row.deadline_date ?? null,
    deadline_time: row.deadline_time ?? null,
  };
}

function normalizeClassification(data: Partial<TaskClassification> & { tag?: TaskTag; energy?: number }): TaskClassification {
  return {
    category: (data.category ?? data.tag) as TaskTag,
    energy_required: (data.energy_required ?? data.energy) as number,
    effort_level: data.effort_level as EffortLevel,
  };
}
