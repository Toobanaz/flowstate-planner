import { Mood, MAX_MOODS } from "@/lib/flowEngine";

const moods: { label: Mood; emoji: string }[] = [
  { label: "Focused", emoji: "🎯" },
  { label: "Overwhelmed", emoji: "😵‍💫" },
  { label: "Calm", emoji: "🧘" },
  { label: "Anxious", emoji: "😰" },
  { label: "Motivated", emoji: "🔥" },
];

interface MoodSelectorProps {
  value: Mood[];
  onChange: (moods: Mood[]) => void;
}

/** Toggle a mood; picking a third drops the oldest selection. */
export function toggleMood(current: Mood[], mood: Mood): Mood[] {
  if (current.includes(mood)) return current.filter((m) => m !== mood);
  return [...current, mood].slice(-MAX_MOODS);
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-muted-foreground">How's your mood?</label>
        <span className="text-xs text-muted-foreground">Pick up to 2</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {moods.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => onChange(toggleMood(value, label))}
            aria-pressed={value.includes(label)}
            className={`mood-pill ${value.includes(label) ? "active" : ""}`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
