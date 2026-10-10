// Quick Start onboarding: range-based answers mapped onto the detailed
// affordability engine. Pure functions only — no React, no storage.
// Educational indications, not financial advice.
//
// Documented assumptions (also disclosed in the UI):
// - A selected income range is an ESTIMATE. Calculations use the range's
//   lower bound (conservative: plan for the least you might earn).
// - A selected expense range uses its UPPER bound (conservative: plan for
//   the most you might spend). The whole range counts as essential
//   spending; debt and upcoming lump sums are assumed ₹0 until the
//   Detailed Plan captures them.
// - Buffer statuses map to approximate coverage: none ≈ 0 months,
//   some ≈ 1 month, several ≈ 4 months, unsure ≈ unknown (treated as 0
//   for calculation, flagged as uncertain for messaging).
// - Ranges never become precise facts: results are always labelled
//   approximate, and small-start is only reachable with a several-month
//   buffer plus clearly positive room at conservative bounds.

import {
  classifyOutcome,
  type AffordabilityOutcome,
  type AssessmentInput,
  type RawExpenses,
  type RawIncome,
  type RawSafety,
  type Snapshot,
} from "./affordability";

export type Situation = "student" | "professional" | "freelancer" | "between-jobs";
export type Priority = "emergency" | "start-investing" | "goal-saving" | "learning";
export type BufferStatus = "none" | "some" | "several" | "unsure";

export const SITUATIONS: { id: Situation; label: string; sub: string }[] = [
  { id: "student", label: "Student", sub: "Studying, maybe earning a little on the side." },
  {
    id: "professional",
    label: "Working professional",
    sub: "Salaried or stipend, fairly regular pay.",
  },
  { id: "freelancer", label: "Freelancer / Self-employed", sub: "Income shifts month to month." },
  { id: "between-jobs", label: "Between jobs", sub: "Little or no income right now." },
];

export type MoneyRange = {
  id: string;
  label: string;
  sub: string;
  /** Conservative bound used in calculations (min for income, max for expenses). */
  rep: number;
  min: number;
  /** Null when open-ended (e.g. "Above ₹50,000"). */
  max: number | null;
};

export const INCOME_RANGES: MoneyRange[] = [
  {
    id: "lt5k",
    label: "Below ₹5,000",
    sub: "Pocket money or tiny gigs.",
    rep: 0,
    min: 0,
    max: 5000,
  },
  {
    id: "5-10k",
    label: "₹5,000–₹10,000",
    sub: "Small stipend or part-time.",
    rep: 5000,
    min: 5000,
    max: 10000,
  },
  {
    id: "10-20k",
    label: "₹10,000–₹20,000",
    sub: "Typical intern stipend.",
    rep: 10000,
    min: 10000,
    max: 20000,
  },
  {
    id: "20-35k",
    label: "₹20,000–₹35,000",
    sub: "Entry-level salary.",
    rep: 20000,
    min: 20000,
    max: 35000,
  },
  {
    id: "35-50k",
    label: "₹35,000–₹50,000",
    sub: "Growing paycheck.",
    rep: 35000,
    min: 35000,
    max: 50000,
  },
  {
    id: "gt50k",
    label: "Above ₹50,000",
    sub: "Well above entry level.",
    rep: 50000,
    min: 50000,
    max: null,
  },
  {
    id: "varies",
    label: "It varies every month",
    sub: "No fixed figure — we'll ask for a typical range.",
    rep: 0,
    min: 0,
    max: null,
  },
];

export const EXPENSE_RANGES: MoneyRange[] = [
  { id: "lt5k", label: "Below ₹5,000", sub: "Very lean month.", rep: 5000, min: 0, max: 5000 },
  {
    id: "5-10k",
    label: "₹5,000–₹10,000",
    sub: "Modest spending.",
    rep: 10000,
    min: 5000,
    max: 10000,
  },
  {
    id: "10-20k",
    label: "₹10,000–₹20,000",
    sub: "Rent plus living costs.",
    rep: 20000,
    min: 10000,
    max: 20000,
  },
  {
    id: "20-35k",
    label: "₹20,000–₹35,000",
    sub: "City living with EMIs.",
    rep: 35000,
    min: 20000,
    max: 35000,
  },
  {
    id: "35-50k",
    label: "₹35,000–₹50,000",
    sub: "High-commitment month.",
    rep: 50000,
    min: 35000,
    max: 50000,
  },
  {
    id: "gt50k",
    label: "Above ₹50,000",
    sub: "Very high outgo.",
    rep: 50000,
    min: 50000,
    max: null,
  },
];

export const PRIORITIES: { id: Priority; label: string; sub: string }[] = [
  { id: "emergency", label: "Emergency savings", sub: "A buffer for bad months first." },
  { id: "start-investing", label: "Starting investments", sub: "Begin small, when ready." },
  { id: "goal-saving", label: "Saving for a goal", sub: "Laptop, move, course, trip." },
  { id: "learning", label: "Learning about investing", sub: "Understand first, decide later." },
];

export const BUFFER_STATUSES: { id: BufferStatus; label: string; sub: string }[] = [
  { id: "none", label: "No savings yet", sub: "Starting from zero is okay." },
  { id: "some", label: "Some savings", sub: "A little set aside, under a month or so." },
  { id: "several", label: "Several months of expenses", sub: "A cushion of a few months." },
  { id: "unsure", label: "Not sure", sub: "We'll help you figure it out." },
];

/** Approximate buffer coverage in months (see module assumptions). Null = unknown. */
export function bufferCoverMonths(status: BufferStatus): number | null {
  if (status === "none") return 0;
  if (status === "some") return 1;
  if (status === "several") return 4;
  return null;
}

export type QuickAnswers = {
  situation: Situation | null;
  incomeRange: string | null;
  typicalRange: string | null;
  expenseRange: string | null; // null = skipped ("not sure")
  priority: Priority | null;
  buffer: BufferStatus | null;
};

export const EMPTY_QUICK: QuickAnswers = {
  situation: null,
  incomeRange: null,
  typicalRange: null,
  expenseRange: null,
  priority: null,
  buffer: null,
};

export function findRange(list: MoneyRange[], id: string | null): MoneyRange | null {
  if (!id) return null;
  return list.find((r) => r.id === id) ?? null;
}

export type PrimaryStep = {
  title: string;
  blurb: string;
  /** Where the primary button leads. */
  to: "/readiness" | "/flex-sip" | "/risk" | "/my-plan";
  hash?: string;
  label: string;
};

export type QuickResult = {
  outcome: AffordabilityOutcome;
  snapshot: Snapshot | null;
  /** Conservative monthly room (income floor minus expense ceiling), null when unknowable. */
  roomMin: number | null;
  roomMax: number | null;
  reasons: string[];
  uncertainties: string[];
  canInfer: string[];
  cannotInfer: string[];
  neededInfo: string[];
  primaryStep: PrimaryStep;
  /** Representative input fed to the engine (documented estimates, not facts). */
  repInput: AssessmentInput | null;
};

function primaryStepFor(outcome: AffordabilityOutcome, priority: Priority): PrimaryStep {
  if (outcome === "safety-net") {
    return {
      title: "Build a starter buffer first",
      blurb: "Even one month of essentials in accessible savings changes your options.",
      to: "/readiness",
      label: "Refine my details",
    };
  }
  if (priority === "learning") {
    return {
      title: "Learn the basics first",
      blurb: "Short lessons on markets, mutual funds and risk — then decide.",
      to: "/risk",
      hash: "knowledge-hub",
      label: "Start learning",
    };
  }
  if (priority === "goal-saving") {
    return {
      title: "Set a savings target",
      blurb: "Name the goal and see what it takes per month in the Detailed Plan.",
      to: "/readiness",
      label: "Plan my goal",
    };
  }
  if (outcome === "small-start") {
    return {
      title: "Explore a tiny flexible start",
      blurb: "See what a small, skippable monthly amount could look like — no pressure.",
      to: "/flex-sip",
      label: "Explore Flex SIP",
    };
  }
  return {
    title: "Sharpen your numbers",
    blurb: "Exact amounts turn this rough sketch into a reliable plan.",
    to: "/readiness",
    label: "Refine my details",
  };
}

export function quickAssess(q: QuickAnswers): QuickResult {
  const uncertainties: string[] = [];
  const neededInfo: string[] = [];
  const cannotInfer: string[] = [
    "Exact investable amounts — ranges can't prove what you can afford.",
    "Whether a recurring investment fits — that needs exact income, debt and upcoming expenses.",
  ];

  // Resolve income: "varies" uses the typical range when given, else unknown.
  let incomeRange = findRange(INCOME_RANGES, q.incomeRange);
  let incomeVaries = false;
  if (q.incomeRange === "varies") {
    incomeVaries = true;
    const typical = findRange(INCOME_RANGES, q.typicalRange);
    incomeRange = typical && q.typicalRange !== "varies" ? typical : null;
    if (!incomeRange) {
      uncertainties.push(
        "Your income varies and no typical range was given, so monthly room can't be estimated.",
      );
      neededInfo.push("Your typical monthly income range.");
    }
  }
  const expenseRange = findRange(EXPENSE_RANGES, q.expenseRange);
  if (!expenseRange) {
    uncertainties.push("Monthly spending was skipped, so room can't be estimated reliably.");
    neededInfo.push("Your approximate monthly expenses.");
  }
  if (q.buffer === "unsure") {
    uncertainties.push(
      "Emergency savings are unknown — buffer coverage is assumed to be zero for now.",
    );
    neededInfo.push("Roughly how many months of expenses your savings could cover.");
  }

  const priority = q.priority ?? "learning";

  if (!incomeRange || !expenseRange) {
    return {
      outcome: "review-plan",
      snapshot: null,
      roomMin: null,
      roomMax: null,
      reasons: [
        incomeRange
          ? `Your income is around ${incomeRange.label.toLowerCase()}, but spending is unknown — so room can't be weighed.`
          : "Without a usable income figure, monthly room can't be weighed at all.",
      ],
      uncertainties,
      canInfer: ["Your stated situation, priority and savings status."],
      cannotInfer,
      neededInfo,
      primaryStep: primaryStepFor("review-plan", priority),
      repInput: null,
    };
  }

  // Conservative representatives (documented in module header).
  const incomeRep = incomeRange.rep;
  const expenseRep = expenseRange.rep;
  const bufferCover = bufferCoverMonths(q.buffer ?? "unsure");
  const repInput: AssessmentInput = {
    baseIncome: incomeRep,
    additionalIncome: 0,
    incomeType:
      q.situation === "freelancer" || q.situation === "between-jobs" ? "irregular" : "fixed",
    essential: expenseRep,
    discretionary: 0,
    emi: 0,
    upcoming: 0,
    emergencySavings: (bufferCover ?? 0) * expenseRep,
    hasEmergencyFund: q.buffer === "some" || q.buffer === "several",
    savingsGoalTarget: null,
    goal: "",
    horizonYears: null,
    needSoon: false,
    familiarity: "beginner",
  };

  let result = classifyOutcome(repInput);
  const roomMin = incomeRange.min - (expenseRange.max ?? expenseRange.rep);
  const roomMax =
    incomeRange.max === null || expenseRange.max === null
      ? null
      : incomeRange.max - expenseRange.min;

  // Small-start is only reachable with a solid buffer — never on income alone.
  if (result.outcome === "small-start" && q.buffer !== "several") {
    result = {
      ...result,
      outcome: "review-plan",
      reasons: [
        ...result.reasons,
        "Because this check uses rough ranges, a small start needs a several-month buffer to be responsible — yours isn't confirmed.",
      ],
    };
  }
  if (incomeVaries) {
    uncertainties.push(
      "Income varies month to month — judge any commitment by a low month, not a typical one.",
    );
  }
  uncertainties.push(
    "These are range-based estimates (income floor, spending ceiling). Exact amounts may shift the picture.",
  );
  if (q.buffer === "unsure")
    neededInfo.push("Roughly how many months of expenses your savings could cover.");

  const canInfer = [
    `Rough monthly room between ${roomMin <= 0 ? "nothing left" : "about ₹" + Math.round(roomMin).toLocaleString("en-IN")} and ${
      roomMax === null
        ? "an open upper end"
        : "about ₹" + Math.round(roomMax).toLocaleString("en-IN")
    }.`,
    q.buffer === "several"
      ? "A cushion worth protecting before any market risk."
      : "Whether a safety buffer needs attention first.",
  ];

  return {
    outcome: result.outcome,
    snapshot: result.snapshot,
    roomMin,
    roomMax,
    reasons: result.reasons,
    uncertainties,
    canInfer,
    cannotInfer,
    neededInfo,
    primaryStep: primaryStepFor(result.outcome, priority),
    repInput,
  };
}

/**
 * Prefill for the Detailed Plan so Quick Start answers carry over —
 * the user edits and extends, never re-enters from scratch.
 */
export function quickToDetailPrefill(q: QuickAnswers): {
  income: RawIncome;
  expenses: RawExpenses;
  safety: RawSafety;
} {
  let incomeRange = findRange(INCOME_RANGES, q.incomeRange);
  if (q.incomeRange === "varies") {
    const typical = findRange(INCOME_RANGES, q.typicalRange);
    incomeRange = typical && q.typicalRange !== "varies" ? typical : null;
  }
  const expenseRange = findRange(EXPENSE_RANGES, q.expenseRange);
  return {
    income: {
      baseIncome: incomeRange ? String(incomeRange.rep) : "",
      incomeType:
        q.situation === "freelancer" || q.situation === "between-jobs" ? "irregular" : "fixed",
    },
    expenses: {
      essential: expenseRange ? String(expenseRange.rep) : "",
      discretionary: "",
      emi: "",
      upcoming: "",
    },
    safety: {
      // Only "none" is a known amount (₹0); other statuses need exact figures.
      emergencySavings: q.buffer === "none" ? "0" : "",
      hasEmergencyFund: q.buffer === "some" || q.buffer === "several" ? "yes" : "",
    },
  };
}
