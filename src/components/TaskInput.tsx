import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskInputProps {
  onAdd: (title: string) => void;
  isClassifying?: boolean;
}

export function TaskInput({ onAdd, isClassifying }: TaskInputProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isClassifying) return;
    onAdd(title.trim());
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
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
      <Button type="submit" size="icon" className="rounded-xl h-[46px] w-[46px] shrink-0" disabled={isClassifying || !title.trim()}>
        {isClassifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
      </Button>
    </form>
  );
}
