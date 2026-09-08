import { Activity, Check, ClipboardList, Dumbbell, Play, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { workoutCatalog, type Exercise } from "./workoutCatalog";
import { readRoutines, routineExerciseNames, startRoutine, writeRoutines, type Routine } from "./routines";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";

export function RoutinesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [routines, setRoutines] = useState<Routine[]>(readRoutines);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("Strength");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const selectableExercises = useMemo(() => workoutCatalog.filter((exercise) => exercise.mode !== "timed"), []);

  function toggleExercise(exercise: Exercise) {
    setSelectedExercises((current) => current.includes(exercise.id) ? current.filter((id) => id !== exercise.id) : [...current, exercise.id]);
  }

  function createRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !selectedExercises.length) return;
    const routine: Routine = { id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: name.trim(), focus, description: `${focus} routine built for your next training block.`, exerciseIds: selectedExercises };
    const next = [...routines, routine];
    writeRoutines(next);
    setRoutines(next);
    setName("");
    setFocus("Strength");
    setSelectedExercises([]);
    setIsCreating(false);
  }

  function removeRoutine(id: string) {
    const next = routines.filter((routine) => routine.id !== id);
    writeRoutines(next);
    setRoutines(next);
  }

  return <section className="routines-page">
    <div className="page-header routines-header">
      <div><span className="eyebrow"><ClipboardList size={15} /> YOUR TRAINING PLAN</span><h1>Routines</h1><p>Build repeatable sessions, then start logging with one tap.</p></div>
      <ActionButton icon={<Plus size={17} />} onClick={() => setIsCreating((current) => !current)}>{isCreating ? "Close builder" : "New routine"}</ActionButton>
    </div>

    {isCreating ? <form className="routine-builder panel" onSubmit={createRoutine}>
      <div className="panel-heading-row"><div><span className="section-kicker">ROUTINE BUILDER</span><h2>Make your next session repeatable</h2></div><button className="icon-button" type="button" aria-label="Close routine builder" onClick={() => setIsCreating(false)}><X size={17} /></button></div>
      <div className="routine-form-top"><label className="form-field"><span>Routine name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Upper body A" /></label><label className="form-field"><span>Focus</span><select value={focus} onChange={(event) => setFocus(event.target.value)}><option>Strength</option><option>Hypertrophy</option><option>Full body</option><option>Conditioning</option></select></label></div>
      <div className="routine-exercise-picker"><div className="routine-picker-heading"><span className="section-kicker">CHOOSE EXERCISES</span><small>{selectedExercises.length} selected</small></div><div className="routine-exercise-grid">{selectableExercises.map((exercise) => { const selected = selectedExercises.includes(exercise.id); return <button className={selected ? "routine-exercise selected" : "routine-exercise"} key={exercise.id} type="button" onClick={() => toggleExercise(exercise)}><span className="routine-exercise-icon"><Dumbbell size={15} /></span><span>{exercise.name}</span>{selected ? <Check size={15} /> : <Plus size={15} />}</button>; })}</div></div>
      <div className="routine-builder-actions"><span className="muted">Pick at least one exercise to save the routine.</span><ActionButton disabled={!name.trim() || !selectedExercises.length} icon={<Check size={16} />}>Save routine</ActionButton></div>
    </form> : null}

    {routines.length ? <div className="routine-grid">{routines.map((routine) => <RoutineCard key={routine.id} routine={routine} onStart={() => { startRoutine(routine); onNavigate("/add-workout"); }} onDelete={() => removeRoutine(routine.id)} />)}</div> : <EmptyState icon={<ClipboardList size={28} />} title="No routines yet" description="Create a repeatable plan for your next training block." action={<ActionButton icon={<Plus size={15} />} onClick={() => setIsCreating(true)}>New routine</ActionButton>} />}
  </section>;
}

function RoutineCard({ routine, onStart, onDelete }: { routine: Routine; onStart: () => void; onDelete: () => void }) {
  const exercises = routineExerciseNames(routine);
  return <article className="routine-card panel"><div className="routine-card-top"><span className="routine-card-icon"><Activity size={18} /></span><button className="icon-button routine-delete" type="button" aria-label={`Delete ${routine.name}`} onClick={onDelete}><Trash2 size={15} /></button></div><div className="routine-card-copy"><span className="section-kicker">{routine.focus}</span><h2>{routine.name}</h2><p>{routine.description}</p></div><div className="routine-exercise-list">{exercises.slice(0, 4).map((exercise) => <span key={exercise}>{exercise}</span>)}{exercises.length > 4 ? <span>+{exercises.length - 4} more</span> : null}</div><div className="routine-card-footer"><span>{exercises.length} exercise{exercises.length === 1 ? "" : "s"}</span><button className="primary-button routine-start" type="button" onClick={onStart}><Play size={15} /> Start workout</button></div></article>;
}
