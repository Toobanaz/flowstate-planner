import { FlowResult, UserState } from "@/lib/flowEngine";
import { TaskCard } from "./TaskCard";
import { CheckCircle2, Clock, Ban, Sun, CloudSun, Moon, Sparkles, AlertTriangle } from "lucide-react";

interface FlowResultsProps {
  result: FlowResult;
  userState: UserState;
}

const emptyMessages: Record<string, { title: string; text: string }> = {
  doNow: {
    title: "Take it easy",
    text: "You're low on energy. Start small - try adding a 5-minute task 🌱",
  },
  doLater: {
    title: "All clear",
    text: "Nothing to postpone - you're on top of things! ✨",
  },
  avoid: {
    title: "Looking good",
    text: "No tasks to avoid right now 🎉",
  },
};

const sections = [
  {
    key: "doNow" as const,
    title: "Do Now",
    icon: <CheckCircle2 className="w-5 h-5" />,
    description: "These match your current energy",
    color: "text-primary",
    delay: "animate-fade-up-delay-1",
  },
  {
    key: "doLater" as const,
    title: "Do Later",
    icon: <Clock className="w-5 h-5" />,
    description: "Save these for when you recharge",
    color: "text-amber-600",
    delay: "animate-fade-up-delay-2",
  },
  {
    key: "avoid" as const,
    title: "Avoid for Now",
    icon: <Ban className="w-5 h-5" />,
    description: "Not a good fit right now",
    color: "text-muted-foreground",
    delay: "animate-fade-up-delay-3",
  },
];

const timelineIcons = {
  morning: <Sun className="w-4 h-4" />,
  afternoon: <CloudSun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
};

const timelineLabels = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function FlowResults({ result }: FlowResultsProps) {
  const hasTimeline =
    result.timeline.morning.length > 0 ||
    result.timeline.afternoon.length > 0 ||
    result.timeline.evening.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-up">
        <h2 className="text-xl font-semibold text-foreground">Your Flow Plan ✨</h2>
        <p className="text-sm text-muted-foreground mt-1">{result.localTime.localTime} · Your local time · {result.localTime.period}</p>
      </div>

      {result.aiSuggestion && (
        <div className="flow-card space-y-3 animate-fade-up-delay-1 border border-primary/10 bg-accent/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">AI Micro-Suggestion</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-primary">💡 Try this first...</p>
              <p className="text-sm text-muted-foreground mt-1">{result.aiSuggestion.try_first}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Avoid this for now...
              </p>
              <p className="text-sm text-muted-foreground mt-1">{result.aiSuggestion.avoid_now}</p>
            </div>
          </div>
        </div>
      )}

      {hasTimeline && (
        <div className="flow-card space-y-4 animate-fade-up-delay-1">
          <h3 className="text-sm font-semibold text-foreground">Remaining Today</h3>
          {(["morning", "afternoon", "evening"] as const).map((slot) => {
            const tasks = result.timeline[slot];
            if (tasks.length === 0) return null;
            return (
              <div key={slot} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">{timelineIcons[slot]}</span>
                  <span className="font-medium">{timelineLabels[slot]}</span>
                </div>
                <div className="space-y-1 pl-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="text-sm text-foreground py-1 whitespace-pre-wrap [overflow-wrap:anywhere]">
                      • {task.title}
                      {task.tag && <span className="text-xs text-muted-foreground ml-2">({task.tag})</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result.tomorrow.length > 0 && (
        <section className="space-y-3 animate-fade-up-delay-1">
          <div className="flex items-start gap-2">
            <Sun className="w-5 h-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tomorrow — Fresh Start</h3>
              <p className="text-xs text-muted-foreground">
                {result.localTime.hour < 6 ? "It's late. Rest first, then revisit these after sleep." : "Save demanding tasks for tomorrow morning, when you've had time to recharge."}
              </p>
            </div>
          </div>
          <div className="space-y-2 pl-7">
            {result.tomorrow.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </section>
      )}

      {sections.map(({ key, title, icon, description, color, delay }) => {
        const tasks = result[key];
        const empty = emptyMessages[key];
        return (
          <div key={key} className={`space-y-3 ${delay}`}>
            <div className="flex items-center gap-2">
              <span className={color}>{icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-2 pl-7">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="pl-7 py-3 rounded-xl bg-muted/50">
                <p className="text-sm font-medium text-foreground">{key === "doNow" && result.tomorrow.length ? "Time to recharge" : empty.title}</p>
                <p className="text-xs text-muted-foreground">{key === "doNow" && result.tomorrow.length ? "Your demanding tasks can wait until after you've rested." : empty.text}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
