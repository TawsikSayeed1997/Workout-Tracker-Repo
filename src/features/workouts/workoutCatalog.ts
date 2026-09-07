export type MeasurementMode = "weighted" | "bodyweight" | "timed";

export type Exercise = {
  id: string;
  name: string;
  category: "Strength" | "Bodyweight" | "Cardio" | "Sports" | "Mobility";
  mode: MeasurementMode;
  detail: string;
  popular?: boolean;
};

export const workoutCatalog: Exercise[] = [
  { id: "bench-press", name: "Bench press", category: "Strength", mode: "weighted", detail: "Chest · barbell", popular: true },
  { id: "back-squat", name: "Back squat", category: "Strength", mode: "weighted", detail: "Legs · barbell", popular: true },
  { id: "deadlift", name: "Deadlift", category: "Strength", mode: "weighted", detail: "Back · barbell", popular: true },
  { id: "overhead-press", name: "Overhead press", category: "Strength", mode: "weighted", detail: "Shoulders · barbell" },
  { id: "barbell-row", name: "Barbell row", category: "Strength", mode: "weighted", detail: "Back · barbell" },
  { id: "lat-pulldown", name: "Lat pulldown", category: "Strength", mode: "weighted", detail: "Back · cable" },
  { id: "pull-up", name: "Pull-up", category: "Bodyweight", mode: "bodyweight", detail: "Back · bodyweight", popular: true },
  { id: "push-up", name: "Push-up", category: "Bodyweight", mode: "bodyweight", detail: "Chest · bodyweight", popular: true },
  { id: "walking-lunge", name: "Walking lunge", category: "Bodyweight", mode: "bodyweight", detail: "Legs · bodyweight" },
  { id: "burpee", name: "Burpee", category: "Bodyweight", mode: "bodyweight", detail: "Full body · bodyweight" },
  { id: "plank", name: "Plank", category: "Bodyweight", mode: "bodyweight", detail: "Core · reps or holds" },
  { id: "running", name: "Running", category: "Cardio", mode: "timed", detail: "Road · minutes", popular: true },
  { id: "cycling", name: "Cycling", category: "Cardio", mode: "timed", detail: "Cardio · minutes", popular: true },
  { id: "rowing", name: "Rowing", category: "Cardio", mode: "timed", detail: "Cardio · minutes" },
  { id: "swimming", name: "Swimming", category: "Cardio", mode: "timed", detail: "Pool · minutes" },
  { id: "basketball", name: "Basketball", category: "Sports", mode: "timed", detail: "Sport · minutes", popular: true },
  { id: "football", name: "Football / soccer", category: "Sports", mode: "timed", detail: "Sport · minutes", popular: true },
  { id: "tennis", name: "Tennis", category: "Sports", mode: "timed", detail: "Sport · minutes" },
  { id: "boxing", name: "Boxing", category: "Sports", mode: "timed", detail: "Sport · minutes" },
  { id: "hiking", name: "Hiking", category: "Sports", mode: "timed", detail: "Outdoor · minutes" },
  { id: "yoga", name: "Yoga flow", category: "Mobility", mode: "timed", detail: "Mobility · minutes" },
  { id: "stretching", name: "Stretching", category: "Mobility", mode: "timed", detail: "Mobility · minutes" }
];

export const categoryOptions = ["All", "Strength", "Bodyweight", "Cardio", "Sports", "Mobility"] as const;

export function modeLabel(mode: MeasurementMode): string {
  if (mode === "weighted") return "Reps + weight";
  if (mode === "timed") return "Minutes";
  return "Sets + reps";
}
