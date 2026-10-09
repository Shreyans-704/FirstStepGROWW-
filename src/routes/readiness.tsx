import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Sprout } from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { assessReadiness, inr, validateReadiness, type ReadinessInput } from "@/lib/firststep";
import { saveReadiness } from "@/lib/usePlan";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "Money Readiness Check — First Step" },
      { name: "description", content: "Five quick questions to see if you should build a cushion, start tiny, or plan your first SIP." },
      { property: "og:title", content: "Money Readiness Check — First Step" },
      { property: "og:description", content: "An explainable readiness check for first-time investors." },
    ],
  }),
  component: Readiness,
});

type Key = keyof ReadinessInput;
const fields: { k: Key; label: string; hint: string; prefix?: string }[] = [
  { k: "income", label: "Monthly take-home income", hint: "Average if it varies", prefix: "₹" },
  { k: "expenses", label: "Monthly fixed expenses", hint: "Rent, food, bills, transport", prefix: "₹" },
  { k: "emi", label: "Monthly EMI payments", hint: "Enter 0 if none", prefix: "₹" },
  { k: "emergencyMonths", label: "Emergency savings", hint: "How many months of essentials could you cover?" },
  { k: "horizonYears", label: "Investment time horizon (years)", hint: "When might you need this money?" },
];

const meta = {
  cushion: { title: "Build a cushion first", icon: CircleAlert, tone: "bg-warning-soft text-warning", next: "Aim for at least 1–3 months of essentials in savings before investing. You can still explore the planner." },
  tiny: { title: "Start tiny", icon: Sprout, tone: "bg-primary-soft text-primary", next: "Begin with the ₹500 base and skip top-ups until the gaps below are closed." },
  ready: { title: "Ready to plan", icon: CheckCircle2, tone: "bg-primary text-primary-foreground", next: "Set a base you can always keep, and add an optional top-up for good months." },
} as const;

function Readiness() {
  const [v, setV] = useState<Partial<Record<Key, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [result, setResult] = useState<ReturnType<typeof assessReadiness> | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateReadiness(v);
    setErrors(errs);
    if (Object.keys(errs).length) { setResult(null); return; }
    const input = Object.fromEntries(fields.map((f) => [f.k, Number(v[f.k])])) as ReadinessInput;
    const r = assessReadiness(input);
    setResult(r);
    saveReadiness({ outcome: r.outcome, spare: r.spare });
  }

  return (
    <div>
      <PageTitle step="Step 1 of 3" title="Money readiness check" sub="Five numbers. An honest, explainable answer." />
      <form onSubmit={submit} noValidate className="space-y-4">
        {fields.map((f) => (
          <div key={f.k}>
            <label htmlFor={f.k} className="block font-medium">{f.label}</label>
            <p className="mb-1.5 text-sm text-muted-foreground">{f.hint}</p>
            <div className="relative">
              {f.prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{f.prefix}</span>}
              <input
                id={f.k} inputMode="decimal" type="number" min={0}
                className={`field ${f.prefix ? "pl-8" : ""}`}
                value={v[f.k] ?? ""}
                aria-invalid={!!errors[f.k]}
                aria-describedby={errors[f.k] ? `${f.k}-err` : undefined}
                onChange={(e) => setV({ ...v, [f.k]: e.target.value })}
              />
            </div>
            {errors[f.k] && <p id={`${f.k}-err`} className="mt-1 text-sm text-destructive">{errors[f.k]}</p>}
          </div>
        ))}
        <button type="submit" className="btn btn-primary w-full">Check my readiness</button>
        <Link to="/flex-sip" className="btn w-full text-primary">Skip and explore the planner</Link>
      </form>

      {result && (() => {
        const m = meta[result.outcome];
        return (
          <section aria-live="polite" className="card mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${m.tone}`}><m.icon className="h-5 w-5" /></span>
              <div><p className="text-xs text-muted-foreground">Your result</p><h2 className="text-xl font-bold">{m.title}</h2></div>
            </div>
            <p className="text-sm">Left each month after expenses & EMIs: <strong>{inr(result.spare)}</strong></p>
            <div>
              <p className="mb-1 text-sm font-semibold">Why</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
            <p className="rounded-xl bg-muted p-3 text-sm"><strong>Next step:</strong> {m.next}</p>
            <Link to="/flex-sip" className="btn btn-primary w-full">Continue to Flex SIP <ArrowRight className="h-4 w-4" /></Link>
            <p className="text-xs text-muted-foreground">Prototype categories based on simple rules — not certified financial advice.</p>
          </section>
        );
      })()}
    </div>
  );
}
