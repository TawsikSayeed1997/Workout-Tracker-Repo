import { Activity, Info } from "lucide-react";
import type { Exercise, MuscleIntensity, MuscleKey } from "./workoutCatalog";
import { muscleLabels } from "./workoutCatalog";
import { useT } from "../../lib/i18n/LocalizationProvider";

export function MuscleMap({ exercise }: { exercise?: Exercise }) {
  const { t } = useT();
  const targets = exercise?.muscles ?? {};
  const targetEntries = (Object.entries(targets) as [MuscleKey, MuscleIntensity][]).sort(([, a], [, b]) => a === "primary" ? -1 : b === "primary" ? 1 : 0);
  return <div className="muscle-map">
    <div className="muscle-map-heading"><div><span className="section-kicker">{t("workout.muscleFocus")}</span><h3>{exercise?.name ?? t("workout.chooseMovementShort")}</h3></div><Activity size={17} className="panel-heading-icon" /></div>
    <div className="muscle-map-body"><BodyFigure targets={targets} label={t("workout.front")} t={t} /><BodyFigure targets={targets} label={t("workout.back")} t={t} back /></div>
    <div className="muscle-legend"><span><i className="legend-primary" /> {t("workout.mainTarget")}</span><span><i className="legend-secondary" /> {t("workout.supporting")}</span></div>
    {targetEntries.length ? <div className="muscle-tags">{targetEntries.map(([key, intensity]) => <span className={intensity === "primary" ? "muscle-tag primary" : "muscle-tag"} key={key}>{t(`muscle.${key}`, muscleLabels[key])}</span>)}</div> : <p className="muscle-map-hint"><Info size={14} /> {t("workout.mapHint")}</p>}
  </div>;
}

function BodyFigure({ targets, label, t, back = false }: { targets: Partial<Record<MuscleKey, MuscleIntensity>>; label: string; t: (key: string, fallback?: string) => string; back?: boolean }) {
  const fill = (key: MuscleKey) => ({ fill: muscleColor(targets[key]) });
  return <div className="body-figure"><svg viewBox="0 0 110 220" role="img" aria-label={t("workout.mapAria").replace("{label}", label)}>
    <circle cx="55" cy="16" r="12" className="body-base" />
    <path d="M47 28h16l4 13 8 5-5 35-8 4 5 42-7 5-5-43-5 43-7-5 5-42-8-4-5-35 8-5 4-13Z" className="body-base" />
    <path d="M40 45 27 48l-10 35 8 3 14-25Z" className="body-base" />
    <path d="M70 45 83 48l10 35-8 3-14-25Z" className="body-base" />
    <path d="m48 125-8 4-3 45 8 0 8-43Z" className="body-base" />
    <path d="m62 125 8 4 3 45-8 0-8-43Z" className="body-base" />
    <path d="m45 174-7 0-5 32 8 0 4-19Z" className="body-base" />
    <path d="m65 174 7 0 5 32-8 0-4-19Z" className="body-base" />

    {back ? <>
      <path d="M47 42h16l5 9-8 17H50l-8-17Z" style={fill("trapezius")} />
      <path d="m43 54 9 10-4 25-10-10Z" style={fill("lats")} />
      <path d="m67 54-9 10 4 25 10-10Z" style={fill("lats")} />
      <path d="M48 84h14l4 15-11 6-11-6Z" style={fill("lowerBack")} />
      <path d="M44 98h11l-2 22-9 10-6-13Z" style={fill("gluteus")} />
      <path d="M66 98H55l2 22 9 10 6-13Z" style={fill("gluteus")} />
      <path d="m40 49-10 5-8 26 6 2 13-21Z" style={fill("triceps")} />
      <path d="m70 49 10 5 8 26-6 2-13-21Z" style={fill("triceps")} />
      <path d="m27 80-6 4 4 18 6-2Z" style={fill("forearms")} />
      <path d="m83 80 6 4-4 18-6-2Z" style={fill("forearms")} />
      <path d="m41 128 8 1-4 38-7 0Z" style={fill("hamstrings")} />
      <path d="m69 128-8 1 4 38 7 0Z" style={fill("hamstrings")} />
    </> : <>
      <path d="M42 44h26l-3 19-10 5-10-5Z" style={fill("pectorals")} />
      <path d="M49 68h12l3 28-9 8-9-8Z" style={fill("abdominals")} />
      <path d="m42 43-10 4-5 15 8 5 10-8Z" style={fill("deltoids")} />
      <path d="m68 43 10 4 5 15-8 5-10-8Z" style={fill("deltoids")} />
      <path d="m33 65 9-5 5 18-9 7Z" style={fill("biceps")} />
      <path d="m77 65-9-5-5 18 9 7Z" style={fill("biceps")} />
      <path d="m39 85-7-3-5 17 8 3Z" style={fill("forearms")} />
      <path d="m71 85 7-3 5 17-8 3Z" style={fill("forearms")} />
      <path d="m42 103 13 2-3 17-12 7Z" style={fill("hips")} />
      <path d="m68 103-13 2 3 17 12 7Z" style={fill("hips")} />
      <path d="m41 126 10 0-4 41-8 0Z" style={fill("quadriceps")} />
      <path d="m69 126-10 0 4 41 8 0Z" style={fill("quadriceps")} />
    </>}
    <path d="m38 168-6 0-5 38 8 0 5-20Z" style={fill("calves")} />
    <path d="m72 168 6 0 5 38-8 0-5-20Z" style={fill("calves")} />
  </svg><span>{label}</span></div>;
}

function muscleColor(intensity?: MuscleIntensity) {
  if (intensity === "primary") return "hsl(222 76% 43% / .92)";
  if (intensity === "secondary") return "hsl(193 74% 58% / .75)";
  return "hsl(213 28% 91% / .3)";
}
