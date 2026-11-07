import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, History } from "lucide-react";
import { Task } from "@/lib/flowEngine";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";

interface TaskHistoryCardProps {
  tasks: Task[];
  onRemove: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

export function TaskHistoryCard({ tasks, onRemove, onToggleComplete }: TaskHistoryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flow-card space-y-4 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Task History</h2>
            <p className="text-xs text-muted-foreground">{tasks.length} completed task{tasks.length === 1 ? "" : "s"} saved</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen((value) => !value)}>
          {open ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {open ? "Hide" : "View"}
        </Button>
      </div>

      {open && (tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onRemove={onRemove} onToggleComplete={onToggleComplete} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-accent/40 p-4 text-sm text-muted-foreground">
          <CheckCircle2 className="w-4 h-4" />
          Completed tasks will appear here.
        </div>
      ))}
    </div>
  );
}
