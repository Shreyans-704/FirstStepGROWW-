import { describe, expect, it } from "vitest";
import { analyzeClaim, assessReadiness, pausePlan, resumeDateFor, resumePlan, validatePlan, type Plan } from "@/lib/firststep";

const base: Plan = { base: 500, optional: 500, status: "active", pauseMonths: null, resumeDate: null, createdAt: "" };

describe("readiness", () => {
  it("cushion when <1 month emergency", () => {
    expect(assessReadiness({ income: 30000, expenses: 10000, emi: 0, emergencyMonths: 0, horizonYears: 5 }).outcome).toBe("cushion");
  });
  it("tiny when emergency under 3 months", () => {
    expect(assessReadiness({ income: 30000, expenses: 10000, emi: 0, emergencyMonths: 2, horizonYears: 5 }).outcome).toBe("tiny");
  });
  it("ready when all basics met", () => {
    expect(assessReadiness({ income: 40000, expenses: 15000, emi: 2000, emergencyMonths: 4, horizonYears: 5 }).outcome).toBe("ready");
  });
});

describe("pause/resume", () => {
  it("pausing 2 months on Oct 9 skips Nov 5 and Dec 5, resumes Jan 5", () => {
    const d = resumeDateFor(new Date(2026, 9, 9), 2);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 0, 5]);
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
});
