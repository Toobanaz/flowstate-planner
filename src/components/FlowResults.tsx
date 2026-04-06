import { FlowResult } from "@/lib/flowEngine";
import { TaskCard } from "./TaskCard";
import { CheckCircle2, Clock, Ban } from "lucide-react";

interface FlowResultsProps {
  result: FlowResult;
}

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

export function FlowResults({ result }: FlowResultsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-up">
        <h2 className="text-xl font-semibold text-foreground">Your Flow Plan ✨</h2>
        <p className="text-sm text-muted-foreground mt-1">Based on how you're feeling</p>
      </div>

      {sections.map(({ key, title, icon, description, color, delay }) => {
        const tasks = result[key];
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
              <p className="text-xs text-muted-foreground pl-7 italic">No tasks here</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
