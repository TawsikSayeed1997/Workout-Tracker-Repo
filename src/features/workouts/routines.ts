import { workoutCatalog } from "./workoutCatalog";

export type Routine = {
  id: string;
  name: string;
  focus: string;
  description: string;
  exerciseIds: string[];
};

const ROUTINES_KEY = "workout-tracker:routines";

const starterRoutines: Routine[] = [
  { id: "push-strength", name: "Push strength", focus: "Chest · shoulders · triceps", description: "A focused upper-body session for pressing strength.", exerciseIds: ["bench-press", "overhead-press", "push-down", "lateral-raise"] },
  { id: "lower-body", name: "Lower body", focus: "Quads · glutes · hamstrings", description: "Build a strong base with simple, repeatable leg work.", exerciseIds: ["back-squat", "walking-lunge", "leg-curl", "standing-calf-raise"] },
  { id: "pull-and-back", name: "Pull & back", focus: "Back · biceps · forearms", description: "A balanced pull day with vertical and horizontal work.", exerciseIds: ["pull-up", "lat-pulldown", "barbell-row", "hammer-curl"] }
];

export function readRoutines(): Routine[] {
  try {
    const stored = localStorage.getItem(ROUTINES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Routine[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Starter routines are a safe fallback if storage is unavailable or corrupt.
  }
  return starterRoutines;
}

export function writeRoutines(routines: Routine[]) {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export function startRoutine(routine: Routine) {
  localStorage.setItem("workout-tracker:prefill", JSON.stringify({ title: routine.name, exerciseIds: routine.exerciseIds }));
}

export function routineExerciseNames(routine: Routine) {
  return routine.exerciseIds.map((id) => workoutCatalog.find((exercise) => exercise.id === id)?.name ?? id);
}
