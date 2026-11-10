import { DragEvent, ReactNode, useState } from "react";
import { FlowResult, PlannedTask, SchedulePreference, UserState } from "@/lib/flowEngine";
import { PlanZone, moveFlowTask } from "@/lib/flowCustomization";
import { TaskCard } from "./TaskCard";
import { ArrowDown, ArrowUp, Ban, CheckCircle2, CloudSun, GripVertical, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FlowResultsProps {
  result: FlowResult;
  userState: UserState;
  onChange: (result: FlowResult) => void;
  onRemove?: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => void;
  onToggleTimer?: (id: string) => void;
}

const periodLabels = { morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const periodIcons = {
  morning: <Sun className="w-4 h-4" />,
  afternoon: <CloudSun className="w-4 h-4" />,
  evening: <Moon className="w-4 h-4" />,
};
const zoneLabels: Record<PlanZone, string> = {
  "do-now": "Do Now",
  "later-morning": "Later · Morning",
  "later-afternoon": "Later · Afternoon",
  "later-evening": "Later · Evening",
  tomorrow: "Tomorrow",
  "set-aside": "Set Aside",
};
const allZones = Object.keys(zoneLabels) as PlanZone[];

export function FlowResults({ result, onChange, onRemove, onToggleComplete, onToggleTimer }: FlowResultsProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const laterPeriods = (["morning", "afternoon", "evening"] as SchedulePreference[]).map((period) => ({
    period,
    tasks: result.timeline[period].filter((task) => result.doLater.some((later) => later.id === task.id)),
  }));

  const move = (taskId: string, zone: PlanZone, index?: number) => {
    onChange(moveFlowTask(result, taskId, zone, index));
    setDraggedId(null);
  };

  const drop = (event: DragEvent, zone: PlanZone, index?: number) => {
    event.preventDefault();
    const taskId = draggedId || event.dataTransfer.getData("text/plain");
    if (taskId) move(taskId, zone, index);
  };

  const renderTasks = (tasks: PlannedTask[], zone: PlanZone) => (
    <div
      className={`min-h-12 space-y-2 rounded-xl transition-colors ${draggedId ? "border border-dashed border-primary/40 bg-accent/20 p-2" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => drop(event, zone)}
    >
      {tasks.length === 0 && draggedId && <p className="py-3 text-center text-xs text-muted-foreground">Drop here</p>}
      {tasks.map((task, index) => (
        <div
          key={task.id}
          draggable
          onDragStart={(event) => {
            setDraggedId(task.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", task.id);
          }}
          onDragEnd={() => setDraggedId(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.stopPropagation();
            drop(event, zone, index);
          }}
          className={`space-y-1 rounded-xl ${draggedId === task.id ? "opacity-40" : ""}`}
        >
          <div className="flex items-center gap-1 px-1 text-muted-foreground">
            <GripVertical className="h-4 w-4 cursor-grab" aria-hidden="true" />
            <span className="mr-auto text-[11px]">Drag to move</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === 0}
              onClick={() => move(task.id, zone, index - 1)}
              aria-label={`Move ${task.title} up`}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={index === tasks.length - 1}
              onClick={() => move(task.id, zone, index + 1)}
              aria-label={`Move ${task.title} down`}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <select
              value={zone}
              onChange={(event) => move(task.id, event.target.value as PlanZone)}
              onPointerDown={(event) => event.stopPropagation()}
              className="h-7 max-w-32 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
              aria-label={`Move ${task.title} to another section`}
            >
              {allZones.map((option) => <option key={option} value={option}>{zoneLabels[option]}</option>)}
            </select>
          </div>
          <TaskCard
            task={task}
            showSchedule={false}
            reason={task.reason}
            isOverridden={task.isOverridden}
            onRemove={onRemove}
            onToggleComplete={onToggleComplete}
            onToggleTimer={onToggleTimer}
            paceProfile={result.paceProfile ?? {}}
          />
        </div>
      ))}
    </div>
  );

  return (
    <section className="space-y-6 animate-fade-up" aria-label="Your flow plan">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Your Plan ✨</h2>
        <p className="text-sm text-muted-foreground mt-1">{result.localTime.localTime} · Your local time · {result.localTime.period}</p>
        <p className="mt-2 text-xs text-muted-foreground">Drag tasks between sections, or use the arrows and Move menu.</p>
      </div>

      <PlanSection
        title={`Do Now · ${periodLabels[result.localTime.period]}`}
        description={result.doNow.length ? "Matches your energy right now" : "Drop a task here when you want to do it next"}
        icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
        tone="now"
      >
        {renderTasks(result.doNow, "do-now")}
      </PlanSection>

      <Separator className="bg-border/80" />
      <section className="space-y-4" aria-label="Do Later">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Do Later</h3>
          <p className="text-xs text-muted-foreground">Move tasks into the part of the day that works for you</p>
        </div>
        {laterPeriods.map(({ period, tasks }) => (
          <PlanSection
            key={period}
            title={period === result.localTime.period ? `Later this ${period}` : `This ${period}`}
            description="Recheck your energy when this time arrives"
            icon={<span className="text-muted-foreground">{periodIcons[period]}</span>}
            tone={period}
          >
            {renderTasks(tasks, `later-${period}`)}
          </PlanSection>
        ))}
      </section>

      <Separator className="bg-border/80" />
      <PlanSection title="Tomorrow · After rest" description="A fresh start when you've had time to recharge" icon={<Sun className="w-5 h-5 text-primary" />} tone="tomorrow">
        {renderTasks(result.tomorrow, "tomorrow")}
      </PlanSection>

      <Separator className="bg-border/80" />
      <PlanSection title="Set Aside" description="Not scheduled today — revisit when your energy is higher" icon={<Ban className="w-5 h-5 text-muted-foreground" />} tone="aside">
        {renderTasks(result.avoid, "set-aside")}
      </PlanSection>
    </section>
  );
}

type SectionTone = "now" | SchedulePreference | "tomorrow" | "aside";

const toneStyles: Record<SectionTone, string> = {
  now: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20",
  morning: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
  afternoon: "border-sky-200/80 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/20",
  evening: "border-indigo-200/80 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/20",
  tomorrow: "border-violet-200/80 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/20",
  aside: "border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30",
};

function PlanSection({ title, description, icon, tone, children }: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: SectionTone;
  children: ReactNode;
}) {
  return (
    <section className={`space-y-3 rounded-2xl border p-4 ${toneStyles[tone]}`} aria-label={title}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
