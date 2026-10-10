import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Compass,
  PiggyBank,
  RotateCcw,
  Sprout,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageTitle } from "@/components/Shell";
import {
  HORIZON_OPTIONS,
  OUTCOME_META,
  classifyOutcome,
  defaultScenarios,
  horizonFromOption,
  parseAmount,
  planGoal,
  scenarioSnapshots,
  validateContextStep,
  validateExpensesStep,
  validateIncomeStep,
  validateSafetyStep,
  type AffordabilityOutcome,
  type AssessmentInput,
  type FieldErrors,
  type RawContext,
  type RawExpenses,
  type RawIncome,
  type RawSafety,
} from "@/lib/affordability";
import { inr } from "@/lib/firststep";
import { loadAssessment, saveAssessment } from "@/lib/usePlan";
import { cn } from "@/lib/utils";
import { QuickStart } from "@/components/readiness/QuickStart";
import { quickToDetailPrefill, type QuickAnswers } from "@/lib/quickstart";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "Money Readiness Check — First Step" },
      {
        name: "description",
        content:
          "A guided check: income, expenses, safety net and goals — then an honest, explainable answer about what you can afford.",
      },
      { property: "og:title", content: "Money Readiness Check — First Step" },
      {
        property: "og:description",
        content: "Can you afford to start investing? Answer step by step.",
      },
    ],
  }),
  component: Readiness,
});

const STEPS = ["Income", "Expenses", "Safety net", "Context", "Your result"] as const;

const outcomeStyle: Record<
  AffordabilityOutcome,
  { icon: typeof Sprout; tile: string; card: string }
> = {
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

function RequiredBadge() {
  return (
    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
      REQUIRED
    </span>
  );
}

function OptionalBadge() {
  return (
    <span className="ml-2 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground">
      OPTIONAL
    </span>
  );
}

function AmountField({
  id,
  label,
  hint,
  value,
  error,
  optional,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error?: string | undefined;
  optional?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
        {optional ? <OptionalBadge /> : <RequiredBadge />}
      </label>
      <p className="mb-1.5 text-sm text-muted-foreground">{hint}</p>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          ₹
        </span>
        <input
          id={id}
          inputMode="decimal"
          type="number"
          min={0}
          className="field pl-8"
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceChips<T extends string>({
  label,
  hint,
  options,
  value,
  error,
  optional,
  onChange,
  groupLabel,
}: {
  label: string;
  hint: string;
  options: { value: T; label: string; sub?: string }[];
  value: T | "";
  error?: string | undefined;
  optional?: boolean;
  onChange: (v: T) => void;
  groupLabel: string;
}) {
  return (
    <div>
      <p className="font-medium">
        {label}
        {optional ? <OptionalBadge /> : <RequiredBadge />}
      </p>
      <p className="mb-1.5 text-sm text-muted-foreground">{hint}</p>
      <div role="radiogroup" aria-label={groupLabel} className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl border p-3.5 text-left transition-all",
              value === o.value
                ? "border-primary bg-primary/[0.08]"
                : "border-white/10 bg-white/[0.02] hover:border-white/25",
            )}
          >
            <span className="text-sm font-semibold text-foreground">{o.label}</span>
            {o.sub && (
              <span className="mt-0.5 block text-[13px] text-muted-foreground">{o.sub}</span>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Readiness() {
  const [mode, setMode] = useState<"quick" | "detail">("quick");
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState<RawIncome>({});
  const [expenses, setExpenses] = useState<RawExpenses>({});
  const [safety, setSafety] = useState<RawSafety>({});
  const [context, setContext] = useState<RawContext>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<ReturnType<typeof classifyOutcome> | null>(null);
  const [scenarios, setScenarios] = useState<{ label: string; income: number }[]>([]);
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("0");
  const [goalMonths, setGoalMonths] = useState("12");
  const [restored, setRestored] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  // Scenario I: returning users pick up where they left off.
  // Detailed records restore the full planner; quick (range-based)
  // records reopen the Quick Start result, which restores itself.
  useEffect(() => {
    const saved = loadAssessment();
    if (!saved || saved.source === "quick") return;
    const inp = saved.input;
    setIncome({
      baseIncome: String(inp.baseIncome),
      additionalIncome: inp.additionalIncome ? String(inp.additionalIncome) : "",
      incomeType: inp.incomeType,
    });
    setExpenses({
      essential: String(inp.essential),
      discretionary: String(inp.discretionary),
      emi: String(inp.emi),
      upcoming: inp.upcoming ? String(inp.upcoming) : "",
    });
    setSafety({
      emergencySavings: String(inp.emergencySavings),
      hasEmergencyFund: inp.hasEmergencyFund ? "yes" : "no",
      savingsGoalTarget: inp.savingsGoalTarget !== null ? String(inp.savingsGoalTarget) : "",
    });
    setContext({
      goal: inp.goal,
      horizonYears: inp.horizonYears !== null ? String(inp.horizonYears) : "",
      needSoon: inp.needSoon ? "yes" : "no",
      familiarity: inp.familiarity,
    });
    setResult(classifyOutcome(inp));
    setScenarios(saved.scenarios.length ? saved.scenarios : defaultScenarios(inp));
    setGoalTarget(saved.goalTarget !== null ? String(saved.goalTarget) : "");
    setGoalSaved(String(saved.goalSaved));
    setGoalMonths(String(saved.goalMonths));
    setStep(4);
    setRestored(true);
    setMode("detail");
  }, []);

  useEffect(() => {
    if (typeof topRef.current?.scrollIntoView === "function") {
      topRef.current.scrollIntoView({ block: "start" });
    }
  }, [step]);

  function buildInput(): AssessmentInput | null {
    const baseIncome = parseAmount(income.baseIncome);
    const essential = parseAmount(expenses.essential);
    const discretionary = parseAmount(expenses.discretionary);
    const emi = parseAmount(expenses.emi);
    const emergencySavings = parseAmount(safety.emergencySavings);
    const horizonYears =
      context.horizonYears === undefined || context.horizonYears === ""
        ? null
        : horizonFromOption(context.horizonYears);
    if (
      baseIncome === null ||
      essential === null ||
      discretionary === null ||
      emi === null ||
      emergencySavings === null ||
      horizonYears === null
    ) {
      return null;
    }
    return {
      baseIncome,
      additionalIncome: parseAmount(income.additionalIncome) ?? 0,
      incomeType:
        income.incomeType === "variable" || income.incomeType === "irregular"
          ? income.incomeType
          : "fixed",
      essential,
      discretionary,
      emi,
      upcoming: parseAmount(expenses.upcoming) ?? 0,
      emergencySavings,
      hasEmergencyFund: safety.hasEmergencyFund === "yes",
      savingsGoalTarget: parseAmount(safety.savingsGoalTarget),
      goal: (context.goal ?? "").trim(),
      horizonYears,
      needSoon: context.needSoon === "yes",
      familiarity:
        context.familiarity === "some" || context.familiarity === "confident"
          ? context.familiarity
          : "beginner",
    };
  }

  function persist(input: AssessmentInput, outcome: ReturnType<typeof classifyOutcome>["outcome"]) {
    const sc = scenarios.length ? scenarios : defaultScenarios(input);
    if (!scenarios.length) setScenarios(sc);
    const gt = goalTarget.trim() === "" ? input.savingsGoalTarget : parseAmount(goalTarget);
    saveAssessment({
      input,
      outcome,
      scenarios: sc,
      goalTarget: gt,
      goalSaved: parseAmount(goalSaved) ?? 0,
      goalMonths: parseAmount(goalMonths) ?? 12,
      savedAt: new Date().toISOString(),
      source: "detailed",
    });
  }

  /** Move from Quick Start to the Detailed Plan, carrying answers over — no re-entry. */
  function handleRefine(q: QuickAnswers) {
    const prefill = quickToDetailPrefill(q);
    setIncome({
      baseIncome: prefill.income.baseIncome ?? "",
      additionalIncome: "",
      incomeType: prefill.income.incomeType ?? "fixed",
    });
    setExpenses({
      essential: prefill.expenses.essential ?? "",
      discretionary: "",
      emi: "",
      upcoming: "",
    });
    setSafety({
      emergencySavings: prefill.safety.emergencySavings ?? "",
      hasEmergencyFund: prefill.safety.hasEmergencyFund ?? "",
      savingsGoalTarget: "",
    });
    setContext({});
    setErrors({});
    setResult(null);
    setScenarios([]);
    setGoalTarget("");
    setGoalSaved("0");
    setGoalMonths("12");
    setRestored(false);
    setStep(0);
    setMode("detail");
  }

  function next() {
    let errs: FieldErrors = {};
    if (step === 0) {
      errs = validateIncomeStep(income);
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep(1);
    } else if (step === 1) {
      errs = validateExpensesStep(expenses);
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep(2);
    } else if (step === 2) {
      errs = validateSafetyStep(safety);
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep(3);
    } else if (step === 3) {
      errs = validateContextStep(context);
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;
      const input = buildInput();
      if (!input) return;
      const r = classifyOutcome(input);
      setResult(r);
      setScenarios(defaultScenarios(input));
      if (goalTarget.trim() === "" && input.savingsGoalTarget !== null) {
        setGoalTarget(String(input.savingsGoalTarget));
      }
      persist(input, r.outcome);
      setRestored(false);
      setStep(4);
    }
  }

  function startOver() {
    try {
      localStorage.removeItem("firststep.assessment.v1");
    } catch {
      // Storage unavailable — in-memory reset still works.
    }
    setIncome({});
    setExpenses({});
    setSafety({});
    setContext({});
    setErrors({});
    setResult(null);
    setScenarios([]);
    setGoalTarget("");
    setGoalSaved("0");
    setGoalMonths("12");
    setRestored(false);
    setStep(0);
    setMode("quick");
  }

  const scenarioRows = useMemo(() => {
    const input = buildInput();
    if (!input || !result) return [];
    return scenarioSnapshots(input, scenarios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios, result]);

  const goal = useMemo(() => {
    if (!result) return null;
    const target = parseAmount(goalTarget);
    const saved = parseAmount(goalSaved) ?? 0;
    const months = parseAmount(goalMonths);
    if (target === null || target <= 0 || months === null || months <= 0) return null;
    return planGoal(target, saved, months, Math.max(0, result.snapshot.remaining));
  }, [goalTarget, goalSaved, goalMonths, result]);

  function updateScenario(idx: number, raw: string) {
    const n = parseAmount(raw);
    setScenarios((prev) => {
      const nextSc = prev.map((s, i) => (i === idx ? { ...s, income: n ?? 0 } : s));
      const input = buildInput();
      if (input && result) {
        saveAssessment({
          input,
          outcome: result.outcome,
          scenarios: nextSc,
          goalTarget: parseAmount(goalTarget),
          goalSaved: parseAmount(goalSaved) ?? 0,
          goalMonths: parseAmount(goalMonths) ?? 12,
          savedAt: new Date().toISOString(),
          source: "detailed",
        });
      }
      return nextSc;
    });
  }

  const meta = result ? OUTCOME_META[result.outcome] : null;
  const style = result ? outcomeStyle[result.outcome] : null;
  const OutcomeIcon = style?.icon ?? Sprout;

  return (
    <div ref={topRef} className="mx-auto w-full max-w-[720px] scroll-mt-24">
      {mode === "quick" ? (
        <QuickStart onRefine={handleRefine} onEnterDetail={() => setMode("detail")} />
      ) : (
        <>
          <PageTitle
            step={`Step ${Math.min(step + 1, 5)} of 5 · ${STEPS[step]}`}
            title="Money readiness check"
            sub="Five short steps. An honest, explainable answer about what you can afford."
          />

          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={Math.min(step + 1, 5)}
            aria-label="Assessment progress"
            className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${(Math.min(step + 1, 5) / 5) * 100}%` }}
            />
          </div>

          {restored && step === 4 && (
            <p className="mb-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
              Welcome back — this is your saved check. Edit your answers below anytime.
            </p>
          )}

          {step === 0 && (
            <section aria-label="Income" className="card space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">What comes in?</h2>
                  <p className="text-sm text-muted-foreground">
                    Salary, stipend, allowance or freelance pay.
                  </p>
                </div>
              </div>
              <AmountField
                id="baseIncome"
                label="Monthly income"
                hint="Your main take-home pay in a typical month. Enter 0 only if you truly earn nothing right now."
                value={income.baseIncome ?? ""}
                error={errors.baseIncome}
                onChange={(v) => setIncome({ ...income, baseIncome: v })}
              />
              <ChoiceChips
                label="How does your income usually behave?"
                hint="Fixed means nearly the same every month. Variable means it shifts. Irregular means some months may be near zero."
                groupLabel="Income pattern"
                value={(income.incomeType as "fixed" | "variable" | "irregular" | "") ?? ""}
                error={errors.incomeType}
                onChange={(v) => setIncome({ ...income, incomeType: v })}
                options={[
                  { value: "fixed", label: "Fixed", sub: "Salary or stipend, same most months." },
                  {
                    value: "variable",
                    label: "Variable",
                    sub: "Changes month to month, rarely zero.",
                  },
                  {
                    value: "irregular",
                    label: "Irregular",
                    sub: "Freelance, gigs or allowance — some months may be near zero.",
                  },
                ]}
              />
              <AmountField
                id="additionalIncome"
                label="Additional monthly income"
                hint="Side gigs, family support, interest — anything on top of the main amount."
                value={income.additionalIncome ?? ""}
                error={errors.additionalIncome}
                optional
                onChange={(v) => setIncome({ ...income, additionalIncome: v })}
              />
            </section>
          )}

          {step === 1 && (
            <section aria-label="Expenses" className="card space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">What goes out?</h2>
                  <p className="text-sm text-muted-foreground">
                    Be honest — this check only works with real numbers.
                  </p>
                </div>
              </div>
              <AmountField
                id="essential"
                label="Essential monthly expenses"
                hint="Rent, food, transport, bills, fees — things you cannot skip. Enter 0 only if someone else covers these."
                value={expenses.essential ?? ""}
                error={errors.essential}
                onChange={(v) => setExpenses({ ...expenses, essential: v })}
              />
              <AmountField
                id="discretionary"
                label="Discretionary monthly spending"
                hint="Eating out, shopping, subscriptions, fun money. A rough average is fine — enter 0 if none."
                value={expenses.discretionary ?? ""}
                error={errors.discretionary}
                onChange={(v) => setExpenses({ ...expenses, discretionary: v })}
              />
              <AmountField
                id="emi"
                label="Monthly EMI or debt payments"
                hint="Loan EMIs, credit-card dues you pay monthly, BNPL instalments. Enter 0 if none."
                value={expenses.emi ?? ""}
                error={errors.emi}
                onChange={(v) => setExpenses({ ...expenses, emi: v })}
              />
              <AmountField
                id="upcoming"
                label="Upcoming big expenses (next 12 months)"
                hint="Fees, travel, devices, relocation — one lump sum. We spread it across 12 months so it can be weighed fairly."
                value={expenses.upcoming ?? ""}
                error={errors.upcoming}
                optional
                onChange={(v) => setExpenses({ ...expenses, upcoming: v })}
              />
            </section>
          )}

          {step === 2 && (
            <section aria-label="Safety net" className="card space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <PiggyBank className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">Your safety net</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    An <strong className="text-foreground">emergency fund</strong> is savings you
                    never invest — it covers essentials if income stops for a while.
                  </p>
                </div>
              </div>
              <AmountField
                id="emergencySavings"
                label="Current emergency savings"
                hint="Money you could use immediately in an emergency. Enter 0 if none yet."
                value={safety.emergencySavings ?? ""}
                error={errors.emergencySavings}
                onChange={(v) => setSafety({ ...safety, emergencySavings: v })}
              />
              <ChoiceChips
                label="Do you keep a separate emergency fund?"
                hint="Separate means parked apart from spending money — savings account, not investments."
                groupLabel="Emergency fund presence"
                value={(safety.hasEmergencyFund as "yes" | "no" | "") ?? ""}
                error={errors.hasEmergencyFund}
                onChange={(v) => setSafety({ ...safety, hasEmergencyFund: v })}
                options={[
                  { value: "yes", label: "Yes", sub: "Kept apart from everyday money." },
                  {
                    value: "no",
                    label: "Not yet",
                    sub: "That's okay — this check helps you plan one.",
                  },
                ]}
              />
              <AmountField
                id="savingsGoalTarget"
                label="Emergency fund goal"
                hint="A common aim is 3–6 months of essentials. Leave blank to decide later."
                value={safety.savingsGoalTarget ?? ""}
                error={errors.savingsGoalTarget}
                optional
                onChange={(v) => setSafety({ ...safety, savingsGoalTarget: v })}
              />
            </section>
          )}

          {step === 3 && (
            <section aria-label="Investment context" className="card space-y-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">What is this money for?</h2>
                  <p className="text-sm text-muted-foreground">
                    When you might need it changes everything.
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="goal" className="block font-medium">
                  Financial goal
                  <OptionalBadge />
                </label>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  E.g. emergency fund, laptop, relocation, long-term wealth.
                </p>
                <input
                  id="goal"
                  type="text"
                  maxLength={120}
                  className="field"
                  value={context.goal ?? ""}
                  aria-invalid={!!errors.goal}
                  onChange={(e) => setContext({ ...context, goal: e.target.value })}
                  placeholder="What are you saving or investing toward?"
                />
                {errors.goal && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.goal}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="horizonYears" className="block font-medium">
                  When might you need this money?
                  <RequiredBadge />
                </label>
                <p className="mb-1.5 text-sm text-muted-foreground">
                  <strong className="text-foreground">Time horizon</strong> means how long the money
                  can stay untouched. Money needed next year should be treated very differently from
                  money needed in ten.
                </p>
                <select
                  id="horizonYears"
                  className="field"
                  value={context.horizonYears ?? ""}
                  aria-invalid={!!errors.horizonYears}
                  onChange={(e) => setContext({ ...context, horizonYears: e.target.value })}
                >
                  {HORIZON_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.horizonYears && (
                  <p role="alert" className="mt-1 text-sm text-destructive">
                    {errors.horizonYears}
                  </p>
                )}
              </div>
              <ChoiceChips
                label="Might you need this money in the near future?"
                hint="Fees due soon, a possible move, family needs — anything within a year or so."
                groupLabel="Near-term need"
                value={(context.needSoon as "yes" | "no" | "") ?? ""}
                error={errors.needSoon}
                onChange={(v) => setContext({ ...context, needSoon: v })}
                options={[
                  { value: "yes", label: "Yes, possibly", sub: "Keep near-term money accessible." },
                  { value: "no", label: "No", sub: "This money can stay untouched." },
                ]}
              />
              <ChoiceChips
                label="How familiar are you with investing?"
                hint="There are no wrong answers — this shapes what we suggest next."
                groupLabel="Investing familiarity"
                value={(context.familiarity as "beginner" | "some" | "confident" | "") ?? ""}
                error={errors.familiarity}
                onChange={(v) => setContext({ ...context, familiarity: v })}
                options={[
                  { value: "beginner", label: "Beginner", sub: "Little or no experience." },
                  {
                    value: "some",
                    label: "Some idea",
                    sub: "Know the basics, never invested regularly.",
                  },
                  {
                    value: "confident",
                    label: "Confident",
                    sub: "Invested before and understand risk.",
                  },
                ]}
              />
            </section>
          )}

          {step < 4 && (
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => {
                    setErrors({});
                    setStep(step - 1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button type="button" className="btn btn-primary flex-[2]" onClick={next}>
                {step === 3 ? "See my result" : "Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step < 3 && (
            <>
              <Link
                to="/flex-sip"
                className="mx-auto mt-3 block w-fit py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                Skip and explore the planner
              </Link>
              {step === 0 && (
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className="mx-auto block w-fit py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  Prefer quick ranges? Back to quick check
                </button>
              )}
            </>
          )}

          {step === 4 && result && meta && style && (
            <div className="space-y-6">
              <section aria-live="polite" className={cn("card space-y-4 border", style.card)}>
                <div className="flex items-center gap-3">
                  <span className={cn("grid h-11 w-11 place-items-center rounded-xl", style.tile)}>
                    <OutcomeIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{meta.eyebrow}</p>
                    <h2 className="text-xl font-bold">{meta.title}</h2>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <p className="text-sm text-muted-foreground">
                    Left each month after planned expenses
                    {result.snapshot.upcomingMonthly > 0 ? " and upcoming allocation" : ""}
                  </p>
                  <p className="font-display text-3xl font-bold">
                    {inr(result.snapshot.remaining)}
                    <span className="text-base font-normal text-muted-foreground"> /month</span>
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">Why this result</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">What shaped it</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.factors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-muted p-3 text-sm">
                  <p className="font-semibold">Suggested next steps</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    {result.nextSteps.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold">What could improve things</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                    {result.improvements.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
                <details className="rounded-xl border border-white/10 px-4 py-3 text-sm text-muted-foreground">
                  <summary className="cursor-pointer font-semibold text-foreground">
                    How this result works
                  </summary>
                  <p className="mt-2 leading-relaxed">
                    Remaining = income − essentials − discretionary − EMIs − (upcoming ÷ 12).
                    Everyday unaccounted spending is not subtracted, so remaining is a ceiling, not
                    a promise. Safety net needs under 1 month of essentials, or under ₹1,000 of
                    room, come first. EMIs over 40% of income, near-term needs, sub-3-year horizons,
                    thin buffers with unsteady income, or very large upcoming expenses make
                    recurring commitments hard to assess. Simple educational rules — not certified
                    financial advice.
                  </p>
                </details>
              </section>

              <section aria-label="Monthly snapshot" className="card space-y-2">
                <h3 className="font-bold">Your monthly snapshot</h3>
                {(
                  [
                    ["Monthly income", result.snapshot.totalIncome, "Salary + additional"],
                    ["Essential + debt", result.snapshot.essentialsTotal, "Essentials + EMIs"],
                    [
                      "Planned spending",
                      result.snapshot.plannedOut,
                      "Essentials + discretionary + EMIs",
                    ],
                    ...(result.snapshot.upcomingMonthly > 0
                      ? [
                          [
                            "Upcoming allocation",
                            result.snapshot.upcomingMonthly,
                            "Big expenses ÷ 12",
                          ] as [string, number, string],
                        ]
                      : []),
                  ] as [string, number, string][]
                ).map(([label, v, sub]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-2.5 first:border-t-0"
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground/80">{sub}</p>
                    </div>
                    <p className="font-display text-lg font-bold">{inr(v)}</p>
                  </div>
                ))}
              </section>

              <section aria-label="Income scenarios" className="card space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold">What if income changes next month?</h3>
                    <p className="text-sm text-muted-foreground">
                      Judge affordability by your low month — never your best month.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {scenarioRows.map((row, idx) => (
                    <div key={row.label} className="rounded-xl border border-white/10 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{row.label}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">₹</span>
                          <input
                            inputMode="decimal"
                            type="number"
                            min={0}
                            className="field w-32 !min-h-9 py-1.5 text-sm"
                            aria-label={`${row.label} income`}
                            value={scenarios[idx]?.income ?? row.income}
                            onChange={(e) => updateScenario(idx, e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Left:{" "}
                        <strong className={row.remaining < 0 ? "text-warning" : "text-foreground"}>
                          {inr(row.remaining)}
                        </strong>
                        {" · "}
                        {row.coversPlanned
                          ? "Covers everything planned"
                          : row.coversEssentials
                            ? "Covers essentials only — pause extras"
                            : "Doesn't cover essentials — protect basics first"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-label="Savings goal planner" className="card space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold">Plan a savings goal</h3>
                    <p className="text-sm text-muted-foreground">
                      Emergency fund, laptop, relocation — savings first, investing later.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <AmountField
                    id="goalTarget"
                    label="Target amount"
                    hint="Total needed."
                    value={goalTarget}
                    onChange={setGoalTarget}
                  />
                  <AmountField
                    id="goalSaved"
                    label="Already saved"
                    hint="Set aside for this."
                    value={goalSaved}
                    onChange={setGoalSaved}
                  />
                  <div>
                    <label htmlFor="goalMonths" className="block font-medium">
                      Months to get there
                      <RequiredBadge />
                    </label>
                    <p className="mb-1.5 text-sm text-muted-foreground">Your deadline in months.</p>
                    <input
                      id="goalMonths"
                      inputMode="numeric"
                      type="number"
                      min={1}
                      className="field"
                      value={goalMonths}
                      onChange={(e) => setGoalMonths(e.target.value)}
                    />
                  </div>
                </div>
                {goal ? (
                  <div aria-live="polite" className="rounded-xl bg-white/[0.03] p-4 text-sm">
                    <p className="text-muted-foreground">
                      Still needed:{" "}
                      <strong className="text-foreground">{inr(goal.remaining)}</strong>
                      {" · "}About{" "}
                      <strong className="text-foreground">{inr(goal.requiredMonthly)}/month</strong>{" "}
                      for {goal.months} months.
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-semibold",
                        goal.feasible ? "text-primary" : "text-warning",
                      )}
                    >
                      {goal.feasible ? (
                        <>
                          <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          {goal.note}
                        </>
                      ) : (
                        goal.note
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter a target above ₹0 and a deadline to see the monthly figure.
                  </p>
                )}
              </section>

              <div className="grid gap-2">
                <Link to="/my-plan" className="btn btn-primary w-full">
                  See my financial plan <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/flex-sip" className="btn btn-outline w-full">
                    <Wallet className="h-4 w-4" /> Flex SIP
                  </Link>
                  <Link to="/risk" className="btn btn-outline w-full">
                    Growth simulator
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn btn-outline w-full"
                    onClick={() => {
                      setErrors({});
                      setStep(0);
                    }}
                  >
                    Edit answers
                  </button>
                  <button type="button" className="btn btn-outline w-full" onClick={startOver}>
                    <RotateCcw className="h-4 w-4" /> Start over
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Saved on this device only — edit anytime, nothing is sent anywhere.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
