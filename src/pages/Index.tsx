import { useState, useEffect, useCallback } from "react";
import { Task, UserState, FlowResult, Insight, SchedulePreference, planFlow } from "@/lib/flowEngine";
import {
  fetchTasks,
  createTask,
  deleteTask,
  toggleTaskComplete,
  updateTaskClassification,
  classifyTaskAI,
  saveDailyLog,
  getInsightsAI,
  planFlowAI,
  updateTaskSchedules,
} from "@/lib/api";
import { CheckInCard } from "@/components/CheckInCard";
import { TaskInput } from "@/components/TaskInput";
import { TaskCard } from "@/components/TaskCard";
import { FlowResults } from "@/components/FlowResults";
import { InsightsCard } from "@/components/InsightsCard";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userState, setUserState] = useState<UserState>({ energyLevel: 3, mood: null, notes: "" });
  const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((e) => {
        console.error("Failed to fetch tasks:", e);
        toast.error("Failed to load tasks");
      })
      .finally(() => setTasksLoading(false));
  }, []);

  const addTask = useCallback(async (title: string) => {
    setIsClassifying(true);
    try {
      const newTask = await createTask(title);
      setTasks((prev) => [newTask, ...prev]);
      setFlowResult(null);

      try {
        const classification = await classifyTaskAI(title);
        await updateTaskClassification(
          newTask.id,
          classification.category,
          classification.energy_required,
          classification.effort_level
        );
        setTasks((prev) =>
          prev.map((task) =>
            task.id === newTask.id
              ? {
                  ...task,
                  tag: classification.category,
                  energy_required: classification.energy_required,
                  effort_level: classification.effort_level,
                  ai_classified: true,
                }
              : task
          )
        );
        toast.success(`Classified as ${classification.category} ${"\u2728"}`);
      } catch (e) {
        console.error("AI classification failed:", e);
        toast.error("AI classification failed - task saved without category");
      }
    } catch (e) {
      console.error("Failed to add task:", e);
      toast.error("Failed to add task");
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setFlowResult(null);
    try {
      await deleteTask(id);
    } catch (e) {
      console.error("Failed to delete task:", e);
      toast.error("Failed to delete task");
    }
  }, []);

  const handleToggleComplete = useCallback(async (id: string, completed: boolean) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed } : task)));
    try {
      await toggleTaskComplete(id, completed);
    } catch (e) {
      console.error("Failed to toggle task:", e);
      toast.error("Failed to update task");
    }
  }, []);

  const handlePlanFlow = useCallback(async () => {
    setLoading(true);
    setFlowResult(null);

    const activeTasks = tasks.filter((task) => !task.completed);
    const fallbackResult = planFlow(tasks, userState);

    if (userState.mood) {
      try {
        await saveDailyLog(userState.energyLevel, userState.mood, userState.notes);
      } catch (e) {
        console.error("Failed to save daily log:", e);
      }
    }

    try {
      const aiPlan = await planFlowAI(userState, activeTasks);
      const updates = aiPlan.schedule
        .map((item) => {
          const matchedTask = activeTasks.find((task) => task.title === item.task);
          const schedule = toSchedulePreference(item.time);
          return matchedTask && schedule ? { id: matchedTask.id, schedule } : null;
        })
        .filter((item): item is { id: string; schedule: SchedulePreference } => Boolean(item));

      if (updates.length > 0) {
        await updateTaskSchedules(updates);
      }

      const scheduledTasks = tasks.map((task) => {
        const update = updates.find((item) => item.id === task.id);
        return update ? { ...task, schedule_preference: update.schedule } : task;
      });

      setTasks(scheduledTasks);
      setFlowResult({ ...planFlow(scheduledTasks, userState), aiSuggestion: aiPlan.suggestion });
    } catch (e) {
      console.error("AI planning failed:", e);
      toast.error("AI suggestions are unavailable right now - showing your local flow plan");
      setFlowResult(fallbackResult);
    } finally {
      setLoading(false);
    }
  }, [tasks, userState]);

  const handleGetInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const result = await getInsightsAI();
      setInsights(result);
    } catch (e: unknown) {
      console.error("Failed to get insights:", e);
      toast.error(e instanceof Error ? e.message : "Failed to get insights");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">FlowState</h1>
        </div>
        <p className="text-sm text-muted-foreground">Energy-based planner for mindful productivity</p>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 space-y-8">
        <CheckInCard
          state={userState}
          onStateChange={setUserState}
          onPlanFlow={handlePlanFlow}
          hasTasks={activeTasks.length > 0}
        />

        <section className="space-y-4 animate-fade-up-delay-1">
          <h2 className="text-lg font-semibold text-foreground">Your Tasks</h2>
          <TaskInput onAdd={addTask} isClassifying={isClassifying} />

          {tasksLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Add a few tasks to start planning your flow {"\uD83C\uDF31"}</p>
              <p className="text-xs text-muted-foreground mt-1">AI will automatically classify them {"\u2728"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onRemove={removeTask} onToggleComplete={handleToggleComplete} />
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Completed ({completedTasks.length})
              </p>
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onRemove={removeTask} onToggleComplete={handleToggleComplete} />
              ))}
            </div>
          )}
        </section>

        {loading && (
          <div className="text-center py-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 text-primary">
              <Leaf className="w-5 h-5" style={{ animation: "gentlePulse 1.5s ease-in-out infinite" }} />
              <span className="text-sm font-medium">Planning your flow...</span>
            </div>
          </div>
        )}

        {flowResult && !loading && <FlowResults result={flowResult} userState={userState} />}

        <InsightsCard insights={insights} loading={insightsLoading} onFetch={handleGetInsights} />
      </main>
    </div>
  );
}

function toSchedulePreference(value: string): SchedulePreference | null {
  const normalized = value.toLowerCase();
  if (normalized === "morning" || normalized === "afternoon" || normalized === "evening") {
    return normalized;
  }
  return null;
}
