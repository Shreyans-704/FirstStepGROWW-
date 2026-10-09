// Pure rules for the First Step prototype. Educational only — not financial advice.

export const MIN_BASE = 500;
export const CONTRIBUTION_DAY = 5;

export type ReadinessInput = {
  income: number;
  expenses: number;
  emi: number;
  emergencyMonths: number;
  horizonYears: number;
};
export type ReadinessOutcome = "cushion" | "tiny" | "ready";

export function validateReadiness(i: Partial<Record<keyof ReadinessInput, string>>) {
  const errors: Partial<Record<keyof ReadinessInput, string>> = {};
  const num = (k: keyof ReadinessInput) => Number(i[k]);
  (["income", "expenses", "emi", "emergencyMonths", "horizonYears"] as const).forEach((k) => {
    const raw = i[k];
    if (raw === undefined || raw === "") {
      errors[k] =
        k === "emergencyMonths" || k === "horizonYears" ? "Please select an option" : "Required";
    } else if (!Number.isFinite(num(k)) || num(k) < 0) errors[k] = "Enter a number of 0 or more";
  });
  if (!errors.income && num("income") <= 0) errors.income = "Income must be more than ₹0";
  if (!errors.emergencyMonths && num("emergencyMonths") > 60)
    errors.emergencyMonths = "Enter up to 60 months";
  if (!errors.horizonYears && (num("horizonYears") < 1 || num("horizonYears") > 40))
    errors.horizonYears = "Choose between 1 and 40 years";
  return errors;
}

/** Dropdown options for emergency savings → numeric months used in calculations. */
export const EMERGENCY_MONTH_OPTIONS = [
  { value: "", label: "Select months" },
  { value: "0.5", label: "Less than 1 month" },
  { value: "1", label: "1 month" },
  { value: "2", label: "2 months" },
  { value: "3", label: "3 months" },
  { value: "4", label: "4 months" },
  { value: "5", label: "5 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months or more" },
] as const;

/** Map a dropdown value to months, or null when nothing is selected. */
export function emergencyMonthsFromOption(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Dropdown options for investment horizon → numeric years used in calculations. */
export const HORIZON_YEAR_OPTIONS = [
  { value: "", label: "Select years" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "5", label: "5 years" },
  { value: "7", label: "7 years" },
  { value: "10", label: "10 years" },
  { value: "15", label: "15 years" },
  { value: "20", label: "20 years" },
  { value: "30", label: "30 years or more" },
] as const;

/** Map a dropdown value to years, or null when nothing is selected. */
export function horizonYearsFromOption(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function assessReadiness(i: ReadinessInput) {
  const validNumbers =
    Number.isFinite(i.income) &&
    Number.isFinite(i.expenses) &&
    Number.isFinite(i.emi) &&
    Number.isFinite(i.emergencyMonths) &&
    Number.isFinite(i.horizonYears) &&
    i.income > 0 &&
    i.expenses >= 0 &&
    i.emi >= 0;
  const spare = i.income - i.expenses - i.emi;
  // Guarded ratios: income is validated > 0 in the form, but stay safe when
  // called directly (e.g. zero expenses must never cause division by zero).
  const emiRatio = i.income > 0 && Number.isFinite(i.emi / i.income) ? i.emi / i.income : 0;
  const surplusRatio = i.income > 0 && Number.isFinite(spare / i.income) ? spare / i.income : 0;
  const pct = Math.round(surplusRatio * 100);
  const reasons: string[] = [];
  let outcome: ReadinessOutcome = "ready";

  if (!validNumbers) {
    reasons.push("Some numbers look incomplete — please check your inputs.");
    return { outcome: "cushion" as const, reasons, spare: 0, emiRatio: 0, surplusRatio: 0 };
  }

  if (spare <= 0)
    reasons.push(
      `After ${inr(i.expenses)} in expenses and ${inr(i.emi)} in EMIs, nothing is left from your ${inr(i.income)} income (surplus ${inr(spare)}).`,
    );
  if (i.emergencyMonths < 1)
    reasons.push("Your emergency savings cover less than 1 month of essentials.");
  if (emiRatio > 0.5) reasons.push("EMIs take more than half of your income.");
  if (reasons.length) outcome = "cushion";
  else {
    if (i.emergencyMonths < 3) reasons.push("Your emergency fund covers under 3 months.");
    if (emiRatio > 0.3) reasons.push("EMIs take more than 30% of your income.");
    if (i.horizonYears < 3) {
      if (spare >= 3000 && surplusRatio >= 0.1)
        reasons.push(
          `Your monthly surplus is strong (${inr(spare)} — about ${pct}% of your income), but a ${i.horizonYears}-year time horizon is short for market-linked investments. Prioritize options appropriate for when you need the money.`,
        );
      else reasons.push("Your time horizon is under 3 years — short for market-linked money.");
    }
    if (spare < 3000 || surplusRatio < 0.1)
      reasons.push(
        `Your monthly surplus is ${inr(spare)} — about ${pct}% of your income — which leaves little room for regular investing.`,
      );
    if (reasons.length) outcome = "tiny";
    else
      reasons.push(
        `You keep ${inr(spare)} of ${inr(i.income)} (about ${pct}%) after expenses and EMIs, with ${i.emergencyMonths} months of emergency savings and a ${i.horizonYears}-year horizon.`,
      );
  }
  return { outcome, reasons, spare, emiRatio, surplusRatio };
}

/** Add months, clamping the day to the target month's length. */
export function addMonths(d: Date, n: number) {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(d.getDate(), last));
  return r;
}

/** Next contribution date strictly after `today`, on CONTRIBUTION_DAY. */
export function nextContributionDate(today: Date) {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), CONTRIBUTION_DAY);
  return today.getDate() < CONTRIBUTION_DAY ? thisMonth : addMonths(thisMonth, 1);
}

/** Pausing N months skips the next N contributions. */
export function resumeDateFor(today: Date, months: number) {
  if (!Number.isInteger(months) || months < 1 || months > 3)
    throw new Error("Pause must be 1–3 months");
  return addMonths(nextContributionDate(today), months);
}

export type Plan = {
  base: number;
  optional: number;
  status: "active" | "paused";
  pauseMonths: number | null;
  resumeDate: string | null; // ISO date
  createdAt: string;
};

export function planTotal(p: Pick<Plan, "base" | "optional">) {
  return p.base + p.optional;
}

export function validatePlan(p: Plan): string | null {
  if (!Number.isFinite(p.base) || p.base < MIN_BASE) return `Base must be at least ₹${MIN_BASE}`;
  if (!Number.isFinite(p.optional) || p.optional < 0) return "Optional top-up cannot be negative";
  if (p.status === "paused" && (!p.resumeDate || !p.pauseMonths))
    return "Paused plan needs a resume date";
  if (p.status === "active" && (p.resumeDate || p.pauseMonths))
    return "Active plan cannot have a resume date";
  return null;
}

export function pausePlan(p: Plan, months: number, today = new Date()): Plan {
  if (p.status === "paused") return p;
  return {
    ...p,
    status: "paused",
    pauseMonths: months,
    resumeDate: resumeDateFor(today, months).toISOString(),
  };
}
export function resumePlan(p: Plan): Plan {
  return { ...p, status: "active", pauseMonths: null, resumeDate: null };
}
export function reduceToBase(p: Plan): Plan {
  return { ...p, optional: 0 };
}
/** Auto-resume a paused plan once its resume date has passed. */
export function normalizePlan(p: Plan, today = new Date()): Plan {
  if (p.status === "paused" && p.resumeDate && new Date(p.resumeDate) <= today)
    return resumePlan(p);
  return p;
}
export function nextScheduled(p: Plan, today = new Date()) {
  return p.status === "paused" && p.resumeDate
    ? new Date(p.resumeDate)
    : nextContributionDate(today);
}

// ---------- Hype filter ----------
export type HypeCheck = { id: string; label: string; flagged: boolean; detail: string };
export type HypeVerdict = "learn" | "caution" | "avoid";

const has = (t: string, re: RegExp) => re.test(t);

export function analyzeClaim(text: string) {
  const t = text.toLowerCase();
  const guaranteed = has(
    t,
    /guarantee|assured|risk[- ]?free|no risk|zero risk|fixed return|double (your )?money|100%|sure[- ]?shot|can'?t lose/,
  );
  const pressure = has(
    t,
    /only today|hurry|limited (time|slots|seats)|last chance|act now|join now|dm (me|now)|whatsapp|telegram|pay (now|₹|rs)|upi|registration fee|deposit|send money/,
  );
  const source = has(
    t,
    /sebi|amfi|registered|\bina\d|\binh\d|arn[- ]?\d|mutual fund house|amc|exchange|nse|bse/,
  );
  const timeframe = has(t, /\d+\s*(year|yr|month|week|day)s?|per (year|month|annum)|annual/);
  const losses = has(t, /risk|loss|lose|subject to market|may fall|volatil|not guaranteed/);

  const checks: HypeCheck[] = [
    {
      id: "source",
      label: "Source is identifiable",
      flagged: !source,
      detail: source
        ? "Mentions a registration or regulated entity — still verify it on SEBI's site."
        : "No registered adviser, AMC or regulator is named.",
    },
    {
      id: "guarantee",
      label: "No guaranteed returns",
      flagged: guaranteed,
      detail: guaranteed
        ? "Promises guaranteed or risk-free returns. Market-linked investments can't guarantee this."
        : "No guarantee language found.",
    },
    {
      id: "time",
      label: "Timeframe is clear",
      flagged: !timeframe,
      detail: timeframe
        ? "A timeframe is mentioned."
        : "No clear timeframe — returns without time are meaningless.",
    },
    {
      id: "loss",
      label: "Losses are acknowledged",
      flagged: !losses,
      detail: losses
        ? "Mentions risk or possible losses."
        : "Doesn't mention that you could lose money.",
    },
    {
      id: "pressure",
      label: "No pressure to act or pay",
      flagged: pressure,
      detail: pressure
        ? "Pushes urgency, private chats or payments."
        : "No urgency or payment push found.",
    },
  ];
  const flags = checks.filter((c) => c.flagged).length;
  const verdict: HypeVerdict =
    guaranteed || pressure || flags >= 4
      ? (guaranteed && pressure) || flags >= 4
        ? "avoid"
        : "caution"
      : flags >= 2
        ? "caution"
        : "learn";
  return { checks, flags, verdict };
}

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
