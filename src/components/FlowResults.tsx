import { FlowResult, UserState, SchedulePreference } from "@/lib/flowEngine";
import { TaskCard } from "./TaskCard";
import { CheckCircle2, Ban, Sun, CloudSun, Moon } from "lucide-react";

interface FlowResultsProps {
  result: FlowResult;
  userState: UserState;
  onRemove?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
}

const periodLabels = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const periodIcons = {
  morning: <Sun className="w-4 h-4" />,
  afternoon: <CloudSun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
};

export function FlowResults({ result, onRemove, onToggleComplete }: FlowResultsProps) {
  const renderTasks = (tasks: FlowResult["doNow"]) => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} showSchedule={false} onRemove={onRemove} onToggleComplete={onToggleComplete} />
      ))}
    </div>
  );
  const firstTask = result.doNow[0];

  return (
    <section className="space-y-6 animate-fade-up" aria-label="Your flow plan">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Your Flow Plan ✨</h2>
        <p className="text-sm text-muted-foreground mt-1">{result.localTime.localTime} · Your local time · {result.localTime.period}</p>
      </div>

      <section className="space-y-3" aria-label="Do Now">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Do Now · {periodLabels[result.localTime.period]}</h3>
            <p className="text-xs text-muted-foreground">{firstTask ? "Matches your energy right now" : "Time to recharge"}</p>
          </div>
        </div>
        {result.doNow.length ? renderTasks(result.doNow) : (
          <p className="text-sm text-muted-foreground pl-7">{result.tomorrow.length ? "Rest first. Your tasks can wait until after you've recharged." : "Nothing needs your attention right now. Take a breather."}</p>
        )}
      </section>

      {(["morning", "afternoon", "evening"] as SchedulePreference[]).map((period) => {
        const tasks = result.timeline[period].filter((task) => result.doLater.some((later) => later.id === task.id));
        if (!tasks.length) return null;
        return (
          <section key={period} className="space-y-3" aria-label={`Later ${period}`}>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="shrink-0 mt-0.5">{periodIcons[period]}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{period === result.localTime.period ? `Later this ${period}` : `This ${period}`}</h3>
                <p className="text-xs">{period === result.localTime.period ? "After your current tasks, if you still have energy" : "Recheck your energy when this time arrives"}</p>
              </div>
            </div>
            {renderTasks(tasks)}
          </section>
        );
      })}

      {result.tomorrow.length > 0 && (
        <section className="space-y-3" aria-label="Tomorrow">
          <div className="flex items-start gap-2">
            <Sun className="w-5 h-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tomorrow · After rest</h3>
              <p className="text-xs text-muted-foreground">A fresh start when you've had time to recharge</p>
            </div>
          </div>
          {renderTasks(result.tomorrow)}
        </section>
      )}

      {result.avoid.length > 0 && (
        <section className="space-y-3" aria-label="Set Aside">
          <div className="flex items-start gap-2">
            <Ban className="w-5 h-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Set Aside</h3>
              <p className="text-xs text-muted-foreground">Not scheduled today — revisit when your energy is higher</p>
            </div>
          </div>
          {renderTasks(result.avoid)}
        </section>
      )}
    </section>
  );
}
