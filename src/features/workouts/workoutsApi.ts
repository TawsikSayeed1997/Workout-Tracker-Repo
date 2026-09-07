import { blocksClient } from "../../lib/blocks/client";
import type { MeasurementMode } from "./workoutCatalog";

export type PersistableSet = {
  reps: string;
  weight: string;
  minutes: string;
  completed: boolean;
};

export type PersistableEntry = {
  id: string;
  name: string;
  mode: MeasurementMode;
  sets: PersistableSet[];
};

export type WorkoutToSave = {
  title: string;
  date: string;
  notes: string;
  totalMinutes: number;
  entries: PersistableEntry[];
};

type BlocksMutationResponse = Record<string, unknown>;

const sessions = blocksClient.data.collection("WorkoutSession");
const entries = blocksClient.data.collection("WorkoutEntry");
const sets = blocksClient.data.collection("WorkoutSet");

export async function saveWorkout(workout: WorkoutToSave) {
  const sessionResponse = await sessions.create({
    title: workout.title.trim() || "Workout session",
    workoutDate: new Date(`${workout.date}T12:00:00.000Z`).toISOString(),
    notes: workout.notes.trim(),
    durationMinutes: workout.totalMinutes,
    status: "completed"
  }) as BlocksMutationResponse;
  const sessionId = mutationItemId(sessionResponse);
  if (!sessionId) throw new Error("Blocks created the session without returning an item id.");

  for (const [position, entry] of workout.entries.entries()) {
    const entryResponse = await entries.create({
      sessionId,
      exerciseId: entry.id,
      exerciseName: entry.name,
      measurementMode: entry.mode,
      position
    }) as BlocksMutationResponse;
    const entryId = mutationItemId(entryResponse);
    if (!entryId) throw new Error(`Blocks created ${entry.name} without returning an item id.`);

    for (const [setIndex, set] of entry.sets.entries()) {
      const payload: Record<string, string | number | boolean> = {
        entryId,
        setNumber: setIndex + 1,
        completed: set.completed
      };
      if (entry.mode !== "timed" && set.reps) payload.reps = Number(set.reps);
      if (entry.mode === "weighted" && set.weight) {
        payload.weight = Number(set.weight);
        payload.weightUnit = "kg";
      }
      if (entry.mode === "timed" && set.minutes) payload.minutes = Number(set.minutes);
      await sets.create(payload);
    }
  }

  return sessionId;
}

function mutationItemId(response: BlocksMutationResponse): string | undefined {
  const visited = new Set<object>();

  function find(value: unknown): string | undefined {
    if (!value || typeof value !== "object") return undefined;
    const object = value as Record<string, unknown>;
    if (visited.has(object)) return undefined;
    visited.add(object);

    for (const key of ["itemId", "ItemId"]) {
      const candidate = object[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }

    for (const nested of Object.values(object)) {
      const itemId = find(nested);
      if (itemId) return itemId;
    }
    return undefined;
  }

  return find(response);
}
