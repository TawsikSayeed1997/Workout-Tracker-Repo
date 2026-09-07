import { Activity, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Dumbbell, ListChecks, Plus, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getWorkoutAnalytics, type WorkoutAnalytics, type WorkoutHistoryItem } from "../workouts/workoutsApi";
import { ActionButton } from "../../shared/ui/ActionButton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ErrorState } from "../../shared/ui/ErrorState";
import { Skeleton } from "../../shared/ui/Skeleton";

type DashboardPageProps = { onNavigate: (path: string) => void };

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [analytics, setAnalytics] = useState<WorkoutAnalytics>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAnalytics(await getWorkoutAnalytics());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load your workout dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

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
          <span className="eyebrow"><Activity size={15} /> YOUR TRAINING SPACE</span>
          <h1>Train with intention.</h1>
          <p>A clear view of the work you have put in, and the next session waiting for you.</p>
        </div>
        <ActionButton icon={<Plus size={17} />} onClick={() => onNavigate("/add-workout")}>Add workout</ActionButton>
      </div>

      <div className="metrics dashboard-metrics">
        <DashboardMetric icon={<Dumbbell size={17} />} label="Workouts" value={String(data.workouts.length)} note="all time" />
        <DashboardMetric icon={<BarChart3 size={17} />} label="Total volume" value={`${formatNumber(data.totalVolume)} kg`} note="weighted work" />
        <DashboardMetric icon={<Clock3 size={17} />} label="Active time" value={`${formatNumber(data.totalMinutes)} min`} note="logged duration" />
        <DashboardMetric icon={<ListChecks size={17} />} label="Sets completed" value={String(data.completedSets)} note={`${data.totalSets} sets logged`} />
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-heading-row">
            <div><span className="section-kicker">PROGRESS OVER TIME</span><h2>Training load</h2></div>
            <span className="chart-legend"><i /> Volume (kg)</span>
          </div>
          {data.workouts.length ? <VolumeChart workouts={data.workouts} /> : <EmptyState icon={<BarChart3 size={26} />} title="Your chart starts here" description="Save your first workout to see your training volume build over time." action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>Add workout</ActionButton>} />}
        </div>

        <div className="panel focus-panel">
          <div className="panel-heading-row"><div><span className="section-kicker">THIS WEEK</span><h2>Your rhythm</h2></div><Timer size={18} className="panel-heading-icon" /></div>
          <ProgressRow icon={<Clock3 size={16} />} label="Active minutes" value={weekMinutes} target={150} suffix="min" />
          <ProgressRow icon={<Dumbbell size={16} />} label="Sessions" value={data.workouts.filter((workout) => isWithinDays(workout.workoutDate, 7)).length} target={4} suffix="workouts" />
          <ProgressRow icon={<CheckCircle2 size={16} />} label="Completed sets" value={data.workouts.filter((workout) => isWithinDays(workout.workoutDate, 7)).reduce((total, workout) => total + workout.completedSetCount, 0)} target={20} suffix="sets" />
          <p className="panel-footnote">Targets are gentle guides. Consistency beats perfection.</p>
        </div>
      </div>

      <div className="panel recent-panel">
        <div className="panel-heading-row"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest workouts</h2></div><button className="link-button inline-link" onClick={() => onNavigate("/workouts")}>View all <ArrowUpRight size={15} /></button></div>
        {latest ? <div className="recent-list">{data.workouts.slice(0, 4).map((workout) => <RecentWorkout key={workout.id} workout={workout} />)}</div> : <EmptyState icon={<CalendarDays size={26} />} title="No workouts saved yet" description="Start a session and your recent activity will appear here." action={<ActionButton icon={<Plus size={15} />} onClick={() => onNavigate("/add-workout")}>Add workout</ActionButton>} />}
      </div>
    </section>
  );
}

function DashboardMetric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="dashboard-stat"><span className="dashboard-stat-icon">{icon}</span><span className="dashboard-stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function VolumeChart({ workouts }: { workouts: WorkoutHistoryItem[] }) {
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

  return <div className="volume-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Workout volume by session">
    {[0, 1, 2, 3].map((step) => { const y = top + (chartHeight * step) / 3; return <line key={step} x1="30" x2="690" y1={y} y2={y} className="chart-grid-line" />; })}
    <polyline points={line} className="chart-line" />
    {coordinates.map((point, index) => <g key={points[index]?.id}><circle cx={point.x} cy={point.y} r="5" className="chart-dot" /><text x={point.x} y={height - 14} textAnchor="middle" className="chart-label">{formatChartDate(points[index]?.workoutDate ?? "")}</text></g>)}
  </svg><div className="chart-summary"><span><strong>{formatNumber(Math.max(...points.map((workout) => workout.volume), 0))} kg</strong> peak session</span><span>Last {points.length} workout{points.length === 1 ? "" : "s"}</span></div></div>;
}

function ProgressRow({ icon, label, value, target, suffix }: { icon: React.ReactNode; label: string; value: number; target: number; suffix: string }) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  return <div className="progress-row"><div className="progress-label"><span>{icon}</span><strong>{label}</strong><small>{value} / {target} {suffix}</small></div><div className="progress-track"><span style={{ width: `${percentage}%` }} /></div></div>;
}

function RecentWorkout({ workout }: { workout: WorkoutHistoryItem }) {
  return <div className="recent-item"><span className="recent-icon"><Dumbbell size={17} /></span><div className="recent-copy"><strong>{workout.title}</strong><span>{formatDate(workout.workoutDate)} · {workout.exerciseCount} movement{workout.exerciseCount === 1 ? "" : "s"}</span></div><div className="recent-result"><strong>{workout.volume ? `${formatNumber(workout.volume)} kg` : `${workout.durationMinutes} min`}</strong><span>{workout.setCount} sets</span></div></div>;
}

function DashboardSkeleton() {
  return <section className="dashboard-page"><div className="dashboard-skeleton-header"><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div><div className="metrics dashboard-metrics">{[1, 2, 3, 4].map((item) => <div className="dashboard-stat" key={item}><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line-lg" /></div>)}</div><div className="dashboard-grid"><div className="panel skeleton-panel"><Skeleton style={{ height: 220, width: "100%" }} /></div><div className="panel skeleton-panel"><Skeleton style={{ height: 220, width: "100%" }} /></div></div></section>;
}

function formatNumber(value: number) { return Math.round(value).toLocaleString(); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function formatChartDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function isWithinDays(value: string, days: number) { const timestamp = Date.parse(value); return Number.isFinite(timestamp) && Date.now() - timestamp <= days * 86400000 && timestamp <= Date.now(); }
