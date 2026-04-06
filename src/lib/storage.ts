import { Task, UserState } from "./flowEngine";

const TASKS_KEY = "flowstate-tasks";
const STATE_KEY = "flowstate-state";

export function loadTasks(): Task[] {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadUserState(): UserState {
  try {
    const data = localStorage.getItem(STATE_KEY);
    return data ? JSON.parse(data) : { energyLevel: 3, mood: null, notes: "" };
  } catch {
    return { energyLevel: 3, mood: null, notes: "" };
  }
}

export function saveUserState(state: UserState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
