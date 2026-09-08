import {
  Activity,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flame,
  ListPlus,
  Minus,
  Plus,
  Search,
  Target,
  Timer,
  Trash2,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { modeLabel, type Exercise, type MeasurementMode, workoutCatalog, categoryOptions } from "./workoutCatalog";
import { MuscleMap } from "./MuscleMap";
import { saveWorkout } from "./workoutsApi";
import { useT } from "../../lib/i18n/LocalizationProvider";

type WorkoutSet = {
  id: string;
  reps: string;
  weight: string;
  minutes: string;
  completed: boolean;
};

type WorkoutEntry = Exercise & { sets: WorkoutSet[] };

type SessionDraft = {
  title: string;
  date: string;
  notes: string;
  entries: WorkoutEntry[];
};

const SESSION_KEY = "workout-tracker:session";
const PREFILL_KEY = "workout-tracker:prefill";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newSet(): WorkoutSet {
  return { id: crypto.randomUUID(), reps: "", weight: "", minutes: "", completed: false };
}

function newSession(): SessionDraft {
  return { title: "Saturday strength session", date: today(), notes: "", entries: [] };
}

function readSession(): SessionDraft {
  try {
    const prefill = localStorage.getItem(PREFILL_KEY);
    if (prefill) {
      const parsed = JSON.parse(prefill) as { title?: string; exerciseIds?: string[] };
      const exercises = (parsed.exerciseIds ?? []).map((id) => workoutCatalog.find((exercise) => exercise.id === id)).filter((exercise): exercise is Exercise => Boolean(exercise));
      localStorage.removeItem(PREFILL_KEY);
      if (exercises.length) return { ...newSession(), title: parsed.title?.trim() || "Routine session", entries: exercises.map((exercise) => ({ ...exercise, sets: [newSet(), newSet(), newSet()] })) };
    }
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as SessionDraft;
  } catch {
    // A fresh session is a safe fallback if storage is unavailable or corrupt.
  }
  return newSession();
}

function formatMode(mode: MeasurementMode, t: (key: string, fallback?: string) => string) {
  return mode === "weighted" ? t("mode.weighted") : mode === "timed" ? t("mode.timed") : t("mode.bodyweight");
}

export function WorkoutPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { t } = useT();
  const [session, setSession] = useState<SessionDraft>(readSession);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("All");
  const [showAll, setShowAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [previewExercise, setPreviewExercise] = useState<Exercise>();

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workoutCatalog.filter((exercise) => {
      const categoryMatches = category === "All" || exercise.category === category;
      const queryMatches = !query || `${exercise.name} ${exercise.category} ${exercise.detail}`.toLowerCase().includes(query);
      return categoryMatches && queryMatches;
    });
  }, [category, search]);

  useEffect(() => {
    setPreviewExercise((current) => current && filteredCatalog.some((exercise) => exercise.id === current.id) ? current : filteredCatalog[0]);
  }, [filteredCatalog]);

  const totalSets = session.entries.reduce((total, entry) => total + entry.sets.length, 0);
  const completedSets = session.entries.reduce((total, entry) => total + entry.sets.filter((set) => set.completed).length, 0);
  const totalMinutes = session.entries.reduce((total, entry) => total + entry.sets.reduce((entryTotal, set) => entryTotal + Number(set.minutes || 0), 0), 0);
  const volume = session.entries.reduce((total, entry) => total + entry.sets.reduce((entryTotal, set) => entryTotal + Number(set.weight || 0) * Number(set.reps || 0), 0), 0);

  function addExercise(exercise: Exercise) {
    if (session.entries.some((entry) => entry.id === exercise.id)) return;
    setPreviewExercise(exercise);
    setSession((current) => ({ ...current, entries: [...current.entries, { ...exercise, sets: [newSet(), newSet(), newSet()] }] }));
  }

  function removeExercise(exerciseId: string) {
    setSession((current) => ({ ...current, entries: current.entries.filter((entry) => entry.id !== exerciseId) }));
  }

  function updateEntry(exerciseId: string, update: (entry: WorkoutEntry) => WorkoutEntry) {
    setSession((current) => ({ ...current, entries: current.entries.map((entry) => entry.id === exerciseId ? update(entry) : entry) }));
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<WorkoutSet>) {
    updateEntry(exerciseId, (entry) => ({ ...entry, sets: entry.sets.map((set) => set.id === setId ? { ...set, ...patch } : set) }));
  }

  function resetSession() {
    setSession(newSession());
    setSaveError("");
    setSavedId("");
  }

  async function saveSession(event: FormEvent) {
    event.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      const itemId = await saveWorkout({ title: session.title, date: session.date, notes: session.notes, totalMinutes, entries: session.entries });
      setSaved(true);
      setSavedId(itemId);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save this workout to Blocks.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="workout-page">
      <div className="workout-hero">
        <div>
          <div className="eyebrow"><Activity size={15} /> {t("workout.eyebrow")}</div>
          <h1>{t("workout.title")} <span>{t("workout.titleAccent")}</span></h1>
          <p>{t("workout.subtitle")}</p>
        </div>
        <div className="hero-badge"><Flame size={16} /><span><strong>{completedSets || 0}</strong> {t("workout.setsCompleted")}</span></div>
      </div>

      <div className="metrics workout-metrics">
        <Metric icon={<Target size={17} />} label={t("workout.movements")} value={String(session.entries.length)} note={t("workout.inSession")} />
        <Metric icon={<Dumbbell size={17} />} label={t("workout.volume")} value={`${volume.toLocaleString()} kg`} note={t("dashboard.weightedWork")} />
        <Metric icon={<Timer size={17} />} label={t("workout.timeTracked")} value={`${totalMinutes} min`} note={t("workout.cardioHold")} />
        <Metric icon={<Trophy size={17} />} label={t("workout.sessionStatus")} value={completedSets ? t("workout.inMotion") : t("workout.ready")} note={`${totalSets} ${t("workout.setsPlanned")}`} />
      </div>

      <div className="workout-layout">
        <form className="session-column" onSubmit={saveSession}>
          <div className="section-heading">
            <div>
              <span className="section-kicker">{t("workout.currentSession")}</span>
              <h2>{t("workout.logYourWorkout")}</h2>
            </div>
            <button className="quiet-button" type="button" onClick={resetSession}>{t("workout.clear")}</button>
          </div>

          <div className="session-meta panel">
            <label className="form-field">
              <span>{t("workout.sessionName")}</span>
              <input value={session.title} onChange={(event) => setSession((current) => ({ ...current, title: event.target.value }))} placeholder={t("workout.sessionPlaceholder")} />
            </label>
            <label className="form-field date-field">
              <span>{t("workout.date")}</span>
              <div className="input-with-icon"><CalendarDays size={16} /><input type="date" value={session.date} onChange={(event) => setSession((current) => ({ ...current, date: event.target.value }))} /></div>
            </label>
          </div>

          {session.entries.length === 0 ? (
            <div className="session-empty panel">
              <div className="empty-ring"><ListPlus size={24} /></div>
              <h3>{t("workout.sessionWaiting")}</h3>
              <p>{t("workout.chooseMovement")}</p>
            </div>
          ) : (
            <div className="entry-list">
              {session.entries.map((entry, index) => (
                <ExerciseEntry key={entry.id} entry={entry} index={index} t={t} onRemove={() => removeExercise(entry.id)} onAddSet={() => updateEntry(entry.id, (current) => ({ ...current, sets: [...current.sets, newSet()] }))} onRemoveSet={(setId) => updateEntry(entry.id, (current) => ({ ...current, sets: current.sets.length > 1 ? current.sets.filter((set) => set.id !== setId) : current.sets }))} onUpdateSet={updateSet} />
              ))}
            </div>
          )}

          <div className="notes-panel panel">
            <label className="form-field">
              <span>{t("workout.notes")} <em>{t("common.optional")}</em></span>
              <textarea value={session.notes} onChange={(event) => setSession((current) => ({ ...current, notes: event.target.value }))} placeholder={t("workout.notesPlaceholder")} rows={3} />
            </label>
          </div>
          {saveError ? <div className="alert alert-error save-alert">{saveError}</div> : null}
          {savedId ? <div className="alert alert-info save-alert">{t("workout.savedToBlocks")} <code>{savedId}</code>{onNavigate ? <button className="link-button save-link" type="button" onClick={() => onNavigate("/workouts")}>{t("workout.viewSaved")}</button> : null}</div> : null}
          <button className="primary-button save-session" disabled={isSaving} type="submit"><Check size={17} /> {isSaving ? t("workout.saving") : saved ? t("workout.sessionSaved") : t("workout.saveSession")}</button>
        </form>

        <div className="library-column">
          <div className="section-heading library-heading">
            <div>
              <span className="section-kicker">{t("workout.library")}</span>
              <h2>{t("workout.addToSession")}</h2>
            </div>
            <span className="library-count">{filteredCatalog.length} {t("workout.options")}</span>
          </div>
          <MuscleMap exercise={previewExercise} />
          <div className="search-box library-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("workout.searchPlaceholder")} /></div>
          <div className="category-row">
            {categoryOptions.map((option) => <button key={option} className={category === option ? "category-pill active" : "category-pill"} onClick={() => setCategory(option)} type="button">{t(`category.${option.toLowerCase()}`, option)}</button>)}
          </div>
          <div className="library-list">
            {(showAll ? filteredCatalog : filteredCatalog.slice(0, 9)).map((exercise) => {
              const selected = session.entries.some((entry) => entry.id === exercise.id);
              return <button className={selected ? "movement-card selected" : "movement-card"} key={exercise.id} onClick={() => addExercise(exercise)} onFocus={() => setPreviewExercise(exercise)} onMouseEnter={() => setPreviewExercise(exercise)} type="button">
                <span className={`movement-icon ${exercise.mode}`}><ModeIcon mode={exercise.mode} /></span>
                <span className="movement-copy"><strong>{exercise.name}</strong><small>{exercise.detail}</small></span>
                <span className="movement-action">{selected ? <Check size={16} /> : <Plus size={17} />}</span>
              </button>;
            })}
          </div>
          {filteredCatalog.length > 9 ? <button className="library-more" onClick={() => setShowAll((value) => !value)} type="button">{showAll ? t("workout.showFewer") : t("workout.showMore").replace("{count}", String(filteredCatalog.length - 9))} <ChevronDown size={15} className={showAll ? "rotate" : ""} /></button> : null}
          {filteredCatalog.length === 0 ? <div className="library-no-results">{t("workout.noResults")}</div> : null}
          <div className="library-tip"><Clock3 size={16} /><span><strong>{t("workout.trackIt")}</strong> {t("workout.measurementHint")}</span></div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) {
  return <div className="workout-metric"><span className="metric-icon">{icon}</span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function ModeIcon({ mode }: { mode: MeasurementMode }) {
  return mode === "weighted" ? <Dumbbell size={16} /> : mode === "timed" ? <Timer size={16} /> : <Activity size={16} />;
}

function ExerciseEntry({ entry, index, t, onRemove, onAddSet, onRemoveSet, onUpdateSet }: { entry: WorkoutEntry; index: number; t: (key: string, fallback?: string) => string; onRemove: () => void; onAddSet: () => void; onRemoveSet: (setId: string) => void; onUpdateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutSet>) => void }) {
  return <div className="exercise-entry panel">
    <div className="entry-header"><div className={`entry-index ${entry.mode}`}><ModeIcon mode={entry.mode} /></div><div className="entry-title"><span>{String(index + 1).padStart(2, "0")} · {formatMode(entry.mode, t)}</span><h3>{entry.name}</h3></div><button className="icon-button remove-entry" type="button" aria-label={t("workout.removeExercise").replace("{name}", entry.name)} onClick={onRemove}><Trash2 size={16} /></button></div>
    <div className="entry-divider" />
    <div className={`set-table ${entry.mode}`}>
      <div className="set-table-head"><span>{t("workout.setNumber", "SET").replace(" {number}", "")}</span>{entry.mode !== "timed" ? <span>{t("workout.reps")}</span> : <span>{t("workout.minutesForSet", "MINUTES").replace(" for set {number}", "")}</span>}{entry.mode === "weighted" ? <span>{t("workout.load")}</span> : <span />}</div>
      {entry.sets.map((set, setIndex) => <div className={set.completed ? "set-row completed" : "set-row"} key={set.id}>
        <span className="set-number">{setIndex + 1}</span>
        {entry.mode !== "timed" ? <input aria-label={t("workout.repsForSet").replace("{number}", String(setIndex + 1))} inputMode="numeric" min="0" type="number" value={set.reps} onChange={(event) => onUpdateSet(entry.id, set.id, { reps: event.target.value })} placeholder="—" /> : <input aria-label={t("workout.minutesForSet").replace("{number}", String(setIndex + 1))} inputMode="numeric" min="0" type="number" value={set.minutes} onChange={(event) => onUpdateSet(entry.id, set.id, { minutes: event.target.value })} placeholder="—" />}
        {entry.mode === "weighted" ? <input aria-label={t("workout.weightForSet").replace("{number}", String(setIndex + 1))} inputMode="decimal" min="0" step="0.5" type="number" value={set.weight} onChange={(event) => onUpdateSet(entry.id, set.id, { weight: event.target.value })} placeholder="—" /> : <span />}
        <button className={set.completed ? "set-check checked" : "set-check"} type="button" aria-label={set.completed ? t("workout.markIncomplete") : t("workout.markComplete")} onClick={() => onUpdateSet(entry.id, set.id, { completed: !set.completed })}>{set.completed ? <Check size={14} /> : null}</button>
        <button className="set-remove" type="button" aria-label={t("workout.removeSet")} onClick={() => onRemoveSet(set.id)}><Minus size={14} /></button>
      </div>)}
    </div>
    <button className="add-set" type="button" onClick={onAddSet}><Plus size={15} /> {t("workout.addSet")}</button>
    <div className="mode-note"><span className={`mode-dot ${entry.mode}`} />{t(`mode.${entry.mode}`, modeLabel(entry.mode))}</div>
  </div>;
}
