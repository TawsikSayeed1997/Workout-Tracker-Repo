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

export type SavedWorkout = {
  id: string;
  title: string;
  workoutDate: string;
  notes: string;
  durationMinutes: number;
  status: string;
};

export type WorkoutHistoryItem = SavedWorkout & {
  exerciseCount: number;
  setCount: number;
  completedSetCount: number;
  volume: number;
  timedMinutes: number;
};

export type WorkoutAnalytics = {
  workouts: WorkoutHistoryItem[];
  totalVolume: number;
  totalMinutes: number;
  totalSets: number;
  completedSets: number;
};

type BlocksMutationResponse = Record<string, unknown>;

const sessions = blocksClient.data.collection("WorkoutSession");
const entries = blocksClient.data.collection("WorkoutEntry");
const sets = blocksClient.data.collection("WorkoutSet");

const sessionFields = ["title", "workoutDate", "notes", "durationMinutes", "status"];
const entryFields = ["sessionId", "exerciseId", "exerciseName", "measurementMode", "position"];
const setFields = ["entryId", "setNumber", "reps", "weight", "weightUnit", "minutes", "completed"];

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

export async function listWorkouts(): Promise<SavedWorkout[]> {
  const records = await listRecords(sessions, sessionFields, 200);
  return records
    .map(toSavedWorkout)
    .filter((workout): workout is SavedWorkout => Boolean(workout))
    .sort((a, b) => dateValue(b.workoutDate) - dateValue(a.workoutDate));
}

export async function getWorkoutAnalytics(): Promise<WorkoutAnalytics> {
  const [sessionRecords, entryRecords, setRecords] = await Promise.all([
    listRecords(sessions, sessionFields, 200),
    listRecords(entries, entryFields, 500),
    listRecords(sets, setFields, 1000)
  ]);

  const sessionsById = new Map<string, WorkoutHistoryItem>();
  for (const record of sessionRecords) {
    const workout = toSavedWorkout(record);
    if (workout) {
      sessionsById.set(workout.id, { ...workout, exerciseCount: 0, setCount: 0, completedSetCount: 0, volume: 0, timedMinutes: 0 });
    }
  }

  const entriesById = new Map<string, { sessionId: string; mode: string }>();
  for (const record of entryRecords) {
    const entryId = text(record, "itemId", "ItemId");
    const sessionId = text(record, "sessionId", "SessionId");
    if (!entryId || !sessionId) continue;
    entriesById.set(entryId, { sessionId, mode: text(record, "measurementMode", "MeasurementMode") });
    const workout = sessionsById.get(sessionId);
    if (workout) workout.exerciseCount += 1;
  }

  for (const record of setRecords) {
    const entry = entriesById.get(text(record, "entryId", "EntryId"));
    if (!entry) continue;
    const workout = sessionsById.get(entry.sessionId);
    if (!workout) continue;
    workout.setCount += 1;
    if (booleanValue(record, "completed", "Completed")) workout.completedSetCount += 1;
    const reps = numberValue(record, "reps", "Reps");
    const weight = numberValue(record, "weight", "Weight");
    const minutes = numberValue(record, "minutes", "Minutes");
    if (entry.mode === "weighted") workout.volume += reps * weight;
    if (entry.mode === "timed") workout.timedMinutes += minutes;
  }

  const workouts = Array.from(sessionsById.values()).sort((a, b) => dateValue(b.workoutDate) - dateValue(a.workoutDate));
  return {
    workouts,
    totalVolume: workouts.reduce((total, workout) => total + workout.volume, 0),
    totalMinutes: workouts.reduce((total, workout) => total + workout.durationMinutes, 0),
    totalSets: workouts.reduce((total, workout) => total + workout.setCount, 0),
    completedSets: workouts.reduce((total, workout) => total + workout.completedSetCount, 0)
  };
}

async function listRecords(collection: { list: (options?: { fields?: string[]; pageNo?: number; pageSize?: number }) => Promise<unknown> }, fields: string[], pageSize: number): Promise<Record<string, unknown>[]> {
  const response = await collection.list({ fields, pageNo: 1, pageSize });
  return collectionItems(response);
}

function collectionItems(response: unknown): Record<string, unknown>[] {
  const visited = new Set<object>();
  function find(value: unknown): Record<string, unknown>[] | undefined {
    if (!value || typeof value !== "object") return undefined;
    const object = value as Record<string, unknown>;
    if (visited.has(object)) return undefined;
    visited.add(object);
    if (Array.isArray(object.items) && object.items.every((item) => item && typeof item === "object")) {
      return object.items as Record<string, unknown>[];
    }
    for (const nested of Object.values(object)) {
      const items = find(nested);
      if (items) return items;
    }
    return undefined;
  }
  return find(response) ?? [];
}

function toSavedWorkout(record: Record<string, unknown>): SavedWorkout | undefined {
  const id = text(record, "itemId", "ItemId");
  if (!id) return undefined;
  return {
    id,
    title: text(record, "title", "Title") || "Untitled workout",
    workoutDate: text(record, "workoutDate", "WorkoutDate"),
    notes: text(record, "notes", "Notes"),
    durationMinutes: numberValue(record, "durationMinutes", "DurationMinutes"),
    status: text(record, "status", "Status") || "completed"
  };
}

function text(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberValue(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    const parsed = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function booleanValue(record: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
  }
  return false;
}

function dateValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
