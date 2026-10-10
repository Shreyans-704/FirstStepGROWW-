import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CircleAlert,
  Compass,
  GraduationCap,
  Hourglass,
  Palette,
  Pencil,
  RotateCcw,
  Sprout,
} from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { OUTCOME_META } from "@/lib/affordability";
import { inr } from "@/lib/firststep";
import { loadAssessment, saveAssessment } from "@/lib/usePlan";
import { cn } from "@/lib/utils";
import {
  BUFFER_STATUSES,
  EMPTY_QUICK,
  EXPENSE_RANGES,
  INCOME_RANGES,
  PRIORITIES,
  SITUATIONS,
  findRange,
  quickAssess,
  type BufferStatus,
  type MoneyRange,
  type Priority,
  type QuickAnswers,
  type Situation,
} from "@/lib/quickstart";

const SITUATION_ICONS: Record<Situation, typeof Briefcase> = {
  student: GraduationCap,
  professional: Briefcase,
  freelancer: Palette,
  "between-jobs": Hourglass,
};

const outcomeBadge: Record<string, { icon: typeof Sprout; tile: string; card: string }> = {
  "safety-net": {
    icon: CircleAlert,
    tile: "bg-warning-soft text-warning",
    card: "border-warning/30",
  },
  "small-start": {
    icon: Sprout,
    tile: "bg-[#2DD4BF]/15 text-[#5EEAD4]",
    card: "border-[#2DD4BF]/30",
  },
  "review-plan": {
    icon: Compass,
    tile: "bg-primary text-primary-foreground",
    card: "border-primary/30",
  },
};

function OptionCard({
  selected,
  onSelect,
  label,
  sub,
  icon,
  name,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  sub?: string;
  icon?: typeof Briefcase;
  name: string;
}) {
  const Icon = icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={name}
      onClick={onSelect}
      className={cn(
        "flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/[0.08]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25",
      )}
    >
      {Icon && (
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            selected ? "bg-primary/15 text-primary" : "bg-white/[0.05] text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <span>
        <span className="block text-[15px] font-semibold text-foreground">{label}</span>
        {sub && <span className="mt-0.5 block text-[13px] text-muted-foreground">{sub}</span>}
      </span>
    </button>
  );
}

function RangeGroup({
  legend,
  ranges,
  value,
  onChange,
  extra,
}: {
  legend: string;
  ranges: MoneyRange[];
  value: string | null;
  onChange: (id: string) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={legend} className="grid gap-2.5">
      {ranges.map((r) => (
        <OptionCard
          key={r.id}
          name={r.label}
          label={r.label}
          sub={r.sub}
          selected={value === r.id}
          onSelect={() => onChange(r.id)}
        />
      ))}
      {extra}
    </div>
  );
}

export function QuickStart({
  onRefine,
  onEnterDetail,
}: {
  onRefine: (q: QuickAnswers) => void;
  onEnterDetail: () => void;
}) {
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<QuickAnswers>(EMPTY_QUICK);
  const [error, setError] = useState<string | null>(null);

  // Returning users with a saved quick check land back on their result.
  useEffect(() => {
    const saved = loadAssessment();
    if (saved?.source === "quick" && saved.quick) {
      setAnswers(saved.quick);
      setScreen(4);
    }
  }, []);

  useEffect(() => {
    setError(null);
  }, [screen]);

  const result = useMemo(() => (screen === 4 ? quickAssess(answers) : null), [screen, answers]);

  // Persist the quick result for My Plan recap and later refinement.
  useEffect(() => {
    if (!result || !result.repInput) return;
    saveAssessment({
      input: result.repInput,
      outcome: result.outcome,
      scenarios: [],
      goalTarget: null,
      goalSaved: 0,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
      source: "quick",
      quick: answers,
    });
  }, [result, answers]);

  function next() {
    if (screen === 1 && !answers.situation) {
      setError("Pick the option that fits best — you can change it later.");
      return;
    }
    if (screen === 2 && !answers.incomeRange) {
      setError("Choose an income range, or “It varies every month”.");
      return;
    }
    if (screen === 3) {
      if (!answers.priority) {
        setError("Choose your top priority so we can point you the right way.");
        return;
      }
      if (!answers.buffer) {
        setError("Choose your savings status — “Not sure” is a valid answer.");
        return;
      }
    }
    setScreen(screen + 1);
  }

  function startOver() {
    try {
      localStorage.removeItem("firststep.assessment.v1");
    } catch {
      // Storage unavailable — in-memory reset still works.
    }
    setAnswers(EMPTY_QUICK);
    setScreen(0);
  }

  const style = result ? outcomeBadge[result.outcome] : null;
  const OutcomeIcon = style?.icon ?? Sprout;
  const meta = result ? OUTCOME_META[result.outcome] : null;
  const incomeLabel = findRange(INCOME_RANGES, answers.incomeRange)?.label;
  const typicalLabel = findRange(INCOME_RANGES, answers.typicalRange)?.label;
  const expenseLabel = findRange(EXPENSE_RANGES, answers.expenseRange)?.label;

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <PageTitle
        step={
          screen === 0
            ? "Quick start"
            : screen < 4
              ? `Step ${screen} of 3 · Quick start`
              : "Your quick result"
        }
        title={screen === 0 ? "Know where you stand, in under a minute." : "Money readiness check"}
        sub={
          screen === 0
            ? "Answer a few taps — no exact numbers needed. You'll get an honest first take, and can sharpen it later."
            : "Tap an option — approximations are fine."
        }
      />

      {screen >= 1 && screen <= 3 && (
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={screen}
          aria-label="Quick start progress"
          className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${(screen / 3) * 100}%` }}
          />
        </div>
      )}

      {screen === 0 && (
        <section aria-label="Welcome" className="card space-y-4">
          <ul className="space-y-3 text-[15px] text-muted-foreground">
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
              />
              <span>
                <strong className="text-foreground">First Step</strong> helps you understand your
                money before investing a rupee.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
              />
              <span>Pick ranges, not exact amounts. Skipping is allowed where marked.</span>
            </li>
            <li className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
              />
              <span>
                No account, no pressure — deciding <em>not</em> to invest yet is a valid outcome.
              </span>
            </li>
          </ul>
          <button type="button" className="btn btn-primary w-full" onClick={() => setScreen(1)}>
            Let&apos;s start <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEnterDetail}
            className="mx-auto block w-fit py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            Prefer exact amounts? Enter the Detailed Plan
          </button>
        </section>
      )}

      {screen === 1 && (
        <section aria-label="Current situation" className="card space-y-4">
          <h2 className="text-lg font-bold">Which best describes you right now?</h2>
          <div role="radiogroup" aria-label="Current situation" className="grid gap-2.5">
            {SITUATIONS.map((s) => (
              <OptionCard
                key={s.id}
                name={s.label}
                label={s.label}
                sub={s.sub}
                icon={SITUATION_ICONS[s.id]}
                selected={answers.situation === s.id}
                onSelect={() => setAnswers({ ...answers, situation: s.id })}
              />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" className="btn btn-outline flex-1" onClick={() => setScreen(0)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" className="btn btn-primary flex-[2]" onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {screen === 2 && (
        <section aria-label="Monthly income" className="card space-y-4">
          <h2 className="text-lg font-bold">Roughly how much comes in each month?</h2>
          <p className="text-sm text-muted-foreground">
            A range is enough — we plan using the lower end so estimates stay cautious.
          </p>
          <RangeGroup
            legend="Monthly income range"
            ranges={INCOME_RANGES}
            value={answers.incomeRange}
            onChange={(id) =>
              setAnswers({
                ...answers,
                incomeRange: id,
                typicalRange: id === "varies" ? answers.typicalRange : null,
              })
            }
          />
          {answers.incomeRange === "varies" && (
            <div className="rounded-xl border border-white/10 p-3.5">
              <p className="text-sm font-semibold">
                What&apos;s a typical month?{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </p>
              <div className="mt-2 grid gap-2">
                {INCOME_RANGES.filter((r) => r.id !== "varies").map((r) => (
                  <OptionCard
                    key={r.id}
                    name={`Typical: ${r.label}`}
                    label={r.label}
                    selected={answers.typicalRange === r.id}
                    onSelect={() => setAnswers({ ...answers, typicalRange: r.id })}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Skip this and we&apos;ll treat income as unknown rather than guessing.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" className="btn btn-outline flex-1" onClick={() => setScreen(1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" className="btn btn-primary flex-[2]" onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {screen === 3 && (
        <section aria-label="Situation and goal" className="card space-y-6">
          <div>
            <h2 className="text-lg font-bold">Roughly how much goes out each month?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Rent, food, transport, bills, fun — one overall range.{" "}
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, expenseRange: null })}
                className="font-semibold text-primary hover:underline"
              >
                Not sure — skip
              </button>
            </p>
            <div className="mt-3">
              <RangeGroup
                legend="Monthly expense range"
                ranges={EXPENSE_RANGES}
                value={answers.expenseRange}
                onChange={(id) => setAnswers({ ...answers, expenseRange: id })}
              />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold">What matters most to you right now?</h2>
            <div role="radiogroup" aria-label="Financial priority" className="mt-3 grid gap-2.5">
              {PRIORITIES.map((p) => (
                <OptionCard
                  key={p.id}
                  name={p.label}
                  label={p.label}
                  sub={p.sub}
                  selected={answers.priority === p.id}
                  onSelect={() => setAnswers({ ...answers, priority: p.id as Priority })}
                />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold">How are your emergency savings?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Savings you could use immediately if income stopped. “Not sure” is fine.
            </p>
            <div
              role="radiogroup"
              aria-label="Emergency savings status"
              className="mt-3 grid gap-2.5"
            >
              {BUFFER_STATUSES.map((b) => (
                <OptionCard
                  key={b.id}
                  name={b.label}
                  label={b.label}
                  sub={b.sub}
                  selected={answers.buffer === b.id}
                  onSelect={() => setAnswers({ ...answers, buffer: b.id as BufferStatus })}
                />
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" className="btn btn-outline flex-1" onClick={() => setScreen(2)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="button" className="btn btn-primary flex-[2]" onClick={next}>
              See my result <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {screen === 4 && result && meta && style && (
        <div className="space-y-6">
          <section aria-live="polite" className={cn("card space-y-4 border", style.card)}>
            <div className="flex items-center gap-3">
              <span className={cn("grid h-11 w-11 place-items-center rounded-xl", style.tile)}>
                <OutcomeIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{meta.eyebrow} · Approximate</p>
                <h2 className="text-xl font-bold">{meta.title}</h2>
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4 text-sm">
              <p className="text-muted-foreground">
                {incomeLabel ? (
                  <>
                    Income around{" "}
                    <strong className="text-foreground">{incomeLabel.toLowerCase()}</strong>
                  </>
                ) : (
                  <>
                    Income <strong className="text-foreground">not estimated</strong>
                  </>
                )}
                {answers.incomeRange === "varies" &&
                  (typicalLabel ? (
                    <>, typically {typicalLabel.toLowerCase()}</>
                  ) : (
                    <>, varies month to month</>
                  ))}
                {" · "}
                {expenseLabel ? (
                  <>
                    spending around{" "}
                    <strong className="text-foreground">{expenseLabel.toLowerCase()}</strong>
                  </>
                ) : (
                  <>
                    spending <strong className="text-foreground">not estimated</strong>
                  </>
                )}
              </p>
              {result.snapshot ? (
                <p className="mt-1 font-display text-2xl font-bold text-foreground">
                  {inr(Math.max(0, result.snapshot.remaining))}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    /month rough room, at cautious ends
                  </span>
                </p>
              ) : (
                <p className="mt-1 font-semibold text-foreground">
                  Monthly room couldn&apos;t be estimated from these answers.
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Why this result</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            {result.uncertainties.length > 0 && (
              <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3 text-sm">
                <p className="font-semibold text-warning">What&apos;s still uncertain</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.uncertainties.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="font-semibold text-primary">What this tells you</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.canInfer.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="font-semibold">What it can&apos;t tell you</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.cannotInfer.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            {result.neededInfo.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">To sharpen this:</strong>{" "}
                {result.neededInfo.join(" ")}
              </p>
            )}
          </section>

          <section aria-label="Your next step" className="card space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Your one next step
            </p>
            <h3 className="font-display text-xl font-bold">{result.primaryStep.title}</h3>
            <p className="text-sm text-muted-foreground">{result.primaryStep.blurb}</p>
            <Link
              to={result.primaryStep.to}
              {...(result.primaryStep.hash ? { hash: result.primaryStep.hash } : {})}
              className="btn btn-primary w-full"
            >
              {result.primaryStep.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="btn btn-outline w-full"
              onClick={() => onRefine(answers)}
            >
              <Pencil className="h-4 w-4" /> Refine with exact amounts
            </button>
            <Link
              to="/risk"
              hash="knowledge-hub"
              className="mx-auto flex w-fit items-center gap-1.5 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <BookOpen className="h-4 w-4" /> Explore learning content
            </Link>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-outline w-full" onClick={() => setScreen(3)}>
              <ArrowLeft className="h-4 w-4" /> Edit answers
            </button>
            <button type="button" className="btn btn-outline w-full" onClick={startOver}>
              <RotateCcw className="h-4 w-4" /> Start over
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Approximate result from ranges — saved on this device only. Educational guidance, not
            financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
