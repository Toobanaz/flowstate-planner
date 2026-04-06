import { useState, useEffect, useCallback } from "react";
import { Task, UserState, FlowResult, planFlow } from "@/lib/flowEngine";
import { loadTasks, saveTasks, loadUserState, saveUserState } from "@/lib/storage";
import { CheckInCard } from "@/components/CheckInCard";
import { TaskInput } from "@/components/TaskInput";
import { TaskCard } from "@/components/TaskCard";
import { FlowResults } from "@/components/FlowResults";
import { Leaf } from "lucide-react";

export default function Index() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [userState, setUserState] = useState<UserState>(() => loadUserState());
  const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveUserState(userState), [userState]);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
    setFlowResult(null);
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setFlowResult(null);
  }, []);

  const handlePlanFlow = useCallback(() => {
    setLoading(true);
    setFlowResult(null);
    setTimeout(() => {
      setFlowResult(planFlow(tasks, userState));
      setLoading(false);
    }, 800);
  }, [tasks, userState]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">FlowState</h1>
        </div>
        <p className="text-sm text-muted-foreground">Energy-based planner for mindful productivity</p>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 space-y-8">
        {/* Check-in */}
        <CheckInCard
          state={userState}
          onStateChange={setUserState}
          onPlanFlow={handlePlanFlow}
          hasTasks={tasks.length > 0}
        />

        {/* Task List */}
        <section className="space-y-4 animate-fade-up-delay-1">
          <h2 className="text-lg font-semibold text-foreground">Your Tasks</h2>
          <TaskInput onAdd={addTask} />
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Add a few tasks to start planning your flow 🌱</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onRemove={removeTask} />
              ))}
            </div>
          )}
        </section>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 text-primary">
              <Leaf className="w-5 h-5" style={{ animation: "gentlePulse 1.5s ease-in-out infinite" }} />
              <span className="text-sm font-medium">Planning your flow…</span>
            </div>
          </div>
        )}

        {/* Results */}
        {flowResult && !loading && <FlowResults result={flowResult} />}
      </main>
    </div>
  );
}
