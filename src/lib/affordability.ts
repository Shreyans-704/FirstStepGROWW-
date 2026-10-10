// Affordability and readiness logic for the guided assessment.
// Pure functions only — no React, no storage, no formatting.
// Educational indications, not financial advice.
//
// Transparent assumptions (also surfaced in the UI):
// - Upcoming lump-sum expenses are spread evenly over 12 months
//   ("upcoming allocation") so they can be weighed against monthly income.
// - "Remaining" is income minus planned outflows; everyday unaccounted
//   spending is NOT subtracted, so remaining is a ceiling, not a promise.
// - No hidden haircuts for irregular income. Uncertainty is handled by
//   comparing low/typical/high income scenarios, not by shrinking numbers.
// - Thresholds below (₹1,000 room, 1-month buffer, 40% EMI load) are simple
//   educational rules, not certified financial guidance.

export type IncomeType = "fixed" | "variable" | "irregular";
export type Familiarity = "beginner" | "some" | "confident";

export type AssessmentInput = {
  baseIncome: number;
  additionalIncome: number;
  incomeType: IncomeType;
  essential: number;
  discretionary: number;
  emi: number;
  upcoming: number;
  emergencySavings: number;
  hasEmergencyFund: boolean;
  savingsGoalTarget: number | null;
  goal: string;
  horizonYears: number | null;
  needSoon: boolean;
  familiarity: Familiarity;
};

export type AffordabilityOutcome = "safety-net" | "small-start" | "review-plan";

export type Snapshot = {
  totalIncome: number;
  essentialsTotal: number;
  plannedOut: number;
  upcomingMonthly: number;
  remaining: number;
  /** Months of essentials covered; Infinity when savings exist with no essential baseline. */
  emergencyCoverMonths: number;
  emiRatio: number;
};

export type OutcomeResult = {
  outcome: AffordabilityOutcome;
  snapshot: Snapshot;
  reasons: string[];
  factors: string[];
  nextSteps: string[];
  improvements: string[];
};

export const MAX_AMOUNT = 100000000; // ₹10 crore — above this, ask the user to double-check
export const MIN_ROOM = 1000; // below this monthly room, safety net comes first
export const EMI_REVIEW_RATIO = 0.4;

export const HORIZON_OPTIONS = [
  { value: "", label: "Select time horizon" },
  { value: "0.5", label: "Less than 1 year" },
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "5", label: "5 years" },
  { value: "7", label: "7 years" },
  { value: "10", label: "10 years" },
  { value: "15", label: "15 years" },
  { value: "20", label: "20 years or more" },
] as const;

export function horizonFromOption(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Parse a raw form string into a non-negative finite number, or null. */
export function parseAmount(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function amountError(raw: string | undefined, label: string, opts?: { required?: boolean }) {
  const required = opts?.required ?? true;
  if (raw === undefined || raw.trim() === "") {
    return required ? `${label} is required` : null;
  }
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0) return `${label} must be a number of 0 or more`;
  if (n > MAX_AMOUNT) return `${label} looks unusually large — please double-check it`;
  return null;
}

export type RawIncome = { baseIncome?: string; incomeType?: string; additionalIncome?: string };
export type RawExpenses = {
  essential?: string;
  discretionary?: string;
  emi?: string;
  upcoming?: string;
};
export type RawSafety = {
  emergencySavings?: string;
  hasEmergencyFund?: string;
  savingsGoalTarget?: string;
};
export type RawContext = {
  goal?: string;
  horizonYears?: string;
  needSoon?: string;
  familiarity?: string;
};

/** Concrete per-field error map (no index signature, so dot access type-checks). */
export type FieldErrors = Partial<
  Record<
    | "baseIncome"
    | "incomeType"
    | "additionalIncome"
    | "essential"
    | "discretionary"
    | "emi"
    | "upcoming"
    | "emergencySavings"
    | "hasEmergencyFund"
    | "savingsGoalTarget"
    | "goal"
    | "horizonYears"
    | "needSoon"
    | "familiarity",
    string
  >
>;

export function validateIncomeStep(r: RawIncome): FieldErrors {
  const errors: FieldErrors = {};
  const base = amountError(r.baseIncome, "Monthly income");
  if (base) errors.baseIncome = base;
  else if (Number(r.baseIncome) <= 0) errors.baseIncome = "Monthly income must be more than ₹0";
  if (r.incomeType !== "fixed" && r.incomeType !== "variable" && r.incomeType !== "irregular") {
    errors.incomeType = "Choose how your income usually behaves";
  }
  const add = amountError(r.additionalIncome, "Additional income", { required: false });
  if (add) errors.additionalIncome = add;
  return errors;
}

export function validateExpensesStep(r: RawExpenses): FieldErrors {
  const errors: FieldErrors = {};
  const fields: [keyof RawExpenses, string, boolean][] = [
    ["essential", "Essential expenses", true],
    ["discretionary", "Discretionary spending", true],
    ["emi", "EMI or debt payments", true],
    ["upcoming", "Upcoming big expenses", false],
  ];
  for (const [k, label, required] of fields) {
    const e = amountError(r[k], label, { required });
    if (e) errors[k] = e;
  }
  return errors;
}

export function validateSafetyStep(r: RawSafety): FieldErrors {
  const errors: FieldErrors = {};
  const s = amountError(r.emergencySavings, "Emergency savings", { required: true });
  if (s) errors.emergencySavings = s;
  if (r.hasEmergencyFund !== "yes" && r.hasEmergencyFund !== "no") {
    errors.hasEmergencyFund = "Choose one option";
  }
  const g = amountError(r.savingsGoalTarget, "Savings goal", { required: false });
  if (g) errors.savingsGoalTarget = g;
  return errors;
}

export function validateContextStep(r: RawContext): FieldErrors {
  const errors: FieldErrors = {};
  if (r.horizonYears === undefined || r.horizonYears === "") {
    errors.horizonYears = "Choose a time horizon";
  } else if (horizonFromOption(r.horizonYears) === null) {
    errors.horizonYears = "Choose a valid time horizon";
  }
  if (r.needSoon !== "yes" && r.needSoon !== "no") {
    errors.needSoon = "Choose one option";
  }
  if (r.familiarity !== "beginner" && r.familiarity !== "some" && r.familiarity !== "confident") {
    errors.familiarity = "Choose one option";
  }
  if (r.goal !== undefined && r.goal.length > 120) {
    errors.goal = "Keep your goal under 120 characters";
  }
  return errors;
}

export function computeSnapshot(i: AssessmentInput): Snapshot {
  const totalIncome = i.baseIncome + i.additionalIncome;
  const essentialsTotal = i.essential + i.emi;
  const plannedOut = i.essential + i.discretionary + i.emi;
  const upcomingMonthly = i.upcoming / 12;
  const remaining = totalIncome - plannedOut - upcomingMonthly;
  const emergencyCoverMonths =
    i.essential > 0
      ? i.emergencySavings / i.essential
      : i.emergencySavings > 0
        ? Number.POSITIVE_INFINITY
        : 0;
  const emiRatio = totalIncome > 0 ? i.emi / totalIncome : 0;
  return {
    totalIncome,
    essentialsTotal,
    plannedOut,
    upcomingMonthly,
    remaining,
    emergencyCoverMonths,
    emiRatio,
  };
}

const inrShort = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export function classifyOutcome(i: AssessmentInput): OutcomeResult {
  const s = computeSnapshot(i);
  const reasons: string[] = [];
  const factors: string[] = [];
  const nextSteps: string[] = [];
  const improvements: string[] = [];
  let outcome: AffordabilityOutcome;

  factors.push(
    `Monthly income ${inrShort(s.totalIncome)} against planned outflows of ${inrShort(s.plannedOut)}${i.upcoming > 0 ? ` plus ${inrShort(s.upcomingMonthly)}/month set aside for upcoming expenses` : ""}.`,
  );
  factors.push(
    s.emergencyCoverMonths === Number.POSITIVE_INFINITY
      ? "You entered emergency savings with no essential-expense baseline, so buffer coverage can't be measured in months."
      : `Emergency savings cover about ${s.emergencyCoverMonths < 10 ? s.emergencyCoverMonths.toFixed(1) : Math.round(s.emergencyCoverMonths)} month(s) of essential expenses.`,
  );
  if (i.incomeType !== "fixed") {
    factors.push(
      `Your income is ${i.incomeType}, so low months matter more than average months when judging a recurring commitment.`,
    );
  }
  if (i.emi > 0) {
    factors.push(
      `Debt payments take about ${Math.round(s.emiRatio * 100)}% of your income — that money is committed before anything else.`,
    );
  }

  if (s.remaining <= 0) {
    outcome = "safety-net";
    reasons.push(
      `After planned expenses${i.upcoming > 0 ? " and upcoming-expense allocation" : ""}, nothing is left from ${inrShort(s.totalIncome)} (remaining ${inrShort(s.remaining)}).`,
    );
    nextSteps.push(
      "Track one month of spending to find even a small gap before considering investing.",
    );
    nextSteps.push("Put any freed-up amount toward emergency savings first, not investments.");
    improvements.push("Reducing discretionary spending or clearing dues would create room.");
  } else if (s.emergencyCoverMonths < 1) {
    outcome = "safety-net";
    reasons.push("Your emergency savings cover less than 1 month of essential expenses.");
    nextSteps.push(
      `Build a starter buffer of 1 month of essentials (${inrShort(i.essential)}) in accessible savings before considering market-linked investing.`,
    );
    nextSteps.push("Set a monthly savings figure below — even a small one builds the habit.");
    improvements.push(
      "Each extra month of buffer coverage lowers the risk of forced selling later.",
    );
  } else if (s.remaining < MIN_ROOM) {
    outcome = "safety-net";
    reasons.push(
      `Your remaining amount is ${inrShort(s.remaining)} — under ${inrShort(MIN_ROOM)}/month, which leaves almost no margin for a bad month.`,
    );
    nextSteps.push("Grow the gap first: revisit discretionary spending or upcoming plans.");
    nextSteps.push("Keep any savings accessible until the buffer reaches 3 months of essentials.");
    improvements.push(
      "A larger or more stable income, or lower outflows, would change this picture.",
    );
  } else if (s.emiRatio > EMI_REVIEW_RATIO) {
    outcome = "review-plan";
    reasons.push(
      `Debt payments take more than ${Math.round(EMI_REVIEW_RATIO * 100)}% of your income, so a recurring investment is hard to assess right now.`,
    );
    nextSteps.push(
      "Compare what your debt costs against any uncertain investment benefit before committing.",
    );
    nextSteps.push("Revisit this check after dues shrink or income grows.");
    improvements.push("Lower EMIs relative to income would make a recurring plan easier to judge.");
  } else if (i.needSoon || (i.horizonYears !== null && i.horizonYears < 3)) {
    outcome = "review-plan";
    reasons.push(
      i.needSoon
        ? "You may need this money in the near future, so locking it into a recurring market-linked plan is hard to assess."
        : "Your time horizon is under 3 years — short for judging market-linked commitments.",
    );
    nextSteps.push("Keep near-term money accessible; revisit investing for goals further away.");
    nextSteps.push(
      "Explore the Growth Simulator to see how horizon changes illustrative outcomes.",
    );
    improvements.push(
      "A longer horizon for this particular money would make recurring investing easier to assess.",
    );
  } else if (i.incomeType !== "fixed" && s.emergencyCoverMonths < 3) {
    outcome = "review-plan";
    reasons.push(
      `Your ${i.incomeType} income plus a buffer under 3 months makes it hard to judge whether every month can carry a fixed commitment.`,
    );
    nextSteps.push(
      "Use the income-scenario explorer below: judge affordability by your low month, not your best month.",
    );
    nextSteps.push(
      "Consider a flexible plan (small fixed base, optional top-ups) rather than a rigid amount.",
    );
    improvements.push("A 3-month buffer would make irregular income much easier to plan around.");
  } else if (i.upcoming > 2 * s.totalIncome) {
    outcome = "review-plan";
    reasons.push(
      `Upcoming expenses of ${inrShort(i.upcoming)} are large relative to your income — fund those first, then reassess.`,
    );
    nextSteps.push(
      "Set aside for the upcoming expense with the goal planner below before considering investing.",
    );
    nextSteps.push("Return to this check once the big expense has passed.");
    improvements.push(
      "Clearing the upcoming obligation frees the monthly allocation for other goals.",
    );
  } else {
    outcome = "small-start";
    reasons.push(
      `You keep about ${inrShort(s.remaining)}/month after planned expenses and upcoming allocation, with ${s.emergencyCoverMonths === Number.POSITIVE_INFINITY ? "some" : "about " + (s.emergencyCoverMonths < 10 ? s.emergencyCoverMonths.toFixed(1) : Math.round(s.emergencyCoverMonths)) + " months of"} buffer.`,
    );
    nextSteps.push(
      "If you choose to start, begin tiny (for example a ₹500 base) and skip months without pressure.",
    );
    nextSteps.push(
      "Learn how horizon, risk, and diversification work before putting money in — see Growth Simulator.",
    );
    improvements.push(
      "A bigger buffer and steadier surplus would support a larger commitment later.",
    );
  }

  if (!i.hasEmergencyFund && outcome !== "safety-net") {
    factors.push(
      "You noted you don't have a dedicated emergency fund yet — worth fixing even alongside a small start.",
    );
  }
  if (i.familiarity === "beginner") {
    nextSteps.push(
      "Since you're new to investing, complete the Knowledge Hub basics before deciding anything.",
    );
  }

  return { outcome, snapshot: s, reasons, factors, nextSteps: nextSteps.slice(0, 3), improvements };
}

/* ---------- Income scenarios (low / typical / high) ---------- */

export type IncomeScenario = {
  label: string;
  income: number;
  remaining: number;
  coversEssentials: boolean;
  coversPlanned: boolean;
};

export function scenarioSnapshots(
  i: AssessmentInput,
  scenarios: { label: string; income: number }[],
): IncomeScenario[] {
  return scenarios.map((sc) => {
    const income = Math.max(0, sc.income);
    const planned = i.essential + i.discretionary + i.emi + i.upcoming / 12;
    return {
      label: sc.label,
      income,
      remaining: income - planned,
      coversEssentials: income >= i.essential + i.emi,
      coversPlanned: income >= planned,
    };
  });
}

export function defaultScenarios(i: AssessmentInput): { label: string; income: number }[] {
  if (i.incomeType === "fixed") {
    return [
      { label: "Typical month", income: i.baseIncome + i.additionalIncome },
      {
        label: "If income dips 20%",
        income: Math.round((i.baseIncome + i.additionalIncome) * 0.8),
      },
    ];
  }
  const base = i.baseIncome + i.additionalIncome;
  return [
    { label: "Low month", income: Math.round(base * 0.6) },
    { label: "Typical month", income: base },
    { label: "High month", income: Math.round(base * 1.25) },
  ];
}

/* ---------- Savings goals ---------- */

export type GoalPlan = {
  target: number;
  saved: number;
  months: number;
  remaining: number;
  requiredMonthly: number;
  affordableMonthly: number;
  feasible: boolean;
  note: string;
};

export function planGoal(
  target: number,
  saved: number,
  months: number,
  affordableMonthly: number,
): GoalPlan | null {
  if (
    !Number.isFinite(target) ||
    !Number.isFinite(saved) ||
    !Number.isFinite(months) ||
    target <= 0 ||
    saved < 0 ||
    months <= 0
  ) {
    return null;
  }
  const remaining = Math.max(0, target - saved);
  const requiredMonthly = remaining / months;
  const feasible = requiredMonthly <= Math.max(0, affordableMonthly);
  const note =
    remaining === 0
      ? "Goal already reached — consider what this money is for next."
      : feasible
        ? "Fits within your current monthly room. Everyday spending can still change this."
        : "Needs more per month than your current room allows — extend the date or lower the target.";
  return { target, saved, months, remaining, requiredMonthly, affordableMonthly, feasible, note };
}

/* ---------- Stored assessment ---------- */

export type StoredAssessment = {
  input: AssessmentInput;
  outcome: AffordabilityOutcome;
  scenarios: { label: string; income: number }[];
  goalTarget: number | null;
  goalSaved: number;
  goalMonths: number;
  savedAt: string;
};

export const defaultAssessmentInput: AssessmentInput = {
  baseIncome: 0,
  additionalIncome: 0,
  incomeType: "fixed",
  essential: 0,
  discretionary: 0,
  emi: 0,
  upcoming: 0,
  emergencySavings: 0,
  hasEmergencyFund: false,
  savingsGoalTarget: null,
  goal: "",
  horizonYears: null,
  needSoon: false,
  familiarity: "beginner",
};

export const OUTCOME_META: Record<
  AffordabilityOutcome,
  { title: string; eyebrow: string; blurb: string }
> = {
  "safety-net": {
    title: "Build your safety net",
    eyebrow: "Your result · Safety net first",
    blurb:
      "Right now your money is best used building a buffer — not investing. Deciding not to invest yet is a valid outcome.",
  },
  "small-start": {
    title: "Explore a small starting amount",
    eyebrow: "Your result · Small start",
    blurb:
      "Your budget appears to have some room. Any start should stay small, flexible, and skippable — commitments still matter.",
  },
  "review-plan": {
    title: "Review your financial plan",
    eyebrow: "Your result · Review first",
    blurb:
      "Something in your situation makes a recurring commitment hard to assess. Sort that out first, then revisit.",
  },
};
