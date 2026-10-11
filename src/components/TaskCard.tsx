import { Task, getTaskEnergy } from "@/lib/flowEngine";
import { X, Brain, Palette, FileText, Users, ShoppingBag, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  showSchedule?: boolean;
}

export function TaskCard({ task, onRemove, onToggleComplete, showSchedule = true }: TaskCardProps) {
  return (
    <div className={`flow-card !p-4 relative space-y-3 group transition-all ${task.completed ? "opacity-60" : ""}`}>
      <div className={`flex items-start gap-3 min-w-0 ${onRemove ? "pr-8" : ""}`}>
        {onToggleComplete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleComplete(task.id, !task.completed)}
            className={`!w-5 !h-5 mt-0.5 p-0 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              task.completed
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary"
            }`}
            aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
          >
            {task.completed && <Check className="w-3 h-3" />}
          </Button>
        )}
        <span className="text-muted-foreground shrink-0 mt-1">
          {task.tag ? tagIcons[task.tag] : <FileText className="w-3.5 h-3.5" />}
        </span>
        <span className={`min-w-0 flex-1 text-sm leading-relaxed font-medium whitespace-pre-wrap [overflow-wrap:anywhere] ${task.completed ? "line-through" : ""}`}>
          {task.title}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {task.ai_classified && (
          <span className="flex items-center gap-1 text-xs text-primary/70">
            <Sparkles className="w-3 h-3" />
            AI Enhanced
          </span>
        )}
        {task.tag && (
          <span className={`tag-badge ${tagStyles[task.tag]}`}>{task.tag}</span>
        )}
        {task.effort_level && (
          <span className="text-xs text-muted-foreground">{task.effort_level} effort</span>
        )}
        <span className="text-xs text-muted-foreground">Energy {getTaskEnergy(task)}/5</span>
        {showSchedule && task.schedule_preference && (
          <span className="text-xs text-muted-foreground capitalize">{task.schedule_preference}</span>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(task.id)}
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label="Remove task"
            title="Remove task"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
