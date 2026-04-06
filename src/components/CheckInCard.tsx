import { UserState, Mood } from "@/lib/flowEngine";
import { EnergySlider } from "./EnergySlider";
import { MoodSelector } from "./MoodSelector";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

interface CheckInCardProps {
  state: UserState;
  onStateChange: (state: UserState) => void;
  onPlanFlow: () => void;
  hasTasks: boolean;
}

export function CheckInCard({ state, onStateChange, onPlanFlow, hasTasks }: CheckInCardProps) {
  return (
    <div className="flow-card space-y-6 animate-fade-up">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Daily Check-in</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">How are you feeling right now?</h2>
      </div>

      <EnergySlider
        value={state.energyLevel}
        onChange={(value) => onStateChange({ ...state, energyLevel: value })}
      />

      <MoodSelector
        value={state.mood}
        onChange={(mood: Mood) => onStateChange({ ...state, mood })}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Anything on your mind?</label>
        <textarea
          value={state.notes}
          onChange={(e) => onStateChange({ ...state, notes: e.target.value })}
          placeholder="Optional - jot down a thought..."
          className="w-full rounded-xl border border-input bg-cream px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
        />
      </div>

      <Button
        variant="flow"
        size="lg"
        className="w-full"
        onClick={onPlanFlow}
        disabled={!state.mood || !hasTasks}
      >
        <Leaf className="w-4 h-4" />
        Plan My Flow
      </Button>
      {!hasTasks && (
        <p className="text-center text-xs text-muted-foreground">Add some tasks below first 🌱</p>
      )}
    </div>
  );
}
