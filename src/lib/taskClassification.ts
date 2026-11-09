import type { EffortLevel, TaskTag } from "./flowEngine";

export interface ClassificationShape {
  category: TaskTag;
  energy_required: number;
  effort_level: EffortLevel;
}

/** Corrects obvious everyday task types that should not depend on model interpretation. */
export function getObviousTaskClassification(title: string): ClassificationShape | null {
  const text = title.trim().toLowerCase();
  if (/\b(?:send|write)?\s*(?:a\s+)?thank(?:[\s\p{Pd}-]*)you\s+(?:note|message|email|card)\b/iu.test(text)) {
    return { category: "Social", energy_required: 2, effort_level: "Low" };
  }
  return null;
}
