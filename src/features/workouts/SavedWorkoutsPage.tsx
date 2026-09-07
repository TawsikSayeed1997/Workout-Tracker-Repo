import { Activity, CalendarDays, Clock3, Dumbbell, ListChecks, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getWorkoutAnalytics, type WorkoutAnalytics, type WorkoutHistoryItem } from "./workoutsApi";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusPill } from "../../shared/ui/StatusPill";

export function SavedWorkoutsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [analytics, setAnalytics] = useState<WorkoutAnalytics>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setAnalytics(await getWorkoutAnalytics()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load your saved workouts."); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <section className="saved-page"><div className="page-header"><div><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div></div><div className="panel skeleton-panel"><Skeleton style={{ height: 320, width: "100%" }} /></div></section>;
  if (error) return <section className="saved-page"><ErrorState message={error} onRetry={() => void load()} /></section>;

  const workouts = (analytics?.workouts ?? []).filter((workout) => workout.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="saved-page">
    <div className="page-header">
      <div><span className="eyebrow"><Activity size={15} /> YOUR TRAINING ARCHIVE</span><h1>Saved workouts</h1><p>Every session, set, and win in one calm place.</p></div>
      <ActionButton icon={<Plus size={17} />} onClick={() => onNavigate("/add-workout")}>Add workout</ActionButton>
    </div>
    {analytics?.workouts.length ? <>
      <div className="archive-summary"><span><strong>{analytics.workouts.length}</strong> total workouts</span><span><strong>{Math.round(analytics.totalMinutes).toLocaleString()}</strong> active minutes</span><span><strong>{Math.round(analytics.totalVolume).toLocaleString()} kg</strong> total volume</span></div>
      <div className="search-box archive-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved workouts" aria-label="Search saved workouts" /></div>
      {workouts.length ? <div className="workout-history-list">{workouts.map((workout) => <WorkoutHistoryCard key={workout.id} workout={workout} />)}</div> : <EmptyState icon={<Search size={26} />} title="No matching workouts" description="Try a different session name." />}
    </> : <EmptyState icon={<Dumbbell size={28} />} title="Your archive is ready for its first entry" description="Save a workout and it will show up here with its volume, duration, and movement breakdown." action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>Add workout</ActionButton>} />}
  </section>;
}

function WorkoutHistoryCard({ workout }: { workout: WorkoutHistoryItem }) {
  const statusTone = workout.status.toLowerCase() === "completed" ? "good" : "neutral";
  return <article className="history-card panel"><div className="history-card-heading"><div className="history-title"><span className="history-date"><CalendarDays size={14} /> {formatDate(workout.workoutDate)}</span><h2>{workout.title}</h2>{workout.notes ? <p>{workout.notes}</p> : null}</div><StatusPill tone={statusTone}>{workout.status || "completed"}</StatusPill></div><div className="history-stats"><span><Dumbbell size={15} /><strong>{workout.exerciseCount}</strong> movements</span><span><ListChecks size={15} /><strong>{workout.setCount}</strong> sets</span><span><Clock3 size={15} /><strong>{workout.durationMinutes}</strong> min</span>{workout.volume ? <span><Activity size={15} /><strong>{Math.round(workout.volume).toLocaleString()}</strong> kg</span> : null}</div></article>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
