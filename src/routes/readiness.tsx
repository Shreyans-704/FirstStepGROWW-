import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CreditCard,
  HeartPulse,
  PiggyBank,
  Sprout,
  Wallet,
} from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { FinancialSnapshot } from "@/components/readiness/FinancialSnapshot";
import {
  EMERGENCY_MONTH_OPTIONS,
  HORIZON_YEAR_OPTIONS,
  assessReadiness,
  inr,
  validateReadiness,
  type ReadinessInput,
} from "@/lib/firststep";
import { saveReadiness } from "@/lib/usePlan";
import { prefersReducedMotion } from "@/lib/learn";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "Money Readiness Check — First Step" },
      {
        name: "description",
        content:
          "Five quick questions to see if you should build a cushion, start tiny, or plan your first SIP.",
      },
      { property: "og:title", content: "Money Readiness Check — First Step" },
      {
        property: "og:description",
        content: "An explainable readiness check for first-time investors.",
      },
    ],
  }),
  component: Readiness,
});

type Key = keyof ReadinessInput;
const fields: { k: Key; label: string; hint: string; prefix?: string; kind?: "select" }[] = [
  { k: "income", label: "Monthly take-home income", hint: "Average if it varies", prefix: "₹" },
  {
    k: "expenses",
    label: "Monthly fixed expenses",
    hint: "Rent, food, bills, transport",
    prefix: "₹",
  },
  { k: "emi", label: "Monthly EMI payments", hint: "Enter 0 if none", prefix: "₹" },
  {
    k: "emergencyMonths",
    label: "Emergency savings",
    hint: "How many months of essential expenses could you cover?",
    kind: "select",
  },
  {
    k: "horizonYears",
    label: "Investment time horizon (years)",
    hint: "When might you need this money?",
    kind: "select",
  },
];

const selectOptions: Record<string, readonly { value: string; label: string }[]> = {
  emergencyMonths: EMERGENCY_MONTH_OPTIONS,
  horizonYears: HORIZON_YEAR_OPTIONS,
};

const meta = {
  cushion: {
    title: "Build a cushion first",
    eyebrow: "Your result · Cushion first",
    icon: CircleAlert,
    tile: "bg-warning-soft text-warning",
    card: "border-warning/30",
    next: "Consider building 1–3 months of essentials in savings first — small, steady saving counts. You can still explore the planner with no pressure to invest now.",
  },
  tiny: {
    title: "Start tiny",
    eyebrow: "Your result · Starting small",
    icon: Sprout,
    tile: "bg-[#2DD4BF]/15 text-[#5EEAD4]",
    card: "border-[#2DD4BF]/30",
    next: "Consider beginning with the ₹500 base and skipping top-ups until the gaps below improve. Small starts still build the habit.",
  },
  ready: {
    title: "Ready to plan",
    eyebrow: "Your result · Ready",
    icon: CheckCircle2,
    tile: "bg-primary text-primary-foreground",
    card: "border-primary/30",
    next: "If you decide to invest, consider a base you can keep in a bad month, plus an optional top-up for good months. Market-linked money can fall — keep your emergency fund intact.",
  },
} as const;

const preInvestChecks = [
  {
    icon: PiggyBank,
    title: "Emergency buffer",
    question: "Could you cover essential expenses if your income stopped temporarily?",
    text: "An emergency fund handles surprises from savings, so an unexpected bill never forces you to sell investments at an inconvenient time.",
  },
  {
    icon: CreditCard,
    title: "High-interest debt",
    question: "Are you carrying expensive credit card or personal loan debt?",
    text: "The certain cost of high-interest debt can outweigh the uncertain benefits of investing. You don't need zero debt to start — but know what your debt costs first.",
  },
  {
    icon: Wallet,
    title: "Monthly cash flow",
    question: "Can you invest without borrowing or compromising essential expenses?",
    text: "Contributions should come from affordable surplus — money left after essentials, not money pulled from them.",
  },
  {
    icon: HeartPulse,
    title: "Risk comfort",
    question: "Would you be comfortable seeing your investment value fall?",
    text: "Market-linked investments can lose value. The right level of risk depends on your goals, time horizon, and how you'd feel watching the value drop.",
  },
] as const;

function Readiness() {
  const [v, setV] = useState<Partial<Record<Key, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [result, setResult] = useState<ReturnType<typeof assessReadiness> | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateReadiness(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setResult(null);
      return;
    }
    const input = Object.fromEntries(fields.map((f) => [f.k, Number(v[f.k])])) as ReadinessInput;
    const r = assessReadiness(input);
    setResult(r);
    saveReadiness({ outcome: r.outcome, spare: r.spare });
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
    });
  }

  return (
    <div>
      <div className="grid items-start gap-10 lg:grid-cols-[52fr_48fr] lg:gap-8 xl:gap-12">
        <div>
          <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0A100E] shadow-[0_32px_80px_-32px_rgb(0_0_0/0.8)]">
            <div
              aria-hidden="true"
              className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            />
            <div className="p-6 md:p-8">
              <div
                className="mb-5 flex gap-1.5"
                role="img"
                aria-label="Step 1 of 3: Money readiness check"
              >
                <span
                  aria-hidden="true"
                  className="h-1 flex-1 rounded-full bg-primary shadow-[0_0_12px_rgb(0_230_184/0.7)]"
                />
                <span aria-hidden="true" className="h-1 flex-1 rounded-full bg-white/10" />
                <span aria-hidden="true" className="h-1 flex-1 rounded-full bg-white/10" />
              </div>

              <PageTitle
                step="Step 1 of 3"
                title="Money readiness check"
                sub="Five numbers. An honest, explainable answer."
              />

              <form onSubmit={submit} noValidate className="space-y-5">
                {fields.map((f) => (
                  <div key={f.k}>
                    <label htmlFor={f.k} className="block font-medium">
                      {f.label}
                    </label>
                    <p className="mb-1.5 text-sm text-muted-foreground">{f.hint}</p>
                    {f.kind === "select" ? (
                      <div className="relative">
                        <select
                          id={f.k}
                          className="field appearance-none pr-10"
                          value={v[f.k] ?? ""}
                          aria-invalid={!!errors[f.k]}
                          aria-describedby={errors[f.k] ? `${f.k}-err` : undefined}
                          onChange={(e) => setV({ ...v, [f.k]: e.target.value })}
                        >
                          {(selectOptions[f.k] ?? EMERGENCY_MONTH_OPTIONS).map((o) => (
                            <option key={o.label} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        {f.prefix && (
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {f.prefix}
                          </span>
                        )}
                        <input
                          id={f.k}
                          inputMode="decimal"
                          type="number"
                          min={0}
                          className={`field ${f.prefix ? "pl-8" : ""}`}
                          value={v[f.k] ?? ""}
                          aria-invalid={!!errors[f.k]}
                          aria-describedby={errors[f.k] ? `${f.k}-err` : undefined}
                          onChange={(e) => setV({ ...v, [f.k]: e.target.value })}
                        />
                      </div>
                    )}
                    {errors[f.k] && (
                      <p id={`${f.k}-err`} className="mt-1 text-sm text-destructive">
                        {errors[f.k]}
                      </p>
                    )}
                  </div>
                ))}

                <details className="group rounded-2xl border border-white/10 bg-white/[0.02] px-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-left text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                    <span>
                      Before you start investing
                      <span className="mt-0.5 block text-[13px] font-normal text-muted-foreground">
                        A few basics worth checking before committing your money.
                      </span>
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <ul className="space-y-4 pb-4">
                    {preInvestChecks.map((c) => (
                      <li key={c.title} className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <c.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                            {c.title}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold text-foreground">
                            {c.question}
                          </span>
                          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                            {c.text}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>

                <button type="submit" className="btn btn-primary w-full">
                  Check My Readiness <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Link
                  to="/flex-sip"
                  className="mx-auto block w-fit py-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  Skip and explore the planner
                </Link>
              </form>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <FinancialSnapshot values={v} />
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[720px] space-y-6">
        <section aria-label="What the results mean" className="card space-y-3 border">
          <h2 className="text-sm font-semibold">What the 3 results mean</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <span>
                <strong className="text-foreground">Build a cushion first</strong> — nothing left
                after expenses & EMIs, or emergency savings under 1 month, or EMIs over 50% of
                income.
              </span>
            </li>
            <li className="flex gap-2">
              <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-[#5EEAD4]" aria-hidden="true" />
              <span>
                <strong className="text-foreground">Start tiny</strong> — emergency fund under 3
                months, or EMIs over 30%, or horizon under 3 years, or surplus under ₹3,000 / 10% of
                income. Try the ₹500 base.
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="text-foreground">Ready to plan</strong> — all basics met: 3+
                months saved, EMIs in check, 3+ year horizon, and room to invest regularly.
              </span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Prototype categories based on simple rules — not certified financial advice.
          </p>
        </section>

        {result &&
          (() => {
            const m = meta[result.outcome];
            return (
              <section
                ref={resultRef}
                aria-live="polite"
                className={`card space-y-4 border ${m.card}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${m.tile}`}
                  >
                    <m.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.eyebrow}</p>
                    <h2 className="text-xl font-bold">{m.title}</h2>
                  </div>
                </div>
                <p className="text-sm">
                  Left each month after expenses & EMIs: <strong>{inr(result.spare)}</strong>
                </p>
                <div>
                  <p className="mb-1 text-sm font-semibold">Why</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-xl bg-muted p-3 text-sm">
                  <strong>Next step:</strong> {m.next}
                </p>
                <Link to="/flex-sip" className="btn btn-primary w-full">
                  Continue to Flex SIP <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-muted-foreground">
                  Prototype categories based on simple rules — not certified financial advice.
                </p>
              </section>
            );
          })()}
      </div>
    </div>
  );
}
