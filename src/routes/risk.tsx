import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/Shell";
import { GrowthBars, GrowthDonut, GROWTH_SCENARIOS } from "@/components/landing/GrowthCharts";
import { KnowledgeHub } from "@/components/landing/KnowledgeHub";
import { LearningLibrary } from "@/components/landing/LearningLibrary";
import { inr } from "@/lib/firststep";
import { sipProjection } from "@/lib/learn";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Growth Simulator — First Step" },
      {
        name: "description",
        content:
          "See what monthly investments could become under illustrative 4%, 8% and 12% assumptions. Not a forecast.",
      },
      { property: "og:title", content: "Growth Simulator — First Step" },
      {
        property: "og:description",
        content: "Illustrative growth scenarios, downside context and a quick quiz.",
      },
    ],
  }),
  component: Risk,
});

const amounts = [500, 1000, 2000, 5000];
const durations = [1, 3, 5, 10];

function Risk() {
  const [amt, setAmt] = useState(1000);
  const [yrs, setYrs] = useState(3);
  const invested = amt * 12 * yrs;
  const scenarios = GROWTH_SCENARIOS.map((s) => ({
    ...s,
    ...sipProjection(amt, s.rate, yrs, "end"),
  }));

  return (
    <div>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-5 pb-10 pt-24 md:pt-28">
        <PageTitle
          step="Step 3 of 3 · Growth simulator"
          title="See what your money could become."
          sub="Explore how your investments might grow over time. These are illustrative scenarios, not guaranteed returns."
        />

        <section className="card space-y-5" aria-label="Growth inputs">
          <div>
            <p className="mb-2 font-medium">Monthly investment</p>
            <div role="radiogroup" aria-label="Monthly investment" className="flex flex-wrap gap-2">
              {amounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={amt === a}
                  className="chip"
                  onClick={() => setAmt(a)}
                >
                  {inr(a)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-medium">Investment duration</p>
            <div
              role="radiogroup"
              aria-label="Investment duration"
              className="flex flex-wrap gap-2"
            >
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={yrs === d}
                  className="chip"
                  onClick={() => setYrs(d)}
                >
                  {d} yr{d > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            Total contributions: <strong className="text-foreground">{inr(invested)}</strong> (
            {inr(amt)}/month × {yrs * 12} months)
          </p>
        </section>

        <section aria-label="Growth scenarios">
          <div className="grid gap-3 sm:grid-cols-3" aria-live="polite">
            {scenarios.map((s) => (
              <article
                key={s.label}
                aria-label={`${s.label} scenario at ${s.rate} percent assumed annual return`}
                className={
                  s.rate === 8
                    ? "space-y-2 rounded-2xl border border-primary/40 bg-surface/70 p-5"
                    : "space-y-2 rounded-2xl border border-white/10 bg-surface/70 p-5"
                }
              >
                <p className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.label}
                  </span>
                  {s.rate === 8 && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-primary">
                      Reference
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.rate}% assumed annual return</p>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated value</p>
                  <p className="font-display text-[28px] font-bold leading-tight text-foreground">
                    {inr(s.value)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  You contribute: <strong className="text-foreground">{inr(s.invested)}</strong>
                </p>
                <p className="text-sm font-semibold text-primary">
                  Illustrative growth: +{inr(s.value - s.invested)}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            4%, 8% and 12% are hypothetical assumptions for comparison — not predictions or expected
            returns. Contributions assumed at the end of each month.
          </p>
        </section>

        <GrowthBars monthly={amt} years={yrs} />
        <GrowthDonut monthly={amt} years={yrs} />
      </div>
      <KnowledgeHub />
      <LearningLibrary />
    </div>
  );
}
