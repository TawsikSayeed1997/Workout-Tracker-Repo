import { Activity, Check, ClipboardList, Dumbbell, Play, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { workoutCatalog, type Exercise } from "./workoutCatalog";
import { readRoutines, routineExerciseNames, startRoutine, writeRoutines, type Routine } from "./routines";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { useT } from "../../lib/i18n/LocalizationProvider";

export function RoutinesPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useT();
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
    const routine: Routine = { id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, name: name.trim(), focus, description: t("routines.description").replace("{focus}", focus), exerciseIds: selectedExercises };
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
      <div><span className="eyebrow"><ClipboardList size={15} /> {t("routines.eyebrow")}</span><h1>{t("routines.title")}</h1><p>{t("routines.subtitle")}</p></div>
      <ActionButton icon={<Plus size={17} />} onClick={() => setIsCreating((current) => !current)}>{isCreating ? t("routines.closeBuilder") : t("routines.new")}</ActionButton>
    </div>

    {isCreating ? <form className="routine-builder panel" onSubmit={createRoutine}>
      <div className="panel-heading-row"><div><span className="section-kicker">{t("routines.builderEyebrow")}</span><h2>{t("routines.builderTitle")}</h2></div><button className="icon-button" type="button" aria-label={t("routines.closeBuilder")} onClick={() => setIsCreating(false)}><X size={17} /></button></div>
      <div className="routine-form-top"><label className="form-field"><span>{t("routines.name")}</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("routines.namePlaceholder")} /></label><label className="form-field"><span>{t("routines.focus")}</span><select value={focus} onChange={(event) => setFocus(event.target.value)}><option>Strength</option><option>Hypertrophy</option><option>Full body</option><option>Conditioning</option></select></label></div>
      <div className="routine-exercise-picker"><div className="routine-picker-heading"><span className="section-kicker">{t("routines.chooseExercises")}</span><small>{selectedExercises.length} {t("routines.selected")}</small></div><div className="routine-exercise-grid">{selectableExercises.map((exercise) => { const selected = selectedExercises.includes(exercise.id); return <button className={selected ? "routine-exercise selected" : "routine-exercise"} key={exercise.id} type="button" onClick={() => toggleExercise(exercise)}><span className="routine-exercise-icon"><Dumbbell size={15} /></span><span>{exercise.name}</span>{selected ? <Check size={15} /> : <Plus size={15} />}</button>; })}</div></div>
      <div className="routine-builder-actions"><span className="muted">{t("routines.pickOne")}</span><ActionButton disabled={!name.trim() || !selectedExercises.length} icon={<Check size={16} />}>{t("routines.save")}</ActionButton></div>
    </form> : null}

    {routines.length ? <div className="routine-grid">{routines.map((routine) => <RoutineCard key={routine.id} routine={routine} t={t} onStart={() => { startRoutine(routine); onNavigate("/add-workout"); }} onDelete={() => removeRoutine(routine.id)} />)}</div> : <EmptyState icon={<ClipboardList size={28} />} title={t("routines.noRoutinesTitle")} description={t("routines.noRoutinesDescription")} action={<ActionButton icon={<Plus size={15} />} onClick={() => setIsCreating(true)}>{t("routines.new")}</ActionButton>} />}
  </section>;
}

function RoutineCard({ routine, t, onStart, onDelete }: { routine: Routine; t: (key: string, fallback?: string) => string; onStart: () => void; onDelete: () => void }) {
  const exercises = routineExerciseNames(routine);
  return <article className="routine-card panel"><div className="routine-card-top"><span className="routine-card-icon"><Activity size={18} /></span><button className="icon-button routine-delete" type="button" aria-label={t("routines.delete").replace("{name}", routine.name)} onClick={onDelete}><Trash2 size={15} /></button></div><div className="routine-card-copy"><span className="section-kicker">{routine.focus}</span><h2>{routine.name}</h2><p>{routine.description}</p></div><div className="routine-exercise-list">{exercises.slice(0, 4).map((exercise) => <span key={exercise}>{exercise}</span>)}{exercises.length > 4 ? <span>{t("routines.more").replace("{count}", String(exercises.length - 4))}</span> : null}</div><div className="routine-card-footer"><span>{exercises.length} {exercises.length === 1 ? t("common.exercise") : t("common.exercises")}</span><button className="primary-button routine-start" type="button" onClick={onStart}><Play size={15} /> {t("routines.start")}</button></div></article>;
}
