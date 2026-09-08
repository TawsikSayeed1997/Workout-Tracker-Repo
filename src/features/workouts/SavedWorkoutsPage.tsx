import { Activity, CalendarDays, Clock3, Dumbbell, ListChecks, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getWorkoutAnalytics, type WorkoutAnalytics, type WorkoutHistoryItem } from "./workoutsApi";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusPill } from "../../shared/ui/StatusPill";
import { useT } from "../../lib/i18n/LocalizationProvider";

export function SavedWorkoutsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useT();
  const [analytics, setAnalytics] = useState<WorkoutAnalytics>();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setAnalytics(await getWorkoutAnalytics()); } catch (caught) { setError(caught instanceof Error ? caught.message : t("common.error")); } finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <section className="saved-page"><div className="page-header"><div><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div></div><div className="panel skeleton-panel"><Skeleton style={{ height: 320, width: "100%" }} /></div></section>;
  if (error) return <section className="saved-page"><ErrorState message={error} onRetry={() => void load()} /></section>;

  const workouts = (analytics?.workouts ?? []).filter((workout) => workout.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="saved-page">
    <div className="page-header">
      <div><span className="eyebrow"><Activity size={15} /> {t("saved.eyebrow")}</span><h1>{t("saved.title")}</h1><p>{t("saved.subtitle")}</p></div>
      <ActionButton icon={<Plus size={17} />} onClick={() => onNavigate("/add-workout")}>{t("dashboard.addWorkout")}</ActionButton>
    </div>
    {analytics?.workouts.length ? <>
      <div className="archive-summary"><span><strong>{analytics.workouts.length}</strong> {t("saved.totalWorkouts")}</span><span><strong>{Math.round(analytics.totalMinutes).toLocaleString()}</strong> {t("saved.activeMinutes")}</span><span><strong>{Math.round(analytics.totalVolume).toLocaleString()} kg</strong> {t("saved.totalVolume")}</span></div>
      <div className="search-box archive-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("saved.searchPlaceholder")} aria-label={t("saved.searchAria")} /></div>
      {workouts.length ? <div className="workout-history-list">{workouts.map((workout) => <WorkoutHistoryCard key={workout.id} workout={workout} />)}</div> : <EmptyState icon={<Search size={26} />} title={t("saved.noMatchingTitle")} description={t("saved.noMatchingDescription")} />}
    </> : <EmptyState icon={<Dumbbell size={28} />} title={t("saved.archiveReadyTitle")} description={t("saved.archiveReadyDescription")} action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>{t("dashboard.addWorkout")}</ActionButton>} />}
  </section>;
}

function WorkoutHistoryCard({ workout }: { workout: WorkoutHistoryItem }) {
  const { t } = useT();
  const statusTone = workout.status.toLowerCase() === "completed" ? "good" : "neutral";
  return <article className="history-card panel"><div className="history-card-heading"><div className="history-title"><span className="history-date"><CalendarDays size={14} /> {formatDate(workout.workoutDate, t("common.dateUnavailable"))}</span><h2>{workout.title}</h2>{workout.notes ? <p>{workout.notes}</p> : null}</div><StatusPill tone={statusTone}>{workout.status || t("common.completed")}</StatusPill></div><div className="history-stats"><span><Dumbbell size={15} /><strong>{workout.exerciseCount}</strong> {t("common.movements")}</span><span><ListChecks size={15} /><strong>{workout.setCount}</strong> {t("common.sets")}</span><span><Clock3 size={15} /><strong>{workout.durationMinutes}</strong> {t("common.minutes")}</span>{workout.volume ? <span><Activity size={15} /><strong>{Math.round(workout.volume).toLocaleString()}</strong> kg</span> : null}</div></article>;
}

function formatDate(value: string, unavailable: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? unavailable : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
