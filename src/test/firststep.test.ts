import { describe, expect, it } from "vitest";
import {
  EMERGENCY_MONTH_OPTIONS,
  addMonths,
  analyzeClaim,
  assessReadiness,
  emergencyMonthsFromOption,
  nextContributionDate,
  nextScheduled,
  pausePlan,
  planTotal,
  reduceToBase,
  resumeDateFor,
  resumePlan,
  validatePlan,
  validateReadiness,
  type Plan,
} from "@/lib/firststep";

const base: Plan = {
  base: 500,
  optional: 500,
  status: "active",
  pauseMonths: null,
  resumeDate: null,
  createdAt: "",
};

describe("readiness", () => {
  it("cushion when <1 month emergency", () => {
    expect(
      assessReadiness({
        income: 30000,
        expenses: 10000,
        emi: 0,
        emergencyMonths: 0,
        horizonYears: 5,
      }).outcome,
    ).toBe("cushion");
  });
  it("tiny when emergency under 3 months", () => {
    expect(
      assessReadiness({
        income: 30000,
        expenses: 10000,
        emi: 0,
        emergencyMonths: 2,
        horizonYears: 5,
      }).outcome,
    ).toBe("tiny");
  });
  it("ready when all basics met", () => {
    expect(
      assessReadiness({
        income: 40000,
        expenses: 15000,
        emi: 2000,
        emergencyMonths: 4,
        horizonYears: 5,
      }).outcome,
    ).toBe("ready");
  });
});

describe("pause/resume", () => {
  it("pausing 2 months on Oct 9 skips Nov 5 and Dec 5, resumes Jan 5", () => {
    const d = resumeDateFor(new Date(2026, 9, 9), 2);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 0, 5]);
  });
  it("pausing 3 months on Oct 9 resumes Feb 5", () => {
    const d = resumeDateFor(new Date(2026, 9, 9), 3);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 1, 5]);
  });
  it("rejects pause over 3 months", () => {
    expect(() => resumeDateFor(new Date(), 4)).toThrow();
  });
  it("resume clears pause state", () => {
    const p = resumePlan(pausePlan(base, 1));
    expect(p.status).toBe("active");
    expect(validatePlan(p)).toBeNull();
  });
  it("base below ₹500 is invalid", () => {
    expect(validatePlan({ ...base, base: 400 })).not.toBeNull();
  });
});

describe("hype filter", () => {
  it("guarantee + pressure → avoid", () => {
    expect(analyzeClaim("Guaranteed returns, join our telegram today only").verdict).toBe("avoid");
  });
  it("balanced explainer → learn", () => {
    expect(
      analyzeClaim(
        "Mutual fund investments are subject to market risks, including possible loss. Read all scheme documents carefully on sebi.gov.in before investing over 5 years.",
      ).verdict,
    ).toBe("learn");
  });
  it("guarantee-only → caution", () => {
    expect(
      analyzeClaim(
        "Fictional tip: earn guaranteed 5% returns every month with no risk and 100% sure-shot profits.",
      ).verdict,
    ).toBe("caution");
  });
});

describe("readiness validation (rules unchanged)", () => {
  it("requires all five fields", () => {
    expect(Object.keys(validateReadiness({}))).toEqual([
      "income",
      "expenses",
      "emi",
      "emergencyMonths",
      "horizonYears",
    ]);
  });
  it("rejects zero income", () => {
    expect(
      validateReadiness({
        income: "0",
        expenses: "0",
        emi: "0",
        emergencyMonths: "0",
        horizonYears: "5",
      }).income,
    ).toBe("Income must be more than ₹0");
  });
});

describe("flex plan dates and totals (no business-rule change)", () => {
  it("pausing preserves edited base and optional amounts", () => {
    const saved: Plan = {
      base: 500,
      optional: 0,
      status: "active",
      pauseMonths: null,
      resumeDate: null,
      createdAt: "",
    };
    const edited = { ...saved, base: 2000, optional: 1000 };
    const paused = pausePlan(edited, 1, new Date(2026, 9, 9));
    expect(paused.base).toBe(2000);
    expect(paused.optional).toBe(1000);
    expect(planTotal(paused)).toBe(3000);
    expect(paused.status).toBe("paused");
  });

  it("same reference date gives same resume date for preview and action", () => {
    const today = new Date(2026, 9, 9);
    const preview = resumeDateFor(today, 2);
    const action = pausePlan(base, 2, today);
    expect(new Date(action.resumeDate as string).getTime()).toBe(preview.getTime());
  });

  it("nextScheduled uses resume date when paused, contribution day when active", () => {
    const paused = pausePlan(base, 1, new Date(2026, 9, 9));
    expect(nextScheduled(paused, new Date(2026, 9, 10)).getTime()).toBe(
      new Date(paused.resumeDate as string).getTime(),
    );
    expect(nextScheduled(base, new Date(2026, 9, 4)).getDate()).toBe(5);
  });

  it("next contribution is strictly after today on the 5th", () => {
    expect(nextContributionDate(new Date(2026, 9, 4))).toEqual(new Date(2026, 9, 5));
    expect(nextContributionDate(new Date(2026, 9, 5))).toEqual(new Date(2026, 10, 5));
    expect(nextContributionDate(new Date(2026, 9, 6))).toEqual(new Date(2026, 10, 5));
  });

  it("addMonths clamps to the target month length", () => {
    const d = addMonths(new Date(2026, 0, 31), 1);
    expect([d.getFullYear(), d.getMonth()]).toEqual([2026, 1]);
    expect(d.getDate()).toBeLessThanOrEqual(28);
  });

  it("reduce to base keeps pause state and clears only optional", () => {
    const paused = pausePlan({ ...base, base: 1000, optional: 500 }, 2, new Date(2026, 9, 9));
    const reduced = reduceToBase(paused);
    expect(reduced.optional).toBe(0);
    expect(reduced.base).toBe(1000);
    expect(reduced.status).toBe("paused");
    expect(reduced.resumeDate).toBe(paused.resumeDate);
  });
});

describe("readiness surplus rules", () => {
  it("zero surplus → cushion", () => {
    const r = assessReadiness({
      income: 20000,
      expenses: 15000,
      emi: 5000,
      emergencyMonths: 6,
      horizonYears: 5,
    });
    expect(r.outcome).toBe("cushion");
    expect(r.spare).toBe(0);
  });

  it("negative surplus → cushion without presenting it as investable", () => {
    const r = assessReadiness({
      income: 20000,
      expenses: 18000,
      emi: 5000,
      emergencyMonths: 6,
      horizonYears: 5,
    });
    expect(r.outcome).toBe("cushion");
    expect(r.spare).toBe(-3000);
    expect(r.reasons.join(" ")).toMatch(/nothing is left/i);
  });

  it("positive but small surplus relative to income → tiny", () => {
    const r = assessReadiness({
      income: 50000,
      expenses: 48000,
      emi: 1000,
      emergencyMonths: 6,
      horizonYears: 5,
    });
    expect(r.spare).toBe(1000);
    expect(r.outcome).toBe("tiny");
    expect(r.reasons.join(" ")).toMatch(/little room/i);
  });

  it("strong surplus, adequate savings, long horizon → ready", () => {
    const r = assessReadiness({
      income: 50000,
      expenses: 10000,
      emi: 2000,
      emergencyMonths: 6,
      horizonYears: 5,
    });
    expect(r.spare).toBe(38000);
    expect(r.outcome).toBe("ready");
  });

  it("strong surplus with a short horizon → tiny, explained by horizon not affordability", () => {
    const r = assessReadiness({
      income: 50000,
      expenses: 0,
      emi: 0,
      emergencyMonths: 6,
      horizonYears: 2,
    });
    expect(r.spare).toBe(50000);
    expect(r.outcome).toBe("tiny");
    expect(r.reasons.join(" ")).toMatch(/surplus is strong.*short for market-linked/i);
  });

  it("limited emergency savings despite strong surplus → tiny", () => {
    const r = assessReadiness({
      income: 50000,
      expenses: 0,
      emi: 0,
      emergencyMonths: 2,
      horizonYears: 5,
    });
    expect(r.outcome).toBe("tiny");
    expect(r.reasons.join(" ")).toMatch(/under 3 months/i);
  });

  it("zero fixed expenses never divides by zero", () => {
    const r = assessReadiness({
      income: 50000,
      expenses: 0,
      emi: 0,
      emergencyMonths: 6,
      horizonYears: 2,
    });
    expect(Number.isFinite(r.spare)).toBe(true);
    expect(Number.isFinite(r.emiRatio)).toBe(true);
    expect(Number.isFinite(r.surplusRatio)).toBe(true);
  });

  it("surplus is income minus expenses minus EMI", () => {
    const r = assessReadiness({
      income: 40000,
      expenses: 15000,
      emi: 2000,
      emergencyMonths: 4,
      horizonYears: 5,
    });
    expect(r.spare).toBe(23000);
  });

  it("invalid inputs are rejected by validation and guarded in assessment", () => {
    expect(
      validateReadiness({
        income: "-5",
        expenses: "0",
        emi: "0",
        emergencyMonths: "6",
        horizonYears: "5",
      }).income,
    ).toBeDefined();
    const r = assessReadiness({
      income: 0,
      expenses: 0,
      emi: 0,
      emergencyMonths: 6,
      horizonYears: 5,
    });
    expect(r.outcome).toBe("cushion");
    expect(Number.isFinite(r.emiRatio)).toBe(true);
  });
});

describe("emergency savings dropdown", () => {
  it("has ten options starting unselected", () => {
    expect(EMERGENCY_MONTH_OPTIONS).toHaveLength(10);
    expect(EMERGENCY_MONTH_OPTIONS[0]).toEqual({ value: "", label: "Select months" });
  });

  it("maps every option to the specified months", () => {
    expect(emergencyMonthsFromOption("")).toBeNull();
    expect(emergencyMonthsFromOption("0.5")).toBe(0.5);
    expect(emergencyMonthsFromOption("1")).toBe(1);
    expect(emergencyMonthsFromOption("2")).toBe(2);
    expect(emergencyMonthsFromOption("3")).toBe(3);
    expect(emergencyMonthsFromOption("4")).toBe(4);
    expect(emergencyMonthsFromOption("5")).toBe(5);
    expect(emergencyMonthsFromOption("6")).toBe(6);
    expect(emergencyMonthsFromOption("9")).toBe(9);
    expect(emergencyMonthsFromOption("12")).toBe(12);
  });

  it("treats an unselected value as incomplete input", () => {
    expect(
      validateReadiness({
        income: "50000",
        expenses: "0",
        emi: "0",
        emergencyMonths: "",
        horizonYears: "5",
      }).emergencyMonths,
    ).toBe("Please select an option");
  });

  it("uses the selected value in the readiness calculation", () => {
    const months = emergencyMonthsFromOption("6");
    expect(months).toBe(6);
    const r = assessReadiness({
      income: 50000,
      expenses: 0,
      emi: 0,
      emergencyMonths: months as number,
      horizonYears: 5,
    });
    expect(r.outcome).toBe("ready");
    const low = assessReadiness({
      income: 50000,
      expenses: 0,
      emi: 0,
      emergencyMonths: emergencyMonthsFromOption("0.5") as number,
      horizonYears: 5,
    });
    expect(low.outcome).toBe("cushion");
  });
});
