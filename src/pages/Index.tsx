import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Task, UserState, FlowResult, Insight, SchedulePreference, planFlow, getLocalTimeContext } from "@/lib/flowEngine";
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
} from "@/lib/api";
import { CheckInCard } from "@/components/CheckInCard";
import { TaskInput } from "@/components/TaskInput";
import { TaskCard } from "@/components/TaskCard";
import { FlowResults } from "@/components/FlowResults";
import { InsightsCard } from "@/components/InsightsCard";
import { Leaf, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Index() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userState, setUserState] = useState<UserState>({ energyLevel: 3, moods: [], notes: "" });
  const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchTasks()
      .then(setTasks)
      .catch((e) => {
        console.error("Failed to fetch tasks:", e);
        toast.error("Failed to load tasks");
      })
      .finally(() => setTasksLoading(false));
  }, [user]);

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
        toast.success(`Classified as ${classification.category} ✨`);
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
    setFlowResult((prev) => {
      if (!prev || !completed) return null;
      const remaining = [...prev.doNow, ...prev.doLater, ...prev.avoid, ...prev.tomorrow]
        .filter((task) => task.id !== id);
      return planFlow(remaining, userState, prev.localTime);
    });
    try {
      await toggleTaskComplete(id, completed);
    } catch (e) {
      console.error("Failed to toggle task:", e);
      toast.error("Failed to update task");
    }
  }, [userState]);

  const handlePlanFlow = useCallback(async () => {
    setLoading(true);
    setFlowResult(null);

    const activeTasks = tasks.filter((task) => !task.completed);
    const localTime = getLocalTimeContext();
    const fallbackResult = planFlow(tasks, userState, localTime);

    if (userState.moods.length > 0) {
      try {
        await saveDailyLog(userState.energyLevel, userState.moods, userState.notes);
      } catch (e) {
        console.error("Failed to save daily log:", e);
      }
    }

    try {
      const aiPlan = await planFlowAI(userState, activeTasks, localTime);
      const updates = aiPlan.schedule
        .map((item) => {
          const matchedTask = activeTasks.find((task) => task.title === item.task);
          const schedule = toSchedulePreference(item.time);
          return matchedTask && schedule ? { id: matchedTask.id, schedule } : null;
        })
        .filter((item): item is { id: string; schedule: SchedulePreference } => Boolean(item));

      const scheduledTasks = tasks.map((task) => {
        const update = updates.find((item) => item.id === task.id);
        return update ? { ...task, schedule_preference: update.schedule } : task;
      });

      setFlowResult(planFlow(scheduledTasks, userState, localTime));
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
      const result = await getInsightsAI(userState.moods);
      setInsights(result);
    } catch (e: unknown) {
      console.error("Failed to get insights:", e);
      toast.error(e instanceof Error ? e.message : "Failed to get insights");
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="w-6 h-6" style={{ animation: "gentlePulse 1.5s ease-in-out infinite" }} />
          <span className="text-sm font-medium text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-10 pb-6 text-center relative">
        <div className="absolute right-4 top-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {user.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
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

        <Separator className="bg-border/80" />

        <section className="space-y-4 animate-fade-up-delay-1">
          <h2 className="text-lg font-semibold text-foreground">Your Tasks</h2>
          <TaskInput onAdd={addTask} isClassifying={isClassifying} />

          {tasksLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Add a few tasks to start planning your flow 🌱</p>
              <p className="text-xs text-muted-foreground mt-1">AI will automatically classify them ✨</p>
            </div>
          ) : !flowResult && !loading ? (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onRemove={removeTask} onToggleComplete={handleToggleComplete} />
              ))}
            </div>
          ) : null}

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

        {(loading || flowResult) && (
          <>
            <Separator className="bg-border/80" />

            {loading && (
              <div className="text-center py-8 animate-fade-up">
                <div className="inline-flex items-center gap-2 text-primary">
                  <Leaf className="w-5 h-5" style={{ animation: "gentlePulse 1.5s ease-in-out infinite" }} />
                  <span className="text-sm font-medium">Planning your flow...</span>
                </div>
              </div>
            )}

            {flowResult && !loading && (
              <FlowResults result={flowResult} userState={userState} onRemove={removeTask} onToggleComplete={handleToggleComplete} />
            )}
          </>
        )}

        <Separator className="bg-border/80" />

        <section aria-label="View Insights">
          <InsightsCard insights={insights} loading={insightsLoading} onFetch={handleGetInsights} />
        </section>
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
