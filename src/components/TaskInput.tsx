import { useState } from "react";
import { TaskTag, generateId, Task } from "@/lib/flowEngine";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const tags: TaskTag[] = ["Deep Work", "Creative", "Admin", "Social", "Errands"];

interface TaskInputProps {
  onAdd: (task: Task) => void;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<TaskTag>("Admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: generateId(),
      title: title.trim(),
      tag,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <select
        value={tag}
        onChange={(e) => setTag(e.target.value as TaskTag)}
        className="rounded-xl border border-input bg-cream px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {tags.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <Button type="submit" size="icon" className="rounded-xl h-[46px] w-[46px] shrink-0">
        <Plus className="w-5 h-5" />
      </Button>
    </form>
  );
}
