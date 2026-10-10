import { describe, expect, it } from "vitest";
import {
  classifyOutcome,
  computeSnapshot,
  defaultScenarios,
  planGoal,
  scenarioSnapshots,
  validateContextStep,
  validateExpensesStep,
  validateIncomeStep,
  validateSafetyStep,
  parseAmount,
  type AssessmentInput,
} from "@/lib/affordability";
import { loadAssessment, loadReadiness, saveAssessment } from "@/lib/usePlan";

const base: AssessmentInput = {
  baseIncome: 40000,
  additionalIncome: 0,
  incomeType: "fixed",
  essential: 15000,
  discretionary: 8000,
  emi: 2000,
  upcoming: 0,
  emergencySavings: 60000,
  hasEmergencyFund: true,
  savingsGoalTarget: null,
  goal: "Emergency fund",
  horizonYears: 5,
  needSoon: false,
  familiarity: "beginner",
};

describe("scenario A — college student, low income, minimal buffer", () => {
  const student: AssessmentInput = {
    ...base,
    baseIncome: 8000,
    incomeType: "irregular",
    essential: 5000,
    discretionary: 2000,
    emi: 0,
    emergencySavings: 2000,
    hasEmergencyFund: false,
    horizonYears: 2,
  };
  it("suggests building a safety net", () => {
    expect(classifyOutcome(student).outcome).toBe("safety-net");
  });
  it("explains why in plain language", () => {
    const r = classifyOutcome(student);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.nextSteps.length).toBeGreaterThan(0);
    expect(r.improvements.length).toBeGreaterThan(0);
  });
});

describe("scenario B — intern with stipend and predictable expenses", () => {
  const intern: AssessmentInput = {
    ...base,
    baseIncome: 25000,
    incomeType: "fixed",
    essential: 10000,
    discretionary: 6000,
    emi: 0,
    emergencySavings: 30000,
    hasEmergencyFund: true,
    horizonYears: 5,
  };
  it("allows exploring a small start", () => {
    const r = classifyOutcome(intern);
    expect(r.outcome).toBe("small-start");
    expect(r.snapshot.remaining).toBe(9000);
  });
});

describe("scenario C — freelancer with income variation", () => {
  const freelancer: AssessmentInput = {
    ...base,
    baseIncome: 12000,
    incomeType: "variable",
    essential: 7000,
    discretionary: 3000,
    emi: 0,
    emergencySavings: 10000,
    hasEmergencyFund: false,
    horizonYears: 7,
  };
  it("asks for a plan review when buffer is thin", () => {
    expect(classifyOutcome(freelancer).outcome).toBe("review-plan");
  });
  it("judges affordability by the low month across scenarios", () => {
    const rows = scenarioSnapshots(freelancer, [
      { label: "Low month", income: 7000 },
      { label: "Typical month", income: 12000 },
      { label: "High month", income: 15000 },
    ]);
    expect(rows[0]?.coversEssentials).toBe(true);
    expect(rows[0]?.coversPlanned).toBe(false);
    expect(rows[2]?.coversPlanned).toBe(true);
    // Affordable in a high month must not mask a low month
    expect(rows[0]?.remaining).toBeLessThan(0);
  });
  it("offers low/typical/high defaults for non-fixed income", () => {
    const d = defaultScenarios(freelancer);
    expect(d.map((s) => s.label)).toEqual(["Low month", "Typical month", "High month"]);
    expect(d[0]!.income).toBeLessThan(d[1]!.income);
    expect(d[1]!.income).toBeLessThan(d[2]!.income);
  });
});

describe("scenario D — young professional, stable income and savings", () => {
  it("allows exploring a small start with healthy room", () => {
    const r = classifyOutcome(base);
    expect(r.outcome).toBe("small-start");
    expect(r.snapshot.remaining).toBe(15000);
    expect(r.snapshot.emergencyCoverMonths).toBe(4);
  });
});

describe("scenario E — high debt and upcoming expenses", () => {
  it("asks for review when EMIs dominate income", () => {
    const r = classifyOutcome({ ...base, essential: 8000, discretionary: 4000, emi: 17000 });
    expect(r.snapshot.remaining).toBe(11000);
    expect(r.outcome).toBe("review-plan");
    expect(r.reasons.join(" ")).toMatch(/debt/i);
  });
  it("asks for review when a large upcoming expense looms", () => {
    const r = classifyOutcome({ ...base, upcoming: 120000 });
    expect(r.outcome).toBe("review-plan");
  });
  it("spreads upcoming expenses over 12 months transparently", () => {
    expect(computeSnapshot({ ...base, upcoming: 120000 }).upcomingMonthly).toBe(10000);
  });
  it("suggests safety net when nothing remains", () => {
    const r = classifyOutcome({ ...base, essential: 30000, discretionary: 15000, emi: 5000 });
    expect(r.outcome).toBe("safety-net");
    expect(r.snapshot.remaining).toBeLessThanOrEqual(0);
  });
});

describe("scenario F — incomplete information", () => {
  it("requires income, income type, expenses, buffer, horizon and context choices", () => {
    expect(Object.keys(validateIncomeStep({}))).toContain("baseIncome");
    expect(Object.keys(validateIncomeStep({})).includes("incomeType")).toBe(true);
    expect(Object.keys(validateExpensesStep({}))).toEqual(["essential", "discretionary", "emi"]);
    expect(Object.keys(validateSafetyStep({}))).toContain("emergencySavings");
    expect(Object.keys(validateContextStep({}))).toContain("horizonYears");
  });
  it("keeps upcoming expenses, additional income and goals optional", () => {
    expect(validateExpensesStep({ essential: "1", discretionary: "0", emi: "0" })).toEqual({});
    expect(validateIncomeStep({ baseIncome: "1", incomeType: "fixed" })).toEqual({});
  });
});

describe("scenario G — invalid and extreme values", () => {
  it("rejects negatives, non-numbers and zero income", () => {
    expect(validateIncomeStep({ baseIncome: "-5", incomeType: "fixed" }).baseIncome).toBeDefined();
    expect(validateIncomeStep({ baseIncome: "abc", incomeType: "fixed" }).baseIncome).toBeDefined();
    expect(validateIncomeStep({ baseIncome: "0", incomeType: "fixed" }).baseIncome).toBeDefined();
    expect(
      validateExpensesStep({ essential: "-1", discretionary: "0", emi: "0" }).essential,
    ).toBeDefined();
    expect(parseAmount("-3")).toBeNull();
    expect(parseAmount("xyz")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });
  it("flags extremely large values for double-checking instead of trusting them", () => {
    expect(
      validateIncomeStep({ baseIncome: "99999999999", incomeType: "fixed" }).baseIncome,
    ).toMatch(/double-check/i);
  });
  it("never divides by zero with no essential baseline", () => {
    const s = computeSnapshot({ ...base, essential: 0, emi: 0, emergencySavings: 5000 });
    expect(Number.isFinite(s.emiRatio)).toBe(true);
    expect(s.emergencyCoverMonths).toBe(Number.POSITIVE_INFINITY);
    expect(() => classifyOutcome({ ...base, essential: 0, emi: 0 })).not.toThrow();
  });
});

describe("scenario H — editing inputs after a result changes the result", () => {
  it("recomputes a new outcome from edited inputs", () => {
    const before = classifyOutcome({ ...base, emergencySavings: 0 });
    expect(before.outcome).toBe("safety-net");
    const after = classifyOutcome({ ...base, emergencySavings: 60000 });
    expect(after.outcome).toBe("small-start");
    expect(after.snapshot.remaining).toBe(before.snapshot.remaining);
  });
});

describe("savings goals", () => {
  it("computes the monthly requirement and feasibility", () => {
    const g = planGoal(60000, 10000, 10, 15000);
    expect(g?.remaining).toBe(50000);
    expect(g?.requiredMonthly).toBe(5000);
    expect(g?.feasible).toBe(true);
  });
  it("explains unrealistic timeframes and lets the user adjust", () => {
    const g = planGoal(60000, 0, 2, 15000);
    expect(g?.feasible).toBe(false);
    expect(g?.note).toMatch(/extend the date or lower the target/i);
  });
  it("rejects invalid goal inputs without throwing", () => {
    expect(planGoal(0, 0, 5, 1000)).toBeNull();
    expect(planGoal(5000, 0, 0, 1000)).toBeNull();
    expect(planGoal(5000, -1, 5, 1000)).toBeNull();
  });
});

describe("short horizons and near-term needs", () => {
  it("asks for review when money may be needed soon", () => {
    expect(classifyOutcome({ ...base, needSoon: true }).outcome).toBe("review-plan");
  });
  it("asks for review for sub-3-year horizons despite healthy surplus", () => {
    expect(classifyOutcome({ ...base, horizonYears: 1 }).outcome).toBe("review-plan");
  });
});

describe("scenario I — persistence across refresh and return", () => {
  it("round-trips the full assessment through local browser storage", () => {
    localStorage.clear();
    const input: AssessmentInput = { ...base };
    saveAssessment({
      input,
      outcome: "small-start",
      scenarios: defaultScenarios(input),
      goalTarget: 60000,
      goalSaved: 10000,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
    });
    const loaded = loadAssessment();
    expect(loaded?.outcome).toBe("small-start");
    expect(loaded?.input.baseIncome).toBe(40000);
    expect(loaded?.goalTarget).toBe(60000);
    localStorage.clear();
  });
  it("keeps the legacy readiness key in sync for the Flex SIP nudge", () => {
    localStorage.clear();
    saveAssessment({
      input: { ...base, emergencySavings: 0 },
      outcome: "safety-net",
      scenarios: [],
      goalTarget: null,
      goalSaved: 0,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
    });
    expect(loadReadiness()?.outcome).toBe("cushion");
    localStorage.clear();
  });
  it("returns null for missing or malformed saved data", () => {
    localStorage.clear();
    expect(loadAssessment()).toBeNull();
    localStorage.setItem("firststep.assessment.v1", "not-json{");
    expect(loadAssessment()).toBeNull();
    localStorage.clear();
  });
});
