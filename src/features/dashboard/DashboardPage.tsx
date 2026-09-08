import { Activity, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Dumbbell, ListChecks, Plus, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getWorkoutAnalytics, type WorkoutAnalytics, type WorkoutHistoryItem } from "../workouts/workoutsApi";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useT } from "../../lib/i18n/LocalizationProvider";

type DashboardPageProps = { onNavigate: (path: string) => void };

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { t } = useT();
  const [analytics, setAnalytics] = useState<WorkoutAnalytics>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAnalytics(await getWorkoutAnalytics());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <section><ErrorState message={error} onRetry={() => void load()} /></section>;

  const data = analytics ?? { workouts: [], totalVolume: 0, totalMinutes: 0, totalSets: 0, completedSets: 0 };
  const latest = data.workouts[0];
  const weekMinutes = data.workouts.filter((workout) => isWithinDays(workout.workoutDate, 7)).reduce((total, workout) => total + workout.durationMinutes, 0);

  return (
    <section className="dashboard-page">
      <div className="page-header dashboard-header">
        <div>
          <span className="eyebrow"><Activity size={15} /> {t("dashboard.eyebrow")}</span>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <ActionButton icon={<Plus size={17} />} onClick={() => onNavigate("/add-workout")}>{t("dashboard.addWorkout")}</ActionButton>
      </div>

      <div className="metrics dashboard-metrics">
        <DashboardMetric icon={<Dumbbell size={17} />} label={t("dashboard.workouts")} value={String(data.workouts.length)} note={t("dashboard.allTime")} />
        <DashboardMetric icon={<BarChart3 size={17} />} label={t("dashboard.totalVolume")} value={`${formatNumber(data.totalVolume)} kg`} note={t("dashboard.weightedWork")} />
        <DashboardMetric icon={<Clock3 size={17} />} label={t("dashboard.activeTime")} value={`${formatNumber(data.totalMinutes)} min`} note={t("dashboard.loggedDuration")} />
        <DashboardMetric icon={<ListChecks size={17} />} label={t("dashboard.setsCompleted")} value={String(data.completedSets)} note={`${data.totalSets} ${t("dashboard.setsLogged")}`} />
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading-row">
            <div><span className="section-kicker">{t("dashboard.progress")}</span><h2>{t("dashboard.trainingLoad")}</h2></div>
            <span className="chart-legend"><i /> {t("dashboard.volume")}</span>
          </div>
          {data.workouts.length ? <VolumeChart workouts={data.workouts} /> : <EmptyState icon={<BarChart3 size={26} />} title={t("dashboard.noChartTitle")} description={t("dashboard.noChartDescription")} action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>{t("dashboard.addWorkout")}</ActionButton>} />}
        </div>

        <div className="panel focus-panel">
          <div className="panel-heading-row"><div><span className="section-kicker">{t("dashboard.thisWeek")}</span><h2>{t("dashboard.rhythm")}</h2></div><Timer size={18} className="panel-heading-icon" /></div>
          <ProgressRow icon={<Clock3 size={16} />} label={t("dashboard.activeMinutes")} value={weekMinutes} target={150} suffix={t("dashboard.targetMinutes")} />
          <ProgressRow icon={<Dumbbell size={16} />} label={t("dashboard.sessions")} value={data.workouts.filter((workout) => isWithinDays(workout.workoutDate, 7)).length} target={4} suffix={t("dashboard.targetWorkouts")} />
          <ProgressRow icon={<CheckCircle2 size={16} />} label={t("dashboard.setsCompleted")} value={data.workouts.filter((workout) => isWithinDays(workout.workoutDate, 7)).reduce((total, workout) => total + workout.completedSetCount, 0)} target={20} suffix={t("dashboard.targetSets")} />
          <p className="panel-footnote">{t("dashboard.targetsNote")}</p>
        </div>
      </div>

      <div className="panel recent-panel">
        <div className="panel-heading-row"><div><span className="section-kicker">{t("dashboard.recentActivity")}</span><h2>{t("dashboard.latestWorkouts")}</h2></div><button className="link-button inline-link" onClick={() => onNavigate("/workouts")}>{t("dashboard.viewAll")} <ArrowUpRight size={15} /></button></div>
        {latest ? <div className="recent-list">{data.workouts.slice(0, 4).map((workout) => <RecentWorkout key={workout.id} workout={workout} />)}</div> : <EmptyState icon={<CalendarDays size={26} />} title={t("dashboard.noWorkoutsTitle")} description={t("dashboard.noWorkoutsDescription")} action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>{t("dashboard.addWorkout")}</ActionButton>} />}
      </div>
    </section>
  );
}

function DashboardMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="dashboard-stat"><span className="dashboard-stat-icon">{icon}</span><span className="dashboard-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function VolumeChart({ workouts }: { workouts: WorkoutHistoryItem[] }) {
  const { t } = useT();
  const points = workouts.slice(0, 7).reverse();
  const max = Math.max(...points.map((workout) => workout.volume), 1);
  const width = 720;
  const height = 210;
  const top = 18;
  const bottom = 42;
  const chartHeight = height - top - bottom;
  const coordinates = points.map((workout, index) => ({
    x: points.length === 1 ? width / 2 : 30 + (index * (width - 60)) / (points.length - 1),
    y: top + chartHeight - (workout.volume / max) * chartHeight
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return <div className="volume-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t("dashboard.chartAria")}>
    {[0, 1, 2, 3].map((step) => { const y = top + (chartHeight * step) / 3; return <line key={step} x1="30" x2="690" y1={y} y2={y} className="chart-grid-line" />; })}
    <polyline points={line} className="chart-line" />
    {coordinates.map((point, index) => <g key={points[index]?.id}><circle cx={point.x} cy={point.y} r="5" className="chart-dot" /><text x={point.x} y={height - 14} textAnchor="middle" className="chart-label">{formatChartDate(points[index]?.workoutDate ?? "")}</text></g>)}
  </svg><div className="chart-summary"><span><strong>{formatNumber(Math.max(...points.map((workout) => workout.volume), 0))} kg</strong> {t("dashboard.peakSession")}</span><span>{points.length === 1 ? t("dashboard.lastWorkout") : t("dashboard.lastWorkouts").replace("{count}", String(points.length))}</span></div></div>;
}

function ProgressRow({ icon, label, value, target, suffix }: { icon: React.ReactNode; label: string; value: number; target: number; suffix: string }) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  return <div className="progress-row"><div className="progress-label"><span>{icon}</span><strong>{label}</strong><small>{value} / {target} {suffix}</small></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div></div>;
}

function RecentWorkout({ workout }: { workout: WorkoutHistoryItem }) {
  const { t } = useT();
  return <div className="recent-item"><span className="recent-icon"><Dumbbell size={17} /></span><div className="recent-copy"><strong>{workout.title}</strong><span>{formatDate(workout.workoutDate, t("common.dateUnavailable"))} · {workout.exerciseCount} {workout.exerciseCount === 1 ? t("common.movement") : t("common.movements")}</span></div><div className="recent-result"><strong>{workout.volume ? `${formatNumber(workout.volume)} kg` : `${workout.durationMinutes} min`}</strong><span>{workout.setCount} {t("common.sets")}</span></div></div>;
}

function DashboardSkeleton() {
  return <section className="dashboard-page"><div className="dashboard-skeleton-header"><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div><div className="metrics dashboard-metrics">{[1, 2, 3, 4].map((item) => <div className="dashboard-stat" key={item}><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div>)}</div><div className="dashboard-grid"><div className="panel skeleton-panel"><Skeleton style={{ height: 220, width: "100%" }} /></div><div className="panel skeleton-panel"><Skeleton style={{ height: 220, width: "100%" }} /></div></div></section>;
}

function formatNumber(value: number) { return Math.round(value).toLocaleString(); }
function formatDate(value: string, unavailable: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? unavailable : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function formatChartDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function isWithinDays(value: string, days: number) { const timestamp = Date.parse(value); return Number.isFinite(timestamp) && Date.now() - timestamp <= days * 86400000 && timestamp <= Date.now(); }
