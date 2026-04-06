import { supabase } from "@/integrations/supabase/client";
import { Task, TaskTag, SchedulePreference, Insight } from "./flowEngine";

// Tasks CRUD
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapDbTask);
}

export async function createTask(title: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ title })
    .select()
    .single();
  if (error) throw error;
  return mapDbTask(data);
}

export async function updateTaskClassification(
  id: string,
  tag: TaskTag,
  energy: number,
  schedule: SchedulePreference
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ tag, energy_required: energy, schedule_preference: schedule, ai_classified: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
  if (error) throw error;
}

// Daily logs
export async function saveDailyLog(energyLevel: number, mood: string, notes: string): Promise<void> {
  const { error } = await supabase.from("daily_logs").insert({
    energy_level: energyLevel,
    mood,
    notes,
  });
  if (error) throw error;
}

// AI classify
export async function classifyTaskAI(taskText: string): Promise<{ tag: TaskTag; energy: number; schedule: SchedulePreference }> {
  const { data, error } = await supabase.functions.invoke("classify-task", {
    body: { task: taskText },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// AI insights
export async function getInsightsAI(): Promise<Insight[]> {
  const { data, error } = await supabase.functions.invoke("get-insights");
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.insights || [];
}

function mapDbTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    tag: row.tag as TaskTag | null,
    energy_required: row.energy_required ?? 3,
    schedule_preference: row.schedule_preference as SchedulePreference | null,
    ai_classified: row.ai_classified ?? false,
    completed: row.completed ?? false,
    created_at: row.created_at,
  };
}
