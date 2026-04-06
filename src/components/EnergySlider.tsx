import { Slider } from "@/components/ui/slider";

const labels = ["", "Exhausted", "Low", "Neutral", "Good", "Energized"];
const emojis = ["", "😴", "😐", "🙂", "😊", "⚡"];

interface EnergySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function EnergySlider({ value, onChange }: EnergySliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">Energy Level</label>
        <span className="text-lg">
          {emojis[value]} <span className="text-sm font-medium text-foreground">{labels[value]}</span>
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={5}
        step={1}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Exhausted</span>
        <span>Energized</span>
      </div>
    </div>
  );
}
