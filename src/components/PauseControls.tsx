import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { fmtDate, pausePlan, resumeDateFor, resumePlan, type Plan } from "@/lib/firststep";
import { SimLabel } from "./Shell";

export function PauseControls({ plan, onChange }: { plan: Plan; onChange: (p: Plan) => void }) {
  const [months, setMonths] = useState(1);
  if (plan.status === "paused" && plan.resumeDate) {
    return (
      <div className="space-y-3">
        <p className="text-sm">Paused for {plan.pauseMonths} month{plan.pauseMonths === 1 ? "" : "s"}. Resumes on <strong>{fmtDate(new Date(plan.resumeDate))}</strong>.</p>
        <button className="btn btn-primary w-full" onClick={() => onChange(resumePlan(plan))}><Play className="h-4 w-4" /> Resume early</button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><p className="font-medium">Pause for</p><SimLabel /></div>
      <div role="radiogroup" aria-label="Pause length" className="flex gap-2">
        {[1, 2, 3].map((m) => (
          <button key={m} role="radio" aria-checked={months === m} className="chip flex-1" onClick={() => setMonths(m)}>{m} mo</button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Would resume on <strong className="text-foreground">{fmtDate(resumeDateFor(new Date(), months))}</strong></p>
      <button className="btn btn-outline w-full" onClick={() => onChange(pausePlan(plan, months))}><Pause className="h-4 w-4" /> Pause contributions</button>
    </div>
  );
}
