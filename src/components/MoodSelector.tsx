import { Mood } from "@/lib/flowEngine";

const moods: { label: Mood; emoji: string }[] = [
  { label: "Focused", emoji: "🎯" },
  { label: "Overwhelmed", emoji: "😵‍💫" },
  { label: "Calm", emoji: "🧘" },
  { label: "Anxious", emoji: "😰" },
  { label: "Motivated", emoji: "🔥" },
];

interface MoodSelectorProps {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-muted-foreground">How's your mood?</label>
      <div className="flex flex-wrap gap-2">
        {moods.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={`mood-pill ${value === label ? "active" : ""}`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
