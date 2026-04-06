import { Task, getTaskEnergy } from "@/lib/flowEngine";
import { X, Brain, Palette, FileText, Users, ShoppingBag, Sparkles, Check } from "lucide-react";

const tagStyles: Record<string, string> = {
  "Deep Work": "tag-deep-work",
  Creative: "tag-creative",
  Admin: "tag-admin",
  Social: "tag-social",
  Errands: "tag-errands",
};

const tagIcons: Record<string, React.ReactNode> = {
  "Deep Work": <Brain className="w-3.5 h-3.5" />,
  Creative: <Palette className="w-3.5 h-3.5" />,
  Admin: <FileText className="w-3.5 h-3.5" />,
  Social: <Users className="w-3.5 h-3.5" />,
  Errands: <ShoppingBag className="w-3.5 h-3.5" />,
};

interface TaskCardProps {
  task: Task;
  onRemove?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

export function TaskCard({ task, onRemove, onToggleComplete }: TaskCardProps) {
  return (
    <div className={`flow-card !p-4 flex items-center justify-between gap-3 group transition-all ${task.completed ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 min-w-0">
        {onToggleComplete && (
          <button
            onClick={() => onToggleComplete(task.id, !task.completed)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              task.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary"
            }`}
          >
            {task.completed && <Check className="w-3 h-3" />}
          </button>
        )}
        <span className="text-muted-foreground">
          {task.tag ? tagIcons[task.tag] : <FileText className="w-3.5 h-3.5" />}
        </span>
        <span className={`text-sm font-medium truncate ${task.completed ? "line-through" : ""}`}>
          {task.title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.ai_classified && (
          <span className="flex items-center gap-1 text-xs text-primary/70">
            <Sparkles className="w-3 h-3" />
            AI
          </span>
        )}
        {task.tag && (
          <span className={`tag-badge ${tagStyles[task.tag]}`}>{task.tag}</span>
        )}
        {task.schedule_preference && (
          <span className="text-xs text-muted-foreground capitalize">{task.schedule_preference}</span>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(task.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
