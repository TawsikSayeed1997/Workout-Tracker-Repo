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
import { saveWorkout } from "./workoutsApi";

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
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as SessionDraft;
  } catch {
    // A fresh session is a safe fallback if storage is unavailable or corrupt.
  }
  return newSession();
}

function formatMode(mode: MeasurementMode) {
  return mode === "weighted" ? "Weighted" : mode === "timed" ? "Timed" : "Bodyweight";
}

export function WorkoutPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [session, setSession] = useState<SessionDraft>(readSession);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<(typeof categoryOptions)[number]>("All");
  const [showAll, setShowAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedId, setSavedId] = useState("");

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

  const totalSets = session.entries.reduce((total, entry) => total + entry.sets.length, 0);
  const completedSets = session.entries.reduce((total, entry) => total + entry.sets.filter((set) => set.completed).length, 0);
  const totalMinutes = session.entries.reduce((total, entry) => total + entry.sets.reduce((entryTotal, set) => entryTotal + Number(set.minutes || 0), 0), 0);
  const volume = session.entries.reduce((total, entry) => total + entry.sets.reduce((entryTotal, set) => entryTotal + Number(set.weight || 0) * Number(set.reps || 0), 0), 0);

  function addExercise(exercise: Exercise) {
    if (session.entries.some((entry) => entry.id === exercise.id)) return;
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
          <div className="eyebrow"><Activity size={15} /> TRAINING LOG</div>
          <h1>Build a session that <span>moves you forward.</span></h1>
          <p>Pick your movements, record every set, and keep your progress in one place.</p>
        </div>
        <div className="hero-badge"><Flame size={16} /><span><strong>{completedSets || 0}</strong> sets completed</span></div>
      </div>

      <div className="metrics workout-metrics">
        <Metric icon={<Target size={17} />} label="Movements" value={String(session.entries.length)} note="in this session" />
        <Metric icon={<Dumbbell size={17} />} label="Volume" value={`${volume.toLocaleString()} kg`} note="weighted work" />
        <Metric icon={<Timer size={17} />} label="Time tracked" value={`${totalMinutes} min`} note="cardio & holds" />
        <Metric icon={<Trophy size={17} />} label="Session status" value={completedSets ? "In motion" : "Ready"} note={`${totalSets} sets planned`} />
      </div>

      <div className="workout-layout">
        <form className="session-column" onSubmit={saveSession}>
          <div className="section-heading">
            <div>
              <span className="section-kicker">CURRENT SESSION</span>
              <h2>Log your workout</h2>
            </div>
            <button className="quiet-button" type="button" onClick={resetSession}>Clear</button>
          </div>

          <div className="session-meta panel">
            <label className="form-field">
              <span>Session name</span>
              <input value={session.title} onChange={(event) => setSession((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Push day" />
            </label>
            <label className="form-field date-field">
              <span>Date</span>
              <div className="input-with-icon"><CalendarDays size={16} /><input type="date" value={session.date} onChange={(event) => setSession((current) => ({ ...current, date: event.target.value }))} /></div>
            </label>
          </div>

          {session.entries.length === 0 ? (
            <div className="session-empty panel">
              <div className="empty-ring"><ListPlus size={24} /></div>
              <h3>Your session is waiting</h3>
              <p>Choose a movement from the library to start logging sets.</p>
            </div>
          ) : (
            <div className="entry-list">
              {session.entries.map((entry, index) => (
                <ExerciseEntry key={entry.id} entry={entry} index={index} onRemove={() => removeExercise(entry.id)} onAddSet={() => updateEntry(entry.id, (current) => ({ ...current, sets: [...current.sets, newSet()] }))} onRemoveSet={(setId) => updateEntry(entry.id, (current) => ({ ...current, sets: current.sets.length > 1 ? current.sets.filter((set) => set.id !== setId) : current.sets }))} onUpdateSet={updateSet} />
              ))}
            </div>
          )}

          <div className="notes-panel panel">
            <label className="form-field">
              <span>Session notes <em>Optional</em></span>
              <textarea value={session.notes} onChange={(event) => setSession((current) => ({ ...current, notes: event.target.value }))} placeholder="How did it feel? Any wins to remember?" rows={3} />
            </label>
          </div>
          {saveError ? <div className="alert alert-error save-alert">{saveError}</div> : null}
          {savedId ? <div className="alert alert-info save-alert">Saved to Blocks. Session id: <code>{savedId}</code>{onNavigate ? <button className="link-button save-link" type="button" onClick={() => onNavigate("/workouts")}>View saved workouts</button> : null}</div> : null}
          <button className="primary-button save-session" disabled={isSaving} type="submit"><Check size={17} /> {isSaving ? "Saving…" : saved ? "Session saved" : "Save session"}</button>
        </form>

        <div className="library-column">
          <div className="section-heading library-heading">
            <div>
              <span className="section-kicker">MOVEMENT LIBRARY</span>
              <h2>Add to your session</h2>
            </div>
            <span className="library-count">{filteredCatalog.length} options</span>
          </div>
          <div className="search-box library-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movements or sports" /></div>
          <div className="category-row">
            {categoryOptions.map((option) => <button key={option} className={category === option ? "category-pill active" : "category-pill"} onClick={() => setCategory(option)} type="button">{option}</button>)}
          </div>
          <div className="library-list">
            {(showAll ? filteredCatalog : filteredCatalog.slice(0, 9)).map((exercise) => {
              const selected = session.entries.some((entry) => entry.id === exercise.id);
              return <button className={selected ? "movement-card selected" : "movement-card"} key={exercise.id} onClick={() => addExercise(exercise)} type="button">
                <span className={`movement-icon ${exercise.mode}`}><ModeIcon mode={exercise.mode} /></span>
                <span className="movement-copy"><strong>{exercise.name}</strong><small>{exercise.detail}</small></span>
                <span className="movement-action">{selected ? <Check size={16} /> : <Plus size={17} />}</span>
              </button>;
            })}
          </div>
          {filteredCatalog.length > 9 ? <button className="library-more" onClick={() => setShowAll((value) => !value)} type="button">{showAll ? "Show fewer" : `Show ${filteredCatalog.length - 9} more`} <ChevronDown size={15} className={showAll ? "rotate" : ""} /></button> : null}
          {filteredCatalog.length === 0 ? <div className="library-no-results">No movements match that search.</div> : null}
          <div className="library-tip"><Clock3 size={16} /><span><strong>Track it your way.</strong> Weighted work gets reps and load, cardio gets minutes, and bodyweight stays simple.</span></div>
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

function ExerciseEntry({ entry, index, onRemove, onAddSet, onRemoveSet, onUpdateSet }: { entry: WorkoutEntry; index: number; onRemove: () => void; onAddSet: () => void; onRemoveSet: (setId: string) => void; onUpdateSet: (exerciseId: string, setId: string, patch: Partial<WorkoutSet>) => void }) {
  return <div className="exercise-entry panel">
    <div className="entry-header"><div className={`entry-index ${entry.mode}`}><ModeIcon mode={entry.mode} /></div><div className="entry-title"><span>{String(index + 1).padStart(2, "0")} · {formatMode(entry.mode)}</span><h3>{entry.name}</h3></div><button className="icon-button remove-entry" type="button" aria-label={`Remove ${entry.name}`} onClick={onRemove}><Trash2 size={16} /></button></div>
    <div className="entry-divider" />
    <div className={`set-table ${entry.mode}`}>
      <div className="set-table-head"><span>SET</span>{entry.mode !== "timed" ? <span>REPS</span> : <span>MINUTES</span>}{entry.mode === "weighted" ? <span>LOAD (KG)</span> : <span />}</div>
      {entry.sets.map((set, setIndex) => <div className={set.completed ? "set-row completed" : "set-row"} key={set.id}>
        <span className="set-number">{setIndex + 1}</span>
        {entry.mode !== "timed" ? <input aria-label={`Reps for set ${setIndex + 1}`} inputMode="numeric" min="0" type="number" value={set.reps} onChange={(event) => onUpdateSet(entry.id, set.id, { reps: event.target.value })} placeholder="—" /> : <input aria-label={`Minutes for set ${setIndex + 1}`} inputMode="numeric" min="0" type="number" value={set.minutes} onChange={(event) => onUpdateSet(entry.id, set.id, { minutes: event.target.value })} placeholder="—" />}
        {entry.mode === "weighted" ? <input aria-label={`Weight for set ${setIndex + 1}`} inputMode="decimal" min="0" step="0.5" type="number" value={set.weight} onChange={(event) => onUpdateSet(entry.id, set.id, { weight: event.target.value })} placeholder="—" /> : <span />}
        <button className={set.completed ? "set-check checked" : "set-check"} type="button" aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"} onClick={() => onUpdateSet(entry.id, set.id, { completed: !set.completed })}>{set.completed ? <Check size={14} /> : null}</button>
        <button className="set-remove" type="button" aria-label="Remove set" onClick={() => onRemoveSet(set.id)}><Minus size={14} /></button>
      </div>)}
    </div>
    <button className="add-set" type="button" onClick={onAddSet}><Plus size={15} /> Add set</button>
    <div className="mode-note"><span className={`mode-dot ${entry.mode}`} />{modeLabel(entry.mode)}</div>
  </div>;
}
