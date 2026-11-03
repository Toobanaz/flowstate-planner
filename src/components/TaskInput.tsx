import { useState } from "react";
import { Plus, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskInputProps {
  onAdd: (title: string, deadlineDate: string | null, deadlineTime: string | null) => void;
  isClassifying?: boolean;
}

export function TaskInput({ onAdd, isClassifying }: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isClassifying) return;
    onAdd(title.trim(), deadlineDate || null, deadlineTime || null);
    setTitle("");
    setDeadlineDate("");
    setDeadlineTime("");
    setShowDeadline(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task... (AI will classify it ✨)"
          className="w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isClassifying}
        />
        </div>
        <Button type="button" variant={showDeadline ? "secondary" : "outline"} size="icon" className="rounded-xl h-[46px] w-[46px] shrink-0" onClick={() => setShowDeadline((value) => !value)} aria-label="Add deadline" title="Add deadline">
          <CalendarClock className="w-5 h-5" />
        </Button>
        <Button type="submit" size="icon" className="rounded-xl h-[46px] w-[46px] shrink-0" disabled={isClassifying || !title.trim()}>
          {isClassifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>
      {showDeadline && (
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card/60 p-3">
          <label className="space-y-1 text-xs text-muted-foreground">
            Due date (optional)
            <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="w-full rounded-lg border border-input bg-cream px-3 py-2 text-sm text-foreground" disabled={isClassifying} />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Due time (optional)
            <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full rounded-lg border border-input bg-cream px-3 py-2 text-sm text-foreground" disabled={isClassifying} />
          </label>
        </div>
      )}
    </form>
  );
}
