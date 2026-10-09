import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { GrowthChart, GROWTH_SCENARIOS } from "@/components/landing/GrowthChart";
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
const falls = [10, 20, 35];

const quiz = [
  {
    q: "Your ₹12,000 invested shows ₹9,600 after a fall. What happened?",
    options: [
      "You lost ₹2,400 permanently",
      "The current value is ₹2,400 lower; it's a loss only if you sell now",
      "The app made a mistake",
    ],
    answer: 1,
  },
  {
    q: "Which is true about market-linked funds?",
    options: [
      "Returns are guaranteed after 3 years",
      "Value can fall below what you invested",
      "A SIP removes all risk",
    ],
    answer: 1,
  },
];

function Risk() {
  const [amt, setAmt] = useState(1000);
  const [yrs, setYrs] = useState(3);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const [checked, setChecked] = useState(false);
  const invested = amt * 12 * yrs;
  const scenarios = GROWTH_SCENARIOS.map((s) => ({
    ...s,
    ...sipProjection(amt, s.rate, yrs, "end"),
  }));
  const maxValue = Math.max(...scenarios.map((s) => s.value), 1);
  const score = answers.filter((a, i) => a === quiz[i]?.answer).length;

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
                className="space-y-3 rounded-2xl border border-white/10 bg-surface/70 p-5"
              >
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label} · {s.rate}% p.a. assumed
                </p>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated ending value</p>
                  <p className="font-display text-[28px] font-bold leading-tight text-foreground">
                    {inr(s.value)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    +{inr(s.value - s.invested)}{" "}
                    <span className="font-normal text-muted-foreground">hypothetical gain</span>
                  </p>
                </div>
                <div className="space-y-1.5" aria-hidden="true">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-muted-foreground/60"
                      style={{ width: `${(s.invested / maxValue) * 100}%` }}
                    />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(s.value / maxValue) * 100}%`, background: s.color }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">You put in {inr(s.invested)}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            4%, 8% and 12% are hypothetical assumptions for comparison — not predictions or expected
            returns. Contributions assumed at the end of each month.
          </p>
        </section>

        <section className="card space-y-3" aria-label="Growth sketch">
          <h2 className="font-bold">Growth sketch</h2>
          <GrowthChart monthly={amt} years={yrs} />
          <p className="text-xs text-muted-foreground">
            Hypothetical monthly compounding at the assumed rates. Real growth is uneven and can be
            negative.
          </p>
        </section>

        <section className="card space-y-3" aria-label="What the numbers mean">
          <h2 className="font-bold">What these numbers actually mean</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Your contributions</strong> are the money you put
              in — {inr(invested)} here. That part is fully in your control.
            </li>
            <li>
              <strong className="text-foreground">Investment growth</strong> is the hypothetical
              gain beyond your contributions. It exists only on paper until you sell.
            </li>
            <li>Actual returns fluctuate year to year and can be negative.</li>
            <li>Assuming a higher return never makes it guaranteed.</li>
            <li>Inflation, fees, taxes and market volatility all eat into actual outcomes.</li>
          </ul>
          <p className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3 text-sm">
            <strong>Illustrative calculations only.</strong> Actual investment returns may be higher
            or lower, including losses. These scenarios are not forecasts or investment advice.
          </p>
        </section>

        <section className="card space-y-3" aria-label="Risk reminder">
          <h2 className="font-bold">But remember: growth isn&apos;t guaranteed.</h2>
          <p className="text-sm text-muted-foreground">
            Markets fall, sometimes hard and without warning. The same contributions above could be
            worth less than you put in. That possibility is the price of chasing growth.
          </p>
          <details className="group rounded-2xl border border-white/10 bg-white/[0.02] px-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-left text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              Explore what happens when markets fall.
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <ul className="space-y-2 pb-4">
              {falls.map((f) => {
                const shown = invested * (1 - f / 100);
                return (
                  <li key={f} className="rounded-xl border p-3">
                    <div className="flex justify-between text-sm">
                      <span>{f}% fall</span>
                      <span className="font-semibold text-destructive">
                        −{inr(invested - shown)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-destructive" style={{ width: `${f}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your {inr(invested)} could show as{" "}
                      <strong className="text-foreground">{inr(shown)}</strong>.
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="px-0 pb-4 text-xs text-muted-foreground">
              Hypothetical falls applied to the amount you put in. Not a prediction of returns,
              losses, or recovery — there is no guarantee of recovery.
            </p>
          </details>
        </section>

        <section className="card space-y-4">
          <h2 className="font-bold">Quick check</h2>
          {quiz.map((item, qi) => (
            <fieldset key={qi} className="space-y-2">
              <legend className="mb-2 text-sm font-medium">
                {qi + 1}. {item.q}
              </legend>
              {item.options.map((o, oi) => {
                const sel = answers[qi] === oi;
                const state = checked
                  ? oi === item.answer
                    ? "border-primary bg-primary-soft"
                    : sel
                      ? "border-destructive bg-destructive-soft"
                      : ""
                  : sel
                    ? "border-primary"
                    : "";
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${state}`}
                  >
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="mt-0.5 accent-[var(--color-primary)]"
                      checked={sel}
                      onChange={() => {
                        const n = [...answers];
                        n[qi] = oi;
                        setAnswers(n);
                        setChecked(false);
                      }}
                    />
                    {o}
                  </label>
                );
              })}
            </fieldset>
          ))}
          <button
            className="btn btn-primary w-full"
            disabled={answers.includes(null)}
            onClick={() => setChecked(true)}
          >
            Check answers
          </button>
          {checked && (
            <p aria-live="polite" className="text-center font-semibold">
              {score}/2 correct{" "}
              {score === 2 ? "— nicely done." : "— review the highlighted answers."}
            </p>
          )}
        </section>
      </div>
      <KnowledgeHub />
      <LearningLibrary />
    </div>
  );
}
