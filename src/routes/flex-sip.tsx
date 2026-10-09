import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PageTitle, SimLabel } from "@/components/Shell";
import { PauseControls } from "@/components/PauseControls";
import { MIN_BASE, inr, planTotal, reduceToBase, type Plan } from "@/lib/firststep";
import { loadReadiness, usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/flex-sip")({
  head: () => ({
    meta: [
      { title: "Flex SIP Builder — First Step" },
      { name: "description", content: "Set a ₹500+ base, add an optional top-up and simulate pausing for 1–3 months." },
      { property: "og:title", content: "Flex SIP Builder — First Step" },
      { property: "og:description", content: "A flexible SIP plan for irregular income. Simulated prototype." },
    ],
  }),
  component: FlexSip,
});

const baseOptions = [500, 1000, 2000, 3000, 5000];
const optOptions = [0, 500, 1000, 2000];

function FlexSip() {
  const { plan, loaded, save, error } = usePlan();
  const [base, setBase] = useState(MIN_BASE);
  const [optional, setOptional] = useState(0);
  const [saved, setSaved] = useState(false);
  const [tiny, setTiny] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (plan) { setBase(plan.base); setOptional(plan.optional); }
    setTiny(loadReadiness()?.outcome !== "ready" && loadReadiness() !== null);
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  function savePlan() {
    const next: Plan = plan
      ? { ...plan, base, optional }
      : { base, optional, status: "active", pauseMonths: null, resumeDate: null, createdAt: new Date().toISOString() };
    if (save(next)) setSaved(true);
  }

  if (!loaded) return <p className="text-muted-foreground">Loading your plan…</p>;

  return (
    <div className="space-y-5">
      <PageTitle step="Step 2 of 3" title="Flex SIP builder" sub="A base you always keep. A top-up only when the month allows." />
      {tiny && <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Your readiness check suggested starting small. Consider the ₹500 base with no top-up.</p>}

      <section className="card space-y-3">
        <div><h2 className="font-bold">Base contribution</h2><p className="text-sm text-muted-foreground">The amount you commit to every month. Minimum ₹500.</p></div>
        <div role="radiogroup" aria-label="Base amount" className="flex flex-wrap gap-2">
          {baseOptions.map((b) => <button key={b} role="radio" aria-checked={base === b} className="chip" onClick={() => { setBase(b); setSaved(false); }}>{inr(b)}</button>)}
        </div>
      </section>

      <section className="card space-y-3">
        <div><h2 className="font-bold">Optional top-up</h2><p className="text-sm text-muted-foreground">Extra in good months. You can drop it anytime.</p></div>
        <div role="radiogroup" aria-label="Optional amount" className="flex flex-wrap gap-2">
          {optOptions.map((o) => <button key={o} role="radio" aria-checked={optional === o} className="chip" onClick={() => { setOptional(o); setSaved(false); }}>{o ? `+${inr(o)}` : "None"}</button>)}
        </div>
      </section>

      <section className="card bg-primary-soft">
        <p className="text-sm text-accent-foreground">Planned monthly contribution</p>
        <p className="font-display text-3xl font-bold">{inr(base + optional)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-background p-2.5"><p className="text-muted-foreground">Base · fixed</p><p className="font-semibold">{inr(base)}</p></div>
          <div className="rounded-lg bg-background p-2.5"><p className="text-muted-foreground">Top-up · optional</p><p className="font-semibold">{inr(optional)}</p></div>
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button className="btn btn-primary w-full" onClick={savePlan}>{saved ? <><Check className="h-4 w-4" /> Plan saved</> : plan ? "Update plan" : "Save my plan"}</button>

      {plan && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-bold">Life happens</h2><SimLabel /></div>
          <PauseControls plan={plan} onChange={(p) => save(p)} />
          {plan.optional > 0 && (
            <button className="btn btn-outline w-full" onClick={() => { save(reduceToBase(plan)); setOptional(0); }}>
              Reduce to base ({inr(plan.base)})
            </button>
          )}
          <p className="text-xs text-muted-foreground">Simulation only. This does not create, pause or resume any real SIP mandate on Groww or elsewhere. Current saved plan: {inr(planTotal(plan))}/month.</p>
        </section>
      )}
      <div className="flex gap-3">
        <Link to="/risk" className="btn btn-outline flex-1">See the risk</Link>
        <button className="btn btn-primary flex-1" disabled={!plan} onClick={() => navigate({ to: "/my-plan" })}>My plan <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
