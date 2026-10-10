import { describe, expect, it } from "vitest";
import {
  BUFFER_STATUSES,
  EXPENSE_RANGES,
  INCOME_RANGES,
  PRIORITIES,
  SITUATIONS,
  bufferCoverMonths,
  findRange,
  quickAssess,
  quickToDetailPrefill,
  type QuickAnswers,
} from "@/lib/quickstart";
import { loadAssessment, saveAssessment } from "@/lib/usePlan";

const q: QuickAnswers = {
  situation: "professional",
  incomeRange: "35-50k",
  typicalRange: null,
  expenseRange: "10-20k",
  priority: "start-investing",
  buffer: "several",
};

describe("quick start option catalogues", () => {
  it("offers the four specified situations", () => {
    expect(SITUATIONS.map((s) => s.id)).toEqual([
      "student",
      "professional",
      "freelancer",
      "between-jobs",
    ]);
  });
  it("offers the seven specified income ranges including variable income", () => {
    expect(INCOME_RANGES.map((r) => r.id)).toEqual([
      "lt5k",
      "5-10k",
      "10-20k",
      "20-35k",
      "35-50k",
      "gt50k",
      "varies",
    ]);
  });
  it("offers the four priorities and four buffer statuses", () => {
    expect(PRIORITIES.map((p) => p.id)).toEqual([
      "emergency",
      "start-investing",
      "goal-saving",
      "learning",
    ]);
    expect(BUFFER_STATUSES.map((b) => b.id)).toEqual(["none", "some", "several", "unsure"]);
  });
});

describe("conservative representative mapping", () => {
  it("uses the income floor and spending ceiling, never midpoints stated as facts", () => {
    expect(findRange(INCOME_RANGES, "20-35k")?.rep).toBe(20000);
    expect(findRange(EXPENSE_RANGES, "10-20k")?.rep).toBe(20000);
  });
  it("maps buffer statuses to documented coverage with unsure as unknown", () => {
    expect(bufferCoverMonths("none")).toBe(0);
    expect(bufferCoverMonths("some")).toBe(1);
    expect(bufferCoverMonths("several")).toBe(4);
    expect(bufferCoverMonths("unsure")).toBeNull();
  });
});

describe("variable-income users", () => {
  it("uses the typical range when given", () => {
    const r = quickAssess({
      ...q,
      situation: "freelancer",
      incomeRange: "varies",
      typicalRange: "20-35k",
    });
    expect(r.repInput?.baseIncome).toBe(20000);
    expect(r.uncertainties.join(" ")).toMatch(/low month/i);
  });
  it("treats income as unknown when varies with no typical range", () => {
    const r = quickAssess({ ...q, incomeRange: "varies", typicalRange: null });
    expect(r.outcome).toBe("review-plan");
    expect(r.snapshot).toBeNull();
    expect(r.repInput).toBeNull();
    expect(r.neededInfo.join(" ")).toMatch(/typical monthly income/i);
  });
});

describe("missing information", () => {
  it("skipped expenses force review with needed info, never a small start", () => {
    const r = quickAssess({ ...q, expenseRange: null });
    expect(r.outcome).toBe("review-plan");
    expect(r.neededInfo.join(" ")).toMatch(/expenses/i);
    expect(r.outcome).not.toBe("small-start");
  });
  it("unknown buffer assumes zero cover and says what is needed", () => {
    const r = quickAssess({ ...q, incomeRange: "10-20k", expenseRange: "lt5k", buffer: "unsure" });
    expect(r.outcome).toBe("safety-net");
    expect(r.uncertainties.join(" ")).toMatch(/unknown/i);
    expect(r.neededInfo.join(" ")).toMatch(/months of expenses/i);
  });
});

describe("uncertainty in readiness results", () => {
  it("never classifies small-start on income alone with no buffer", () => {
    const r = quickAssess({ ...q, incomeRange: "gt50k", expenseRange: "lt5k", buffer: "none" });
    expect(r.outcome).toBe("safety-net");
  });
  it("caps thin buffers at review even when room looks fine", () => {
    const r = quickAssess({ ...q, buffer: "some" });
    expect(r.outcome).toBe("review-plan");
    expect(r.reasons.join(" ")).toMatch(/several-month buffer/i);
  });
  it("allows small-start only with a solid buffer and clear room", () => {
    const r = quickAssess(q);
    expect(r.outcome).toBe("small-start");
    expect(r.roomMin).toBe(15000);
    expect(r.roomMax).toBe(40000);
  });
  it("labels every result approximate with disclosed assumptions", () => {
    const r = quickAssess(q);
    expect(r.uncertainties.join(" ")).toMatch(/range-based estimates/i);
    expect(r.cannotInfer.join(" ")).toMatch(/recurring investment/i);
  });
});

describe("primary next steps", () => {
  it("points learners to the knowledge hub", () => {
    const r = quickAssess({ ...q, priority: "learning" });
    expect(r.primaryStep.to).toBe("/risk");
    expect(r.primaryStep.hash).toBe("knowledge-hub");
  });
  it("points a small start toward flexible exploration", () => {
    const r = quickAssess(q);
    expect(r.primaryStep.to).toBe("/flex-sip");
  });
  it("points safety-net users at buffer building via refinement", () => {
    const r = quickAssess({ ...q, buffer: "none" });
    expect(r.primaryStep.to).toBe("/readiness");
  });
});

describe("quick to detailed transition", () => {
  it("prefills representative bounds without inventing precise facts", () => {
    const p = quickToDetailPrefill(q);
    expect(p.income.baseIncome).toBe("35000");
    expect(p.expenses.essential).toBe("20000");
    expect(p.expenses.discretionary).toBe("");
    expect(p.expenses.emi).toBe("");
    // Savings amount unknown from a range — left blank except confirmed zero.
    expect(p.safety.emergencySavings).toBe("");
  });
  it("prefills zero savings only when the user said none", () => {
    expect(quickToDetailPrefill({ ...q, buffer: "none" }).safety.emergencySavings).toBe("0");
  });
  it("defaults freelancers to irregular income with room to change", () => {
    expect(quickToDetailPrefill({ ...q, situation: "freelancer" }).income.incomeType).toBe(
      "irregular",
    );
    expect(quickToDetailPrefill(q).income.incomeType).toBe("fixed");
  });
  it("carries the typical range through for varies users", () => {
    const p = quickToDetailPrefill({ ...q, incomeRange: "varies", typicalRange: "10-20k" });
    expect(p.income.baseIncome).toBe("10000");
  });
});

describe("quick persistence and backward compatibility", () => {
  it("saves and restores quick answers alongside the derived result", () => {
    localStorage.clear();
    saveAssessment({
      input: {
        baseIncome: 20000,
        additionalIncome: 0,
        incomeType: "fixed",
        essential: 20000,
        discretionary: 0,
        emi: 0,
        upcoming: 0,
        emergencySavings: 80000,
        hasEmergencyFund: true,
        savingsGoalTarget: null,
        goal: "",
        horizonYears: null,
        needSoon: false,
        familiarity: "beginner",
      },
      outcome: "small-start",
      scenarios: [],
      goalTarget: null,
      goalSaved: 0,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
      source: "quick",
      quick: q,
    });
    const loaded = loadAssessment();
    expect(loaded?.source).toBe("quick");
    expect(loaded?.quick?.incomeRange).toBe("35-50k");
    localStorage.clear();
  });
  it("old saved assessments without quick fields still load", () => {
    localStorage.clear();
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: {
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
          goal: "",
          horizonYears: 5,
          needSoon: false,
          familiarity: "beginner",
        },
        outcome: "small-start",
        scenarios: [],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
      }),
    );
    const loaded = loadAssessment();
    expect(loaded?.outcome).toBe("small-start");
    expect(loaded?.source).toBeUndefined();
    expect(loaded?.quick).toBeUndefined();
    localStorage.clear();
  });
});
