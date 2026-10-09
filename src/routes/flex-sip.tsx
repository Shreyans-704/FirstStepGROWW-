import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, Lock, Plus } from "lucide-react";
import { PageTitle, SimLabel, StatusPill } from "@/components/Shell";
import { PauseControls } from "@/components/PauseControls";
import {
  MIN_BASE,
  addMonths,
  fmtDate,
  inr,
  nextContributionDate,
  nextScheduled,
  planTotal,
  reduceToBase,
  type Plan,
} from "@/lib/firststep";
import { loadReadiness, usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/flex-sip")({
  head: () => ({
    meta: [
      { title: "Flex SIP Builder — First Step" },
      {
        name: "description",
        content: "Set a ₹500+ base, add an optional top-up and simulate pausing for 1–3 months.",
      },
      { property: "og:title", content: "Flex SIP Builder — First Step" },
      {
        property: "og:description",
        content: "A flexible SIP plan for irregular income. Simulated prototype.",
      },
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
  const [justResumed, setJustResumed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (plan) {
      setBase(plan.base);
      setOptional(plan.optional);
    }
    const readiness = loadReadiness();
    setTiny(readiness !== null && readiness.outcome !== "ready");
  }, [loaded, plan]);

  // Draft merged into the saved plan so pausing never discards unsaved edits.
  const effectivePlan: Plan | null = plan ? { ...plan, base, optional } : null;
  const isDirty = plan
    ? base !== plan.base || optional !== plan.optional
    : base !== MIN_BASE || optional !== 0;
  const draftTotal = base + optional;
  const today = new Date();
  const nextDate = effectivePlan
    ? nextScheduled(effectivePlan, today)
    : nextContributionDate(today);

  function savePlan() {
    const next: Plan = plan
      ? { ...plan, base, optional }
      : {
          base,
          optional,
          status: "active",
          pauseMonths: null,
          resumeDate: null,
          createdAt: new Date().toISOString(),
        };
    if (save(next)) setSaved(true);
  }

  function handleStatusChange(next: Plan) {
    const wasPaused = effectivePlan?.status === "paused";
    const isActive = next.status === "active";
    setJustResumed(wasPaused && isActive);
    setSaved(false);
    setBase(next.base);
    setOptional(next.optional);
    save(next);
  }

  function handleReduceToBase() {
    if (!plan) return;
    const next = reduceToBase({ ...plan, base, optional });
    setJustResumed(false);
    setSaved(false);
    setOptional(0);
    setBase(next.base);
    save(next);
  }

  if (!loaded) return <p className="text-muted-foreground">Loading your plan…</p>;

  const status: "active" | "paused" = effectivePlan?.status ?? "active";
  const showResumed = justResumed && status === "active" && !!plan;

  return (
    <div className="space-y-5">
      <PageTitle
        step="Step 2 of 3"
        title="Flex SIP builder"
        sub="A base you always keep. A top-up only when the month allows."
      />
      {tiny && (
        <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
          Your readiness check suggested starting small. Consider the ₹500 base with no top-up.
        </p>
      )}

      {showResumed && (
        <section aria-live="polite" className="card space-y-1 border-primary/40 bg-primary-soft/40">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Check className="h-4 w-4" /> Plan resumed — active again
          </p>
          <p className="text-sm text-muted-foreground">
            Next contribution on <strong className="text-foreground">{fmtDate(nextDate)}</strong>{" "}
            for{" "}
            <strong className="text-foreground">{inr(plan ? planTotal(plan) : draftTotal)}</strong>.
          </p>
        </section>
      )}

      <section className="card space-y-4" aria-label="Plan overview">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Your Flex SIP</p>
            <p className="truncate text-sm font-medium text-muted-foreground">
              {plan
                ? `Saved ${plan.createdAt ? fmtDate(new Date(plan.createdAt)) : "plan"}`
                : "Not saved yet — draft"}
            </p>
          </div>
          {plan && effectivePlan ? (
            <StatusPill status={showResumed ? "resumed" : effectivePlan.status} />
          ) : (
            <SimLabel>Draft</SimLabel>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {plan ? "Total planned per month" : "Planned monthly contribution"}
          </p>
          <p aria-live="polite" className="font-display text-4xl font-bold leading-tight">
            {inr(plan ? planTotal(plan) : draftTotal)}
            <span className="text-base font-normal text-muted-foreground"> /month</span>
          </p>
          {isDirty && plan && (
            <p className="mt-1 text-xs font-medium text-warning">
              Unsaved edits: draft {inr(draftTotal)} · saved {inr(planTotal(plan))}. Saving or
              pausing keeps your edits.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-primary/25 bg-secondary p-3">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" /> Base · fixed
            </p>
            <p className="mt-1 text-lg font-bold">{inr(base)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Always contributed · min {inr(MIN_BASE)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary p-3">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Plus className="h-3.5 w-3.5 text-primary" /> Top-up · optional
            </p>
            <p className="mt-1 text-lg font-bold">{optional ? `+${inr(optional)}` : "None"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Only in good months</p>
          </div>
        </div>

        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            {status === "paused" && effectivePlan?.resumeDate ? (
              <>
                Paused — next contribution expected on{" "}
                <strong className="text-foreground">{fmtDate(nextDate)}</strong>.
              </>
            ) : (
              <>
                Next contribution on{" "}
                <strong className="text-foreground">{fmtDate(nextDate)}</strong>.
              </>
            )}
          </span>
        </p>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-bold">Base contribution</h2>
          <p className="text-sm text-muted-foreground">
            The amount you commit to every month. Minimum ₹500.
          </p>
        </div>
        <div role="radiogroup" aria-label="Base amount" className="flex flex-wrap gap-2">
          {baseOptions.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={base === b}
              className="chip"
              onClick={() => {
                setBase(b);
                setSaved(false);
                setJustResumed(false);
              }}
            >
              {inr(b)}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <div>
          <h2 className="font-bold">Optional top-up</h2>
          <p className="text-sm text-muted-foreground">
            Extra in good months. You can drop it anytime.
          </p>
        </div>
        <div role="radiogroup" aria-label="Optional amount" className="flex flex-wrap gap-2">
          {optOptions.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={optional === o}
              className="chip"
              onClick={() => {
                setOptional(o);
                setSaved(false);
                setJustResumed(false);
              }}
            >
              {o ? `+${inr(o)}` : "None"}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button type="button" className="btn btn-primary w-full" onClick={savePlan}>
        {saved && !isDirty ? (
          <>
            <Check className="h-4 w-4" /> Plan saved
          </>
        ) : plan ? (
          "Update plan"
        ) : (
          "Save my plan"
        )}
      </button>
      {isDirty && plan && (
        <p className="text-center text-xs text-muted-foreground">
          You have unsaved changes. They are kept if you pause below.
        </p>
      )}

      {effectivePlan && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Pause or resume</h2>
            <SimLabel />
          </div>
          <PauseControls plan={effectivePlan} onChange={handleStatusChange} />
          {effectivePlan.optional > 0 && (
            <button type="button" className="btn btn-outline w-full" onClick={handleReduceToBase}>
              Reduce to base ({inr(effectivePlan.base)})
            </button>
          )}
          <Timeline plan={effectivePlan} today={today} />
          <p className="text-xs text-muted-foreground">
            Simulation only. Pausing or resuming here does not create, pause or resume any real SIP
            mandate on Groww or elsewhere, and executes no investment transaction. Current saved
            plan: {plan ? `${inr(planTotal(plan))}/month` : "none"}.
          </p>
        </section>
      )}
      <div className="flex gap-3">
        <Link to="/risk" className="btn btn-outline flex-1">
          See the risk
        </Link>
        <button
          type="button"
          className="btn btn-primary flex-1"
          disabled={!plan}
          onClick={() => navigate({ to: "/my-plan" })}
        >
          My plan <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Timeline({ plan, today }: { plan: Plan; today: Date }) {
  if (plan.status === "paused" && plan.resumeDate && plan.pauseMonths) {
    const resume = new Date(plan.resumeDate);
    const skipped: Date[] = [];
    for (let i = plan.pauseMonths; i >= 1; i--) skipped.push(addMonths(resume, -i));
    return (
      <div className="rounded-xl border border-border bg-secondary/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Monthly timeline
        </p>
        <ol className="mt-2 space-y-2">
          {skipped.map((d) => (
            <li key={d.toISOString()} className="flex items-center gap-2.5 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-muted-foreground">{fmtDate(d)} — paused, no contribution</span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              <strong>{fmtDate(resume)}</strong> — resume · {inr(planTotal(plan))}
            </span>
          </li>
        </ol>
      </div>
    );
  }
  const first = nextContributionDate(today);
  const upcoming = [first, addMonths(first, 1), addMonths(first, 2)];
  return (
    <div className="rounded-xl border border-border bg-secondary/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Monthly timeline
      </p>
      <ol className="mt-2 space-y-2">
        {upcoming.map((d, i) => (
          <li key={d.toISOString()} className="flex items-center gap-2.5 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span>
              {i === 0 ? (
                <>
                  <strong>{fmtDate(d)}</strong> — next · {inr(planTotal(plan))}
                </>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    {fmtDate(d)} — planned · {inr(planTotal(plan))}
                  </span>
                </>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
