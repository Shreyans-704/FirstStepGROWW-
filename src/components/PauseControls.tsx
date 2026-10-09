import { useState } from "react";
import { CalendarDays, Pause, Play } from "lucide-react";
import {
  fmtDate,
  nextContributionDate,
  pausePlan,
  resumeDateFor,
  resumePlan,
  type Plan,
} from "@/lib/firststep";
import { SimLabel } from "./Shell";

export function PauseControls({ plan, onChange }: { plan: Plan; onChange: (p: Plan) => void }) {
  const [months, setMonths] = useState(1);
  // One shared date reference per render so the preview and the action agree,
  // even if the click happens near a month boundary.
  const today = new Date();

  if (plan.status === "paused" && plan.resumeDate) {
    const resume = new Date(plan.resumeDate);
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3">
          <p className="text-sm font-semibold text-warning">
            Paused for {plan.pauseMonths} month{plan.pauseMonths === 1 ? "" : "s"}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 text-warning" />
            <span>
              Resumes on <strong className="text-foreground">{fmtDate(resume)}</strong>
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Next contribution expected on{" "}
            <strong className="text-foreground">{fmtDate(resume)}</strong>. Nothing is collected
            while paused.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => onChange(resumePlan(plan))}
        >
          <Play className="h-4 w-4" /> Resume now
        </button>
        <p className="text-xs text-muted-foreground">
          Resuming restores your saved amounts and schedules the next contribution normally.
        </p>
      </div>
    );
  }

  const next = nextContributionDate(today);
  const preview = resumeDateFor(today, months);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">Pause contributions</p>
        <SimLabel />
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Plan is active. Next contribution{" "}
          <strong className="text-foreground">{fmtDate(next)}</strong>.
        </span>
      </p>
      <div role="radiogroup" aria-label="Pause length" className="flex gap-2">
        {[1, 2, 3].map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={months === m}
            className="chip flex-1"
            onClick={() => setMonths(m)}
          >
            {m} mo
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Pausing {months} month{months === 1 ? "" : "s"} skips the next {months} contribution
        {months === 1 ? "" : "s"}. Would resume on{" "}
        <strong className="text-foreground">{fmtDate(preview)}</strong>.
      </p>
      <button
        type="button"
        className="btn btn-outline w-full"
        onClick={() => onChange(pausePlan(plan, months, today))}
      >
        <Pause className="h-4 w-4" /> Pause for {months} mo
      </button>
    </div>
  );
}
