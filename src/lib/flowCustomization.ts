import { FlowResult, PlannedTask, SchedulePreference } from "./flowEngine";

export type PlanZone = "do-now" | `later-${SchedulePreference}` | "tomorrow" | "set-aside";

const periods: SchedulePreference[] = ["morning", "afternoon", "evening"];

export function moveFlowTask(result: FlowResult, taskId: string, targetZone: PlanZone, targetIndex?: number): FlowResult {
  const zones = getZones(result);
  const source = Object.values(zones).flat().find((task) => task.id === taskId);
  if (!source) return result;

  for (const zone of Object.keys(zones) as PlanZone[]) {
    zones[zone] = zones[zone].filter((task) => task.id !== taskId);
  }

  const moved: PlannedTask = { ...source, reason: "You placed this task here.", isOverridden: true };
  const target = zones[targetZone];
  const index = Math.max(0, Math.min(targetIndex ?? target.length, target.length));
  target.splice(index, 0, moved);

  const doLater = periods.flatMap((period) => zones[`later-${period}` as PlanZone]);
  const timeline = {
    morning: [...zones["later-morning"]],
    afternoon: [...zones["later-afternoon"]],
    evening: [...zones["later-evening"]],
  };
  timeline[result.localTime.period] = [...zones["do-now"], ...timeline[result.localTime.period]];

  return { ...result, doNow: zones["do-now"], doLater, tomorrow: zones.tomorrow, avoid: zones["set-aside"], timeline };
}

export function removeFlowTask(result: FlowResult, taskId: string): FlowResult {
  return {
    ...result,
    doNow: result.doNow.filter((task) => task.id !== taskId),
    doLater: result.doLater.filter((task) => task.id !== taskId),
    tomorrow: result.tomorrow.filter((task) => task.id !== taskId),
    avoid: result.avoid.filter((task) => task.id !== taskId),
    timeline: {
      morning: result.timeline.morning.filter((task) => task.id !== taskId),
      afternoon: result.timeline.afternoon.filter((task) => task.id !== taskId),
      evening: result.timeline.evening.filter((task) => task.id !== taskId),
    },
  };
}

function getZones(result: FlowResult): Record<PlanZone, PlannedTask[]> {
  const laterIds = new Set(result.doLater.map((task) => task.id));
  return {
    "do-now": [...result.doNow],
    "later-morning": result.timeline.morning.filter((task) => laterIds.has(task.id)),
    "later-afternoon": result.timeline.afternoon.filter((task) => laterIds.has(task.id)),
    "later-evening": result.timeline.evening.filter((task) => laterIds.has(task.id)),
    tomorrow: [...result.tomorrow],
    "set-aside": [...result.avoid],
  };
}
