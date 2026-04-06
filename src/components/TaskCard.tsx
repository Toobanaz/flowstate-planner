import { Task } from "@/lib/flowEngine";
import { X, Brain, Palette, FileText, Users, ShoppingBag } from "lucide-react";

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
}

export function TaskCard({ task, onRemove }: TaskCardProps) {
  return (
    <div className="flow-card !p-4 flex items-center justify-between gap-3 group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-muted-foreground">{tagIcons[task.tag]}</span>
        <span className="text-sm font-medium truncate">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`tag-badge ${tagStyles[task.tag]}`}>{task.tag}</span>
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
