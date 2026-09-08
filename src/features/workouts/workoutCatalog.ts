export type MeasurementMode = "weighted" | "bodyweight" | "timed";

export type MuscleKey =
  | "calves"
  | "quadriceps"
  | "hamstrings"
  | "gluteus"
  | "hips"
  | "lowerBack"
  | "lats"
  | "trapezius"
  | "abdominals"
  | "pectorals"
  | "deltoids"
  | "triceps"
  | "biceps"
  | "forearms";

export type MuscleIntensity = "primary" | "secondary";
export type MuscleTargets = Partial<Record<MuscleKey, MuscleIntensity>>;

export type Exercise = {
  id: string;
  name: string;
  category: "Strength" | "Bodyweight" | "Cardio" | "Sports" | "Mobility";
  mode: MeasurementMode;
  detail: string;
  muscles: MuscleTargets;
  popular?: boolean;
};

const p = "primary" as const;
const s = "secondary" as const;

export const muscleLabels: Record<MuscleKey, string> = {
  calves: "Calves",
  quadriceps: "Quadriceps",
  hamstrings: "Hamstrings",
  gluteus: "Gluteus",
  hips: "Hips",
  lowerBack: "Lower back",
  lats: "Lats",
  trapezius: "Trapezius",
  abdominals: "Abdominals",
  pectorals: "Pectorals",
  deltoids: "Deltoids",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms"
};

export const workoutCatalog: Exercise[] = [
  { id: "upright-row", name: "Upright row", category: "Strength", mode: "weighted", detail: "Shoulders · barbell", muscles: { trapezius: p, deltoids: p, biceps: s } },
  { id: "standing-calf-raise", name: "Standing calf raise", category: "Strength", mode: "weighted", detail: "Calves · machine or free weight", muscles: { calves: p } },
  { id: "shoulder-shrug", name: "Shoulder shrug", category: "Strength", mode: "weighted", detail: "Trapezius · dumbbells", muscles: { trapezius: p, forearms: s } },
  { id: "overhead-press", name: "Shoulder press", category: "Strength", mode: "weighted", detail: "Shoulders · barbell", muscles: { deltoids: p, triceps: p, trapezius: s }, popular: true },
  { id: "seated-calf-raise", name: "Seated calf raise", category: "Strength", mode: "weighted", detail: "Calves · machine", muscles: { calves: p } },
  { id: "russian-twist", name: "Russian twist", category: "Bodyweight", mode: "bodyweight", detail: "Core · bodyweight", muscles: { abdominals: p } },
  { id: "push-up", name: "Push-up", category: "Bodyweight", mode: "bodyweight", detail: "Chest · bodyweight", muscles: { pectorals: p, triceps: p, deltoids: s }, popular: true },
  { id: "push-down", name: "Push-down", category: "Strength", mode: "weighted", detail: "Triceps · cable", muscles: { triceps: p } },
  { id: "pull-up", name: "Pull-up", category: "Bodyweight", mode: "bodyweight", detail: "Back · bodyweight", muscles: { lats: p, trapezius: s, biceps: s, forearms: s }, popular: true },
  { id: "lat-pulldown", name: "Pull-down", category: "Strength", mode: "weighted", detail: "Back · cable", muscles: { lats: p, trapezius: s } },
  { id: "overhead-triceps-extension", name: "Overhead triceps extension", category: "Strength", mode: "weighted", detail: "Triceps · dumbbell", muscles: { deltoids: s, triceps: p, forearms: s } },
  { id: "lying-triceps-extension", name: "Lying triceps extension", category: "Strength", mode: "weighted", detail: "Triceps · barbell", muscles: { triceps: p, forearms: s } },
  { id: "walking-lunge", name: "Lunge", category: "Bodyweight", mode: "bodyweight", detail: "Legs · bodyweight", muscles: { quadriceps: p, hamstrings: p, gluteus: p, hips: p } },
  { id: "leg-raise", name: "Leg raise", category: "Bodyweight", mode: "bodyweight", detail: "Core · bodyweight", muscles: { hips: p, abdominals: s } },
  { id: "leg-press", name: "Leg press", category: "Strength", mode: "weighted", detail: "Legs · machine", muscles: { quadriceps: p, gluteus: p, calves: s, hamstrings: s } },
  { id: "leg-extension", name: "Leg extension", category: "Strength", mode: "weighted", detail: "Quadriceps · machine", muscles: { quadriceps: p } },
  { id: "leg-curl", name: "Leg curl", category: "Strength", mode: "weighted", detail: "Hamstrings · machine", muscles: { hamstrings: p, calves: s } },
  { id: "lateral-raise", name: "Lateral raise", category: "Strength", mode: "weighted", detail: "Deltoids · dumbbells", muscles: { deltoids: p, trapezius: s } },
  { id: "hammer-curl", name: "Hammer curl", category: "Strength", mode: "weighted", detail: "Arms · dumbbells", muscles: { biceps: p, forearms: p } },
  { id: "dip", name: "Dip", category: "Bodyweight", mode: "bodyweight", detail: "Chest · bodyweight", muscles: { pectorals: p, deltoids: p, triceps: p, forearms: s } },
  { id: "deadlift", name: "Deadlift", category: "Strength", mode: "weighted", detail: "Posterior chain · barbell", muscles: { quadriceps: p, hamstrings: p, gluteus: p, hips: p, lowerBack: p, calves: s, trapezius: s, abdominals: s, forearms: s }, popular: true },
  { id: "crunch", name: "Crunch", category: "Bodyweight", mode: "bodyweight", detail: "Abdominals · bodyweight", muscles: { abdominals: p } },
  { id: "chest-fly", name: "Chest fly", category: "Strength", mode: "weighted", detail: "Chest · dumbbells or cable", muscles: { pectorals: p, deltoids: s } },
  { id: "bulgarian-split-squat", name: "Bulgarian split squat", category: "Bodyweight", mode: "bodyweight", detail: "Legs · bodyweight", muscles: { quadriceps: p, gluteus: p, hips: p, hamstrings: s, calves: s, lowerBack: s, abdominals: p } },
  { id: "bodyweight-squat", name: "Bodyweight squat", category: "Bodyweight", mode: "bodyweight", detail: "Legs · bodyweight", muscles: { quadriceps: p, gluteus: p, hips: p, hamstrings: s, calves: s, lowerBack: s, abdominals: p } },
  { id: "biceps-curl", name: "Biceps curl", category: "Strength", mode: "weighted", detail: "Biceps · dumbbells", muscles: { biceps: p, forearms: s } },
  { id: "bench-press", name: "Bench press", category: "Strength", mode: "weighted", detail: "Chest · barbell", muscles: { pectorals: p, deltoids: s, triceps: p }, popular: true },
  { id: "barbell-row", name: "Bent-over row", category: "Strength", mode: "weighted", detail: "Back · barbell", muscles: { lats: p, trapezius: p, biceps: s } },
  { id: "back-extension", name: "Back extension", category: "Strength", mode: "weighted", detail: "Posterior chain · bench", muscles: { hamstrings: p, gluteus: p, lowerBack: p, calves: s } },
  { id: "back-squat", name: "Back squat", category: "Strength", mode: "weighted", detail: "Legs · barbell", muscles: { quadriceps: p, gluteus: p, hamstrings: s, calves: s, lowerBack: s, abdominals: s }, popular: true },
  { id: "burpee", name: "Burpee", category: "Bodyweight", mode: "bodyweight", detail: "Full body · bodyweight", muscles: { quadriceps: p, pectorals: s, deltoids: s, triceps: s, abdominals: s } },
  { id: "plank", name: "Plank", category: "Bodyweight", mode: "bodyweight", detail: "Core · bodyweight", muscles: { abdominals: p, hips: s, deltoids: s } },
  { id: "running", name: "Running", category: "Cardio", mode: "timed", detail: "Road · minutes", muscles: { calves: p, quadriceps: s, hamstrings: s, gluteus: s }, popular: true },
  { id: "cycling", name: "Cycling", category: "Cardio", mode: "timed", detail: "Cardio · minutes", muscles: { quadriceps: p, hamstrings: s, calves: s }, popular: true },
  { id: "rowing", name: "Rowing", category: "Cardio", mode: "timed", detail: "Cardio · minutes", muscles: { lats: p, quadriceps: s, hamstrings: s, biceps: s } },
  { id: "swimming", name: "Swimming", category: "Cardio", mode: "timed", detail: "Pool · minutes", muscles: { lats: p, deltoids: s, pectorals: s, abdominals: s } },
  { id: "basketball", name: "Basketball", category: "Sports", mode: "timed", detail: "Sport · minutes", muscles: { calves: p, quadriceps: s, gluteus: s }, popular: true },
  { id: "football", name: "Football / soccer", category: "Sports", mode: "timed", detail: "Sport · minutes", muscles: { calves: p, quadriceps: s, hamstrings: s, gluteus: s }, popular: true },
  { id: "tennis", name: "Tennis", category: "Sports", mode: "timed", detail: "Sport · minutes", muscles: { calves: s, quadriceps: s, deltoids: s, forearms: p } },
  { id: "boxing", name: "Boxing", category: "Sports", mode: "timed", detail: "Sport · minutes", muscles: { deltoids: p, pectorals: s, abdominals: s, calves: s }, popular: true },
  { id: "hiking", name: "Hiking", category: "Sports", mode: "timed", detail: "Outdoor · minutes", muscles: { calves: p, quadriceps: s, hamstrings: s, gluteus: s } },
  { id: "yoga", name: "Yoga flow", category: "Mobility", mode: "timed", detail: "Mobility · minutes", muscles: { hips: p, abdominals: s, hamstrings: s } },
  { id: "stretching", name: "Stretching", category: "Mobility", mode: "timed", detail: "Mobility · minutes", muscles: { hips: p, hamstrings: s, calves: s } }
];

export const categoryOptions = ["All", "Strength", "Bodyweight", "Cardio", "Sports", "Mobility"] as const;

export function modeLabel(mode: MeasurementMode): string {
  if (mode === "weighted") return "Reps + weight";
  if (mode === "timed") return "Minutes";
  return "Sets + reps";
}
