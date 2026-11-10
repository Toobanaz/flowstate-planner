import { useEffect, useState } from "react";
import { PaceProfile, Task, estimateTaskSeconds, getTaskEffort, getTaskEnergy, getTaskTag, getTrackedSeconds } from "@/lib/flowEngine";
import { X, Brain, Palette, FileText, Users, ShoppingBag, Sparkles, Check, ArrowUp, CalendarClock, Pause, Play, Timer } from "lucide-react";
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
  onMoveToDoNow?: (id: string) => void;
  showSchedule?: boolean;
  reason?: string;
  isOverridden?: boolean;
  paceProfile?: PaceProfile;
  onToggleTimer?: (id: string) => void;
}

export function TaskCard({
  task,
  onRemove,
  onToggleComplete,
  onMoveToDoNow,
  showSchedule = true,
  reason,
  isOverridden = false,
  paceProfile = {},
  onToggleTimer,
}: TaskCardProps) {
  const [, setTick] = useState(0);
  const tag = getTaskTag(task);
  const effort = getTaskEffort(task);
  const trackedSeconds = getTrackedSeconds(task);
  const paceSeconds = estimateTaskSeconds(task, paceProfile);

  useEffect(() => {
    if (!task.timer_started_at) return;
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [task.timer_started_at]);
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
          {tag ? tagIcons[tag] : <FileText className="w-3.5 h-3.5" />}
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
        {tag && (
          <span className={`tag-badge ${tagStyles[tag]}`}>{tag}</span>
        )}
        {effort && (
          <span className="text-xs text-muted-foreground">{effort} effort</span>
        )}
        <span className="text-xs text-muted-foreground">Energy {getTaskEnergy(task)}/5</span>
        {(trackedSeconds > 0 || task.timer_started_at) && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Timer className="h-3 w-3" />
            {formatDuration(trackedSeconds)} tracked
          </span>
        )}
        {paceSeconds !== null && (
          <span className="text-xs text-muted-foreground">Usual pace ~{formatApproximateDuration(paceSeconds)}</span>
        )}
        {(task.deadline_date || task.deadline_time) && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <CalendarClock className="h-3 w-3" />
            Due {formatDeadline(task.deadline_date, task.deadline_time)}
          </span>
        )}
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
        {onToggleTimer && !task.completed && (
          <Button
            variant={task.timer_started_at ? "secondary" : "outline"}
            size="sm"
            onClick={() => onToggleTimer(task.id)}
            className="h-7 rounded-lg px-2 text-xs"
          >
            {task.timer_started_at ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
            {task.timer_started_at ? "Pause" : trackedSeconds > 0 ? "Resume" : "Start timer"}
          </Button>
        )}
      </div>
      {(reason || isOverridden || onMoveToDoNow) && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          {isOverridden ? (
            <span className="text-xs font-medium text-primary/80">Your choice</span>
          ) : (
            <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">{reason}</p>
          )}
          {onMoveToDoNow && !isOverridden && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveToDoNow(task.id)}
              className="h-7 shrink-0 rounded-lg px-2 text-xs text-primary hover:text-primary"
            >
              <ArrowUp className="mr-1 h-3 w-3" />
              Move to Do Now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remainder).padStart(2, "0")}s`
    : `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function formatApproximateDuration(seconds: number): string {
  if (seconds < 60) return "<1 min";
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}

function formatDeadline(date: string | null, time: string | null) {
  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "today";
  if (!time) return dateLabel;
  const timeLabel = new Date(`2000-01-01T${time}`).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateLabel} at ${timeLabel}`;
}
