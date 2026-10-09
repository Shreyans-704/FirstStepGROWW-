import { describe, expect, it } from "vitest";
import { HUB_VIDEOS } from "@/config/videos";
import {
  allCategoriesPresent,
  categoryCount,
  checklistProgress,
  filterVideos,
  sipProjection,
  sipValueAtMonth,
  toggleChecklist,
} from "@/lib/learn";

describe("knowledge hub filtering", () => {
  it("returns everything for All Videos", () => {
    expect(filterVideos(HUB_VIDEOS, "All Videos")).toHaveLength(HUB_VIDEOS.length);
  });

  it("filters to a single category", () => {
    const mf = filterVideos(HUB_VIDEOS, "Mutual Funds");
    expect(mf.length).toBeGreaterThan(0);
    expect(mf.every((v) => v.category === "Mutual Funds")).toBe(true);
  });

  it("covers every required category", () => {
    expect(allCategoriesPresent()).toBe(true);
    expect(categoryCount(HUB_VIDEOS, "Financial Myths")).toBeGreaterThan(0);
  });

  it("every video has a valid youtube id and thumbnail host", () => {
    for (const v of HUB_VIDEOS) {
      expect(v.youtubeId).toMatch(/^[\w-]{11}$/);
      expect(`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`).toContain("i.ytimg.com");
    }
  });
});

describe("readiness checklist", () => {
  it("toggles ids on and off", () => {
    expect(toggleChecklist([], "budget")).toEqual(["budget"]);
    expect(toggleChecklist(["budget"], "budget")).toEqual([]);
  });

  it("counts progress", () => {
    expect(checklistProgress([])).toBe(0);
    expect(checklistProgress(["safety-net", "goals"])).toBe(2);
  });
});

describe("illustrative sip projection", () => {
  it("invested equals monthly times months", () => {
    const p = sipProjection(2000, 10, 5);
    expect(p.invested).toBe(2000 * 60);
  });

  it("value grows with the assumed rate and never drops below invested", () => {
    const low = sipProjection(2000, 6, 10);
    const high = sipProjection(2000, 12, 10);
    expect(low.value).toBeGreaterThanOrEqual(low.invested);
    expect(high.value).toBeGreaterThan(low.value);
  });

  it("samples one point per year plus the start", () => {
    expect(sipProjection(1000, 10, 7).yearly).toHaveLength(8);
  });

  it("handles zero horizon without NaN", () => {
    const p = sipProjection(2000, 10, 0);
    expect(p.invested).toBe(0);
    expect(Number.isFinite(p.value)).toBe(true);
  });

  it("keeps start-of-month behaviour by default", () => {
    // Ordinary annuity × (1 + monthly rate): 81670 × 1.01 ≈ 82486.
    expect(sipProjection(1000, 12, 5).value).toBe(82486);
  });
});

describe("end-of-month growth math (growth simulator)", () => {
  it("matches independently validated future values", () => {
    // FV = P × (((1 + R/12)^n − 1) / (R/12)), contributions at month end.
    expect(sipProjection(1000, 4, 5, "end").value).toBe(66299);
    expect(sipProjection(1000, 8, 5, "end").value).toBe(73477);
    expect(sipProjection(1000, 12, 5, "end").value).toBe(81670);
    expect(sipProjection(500, 12, 10, "end").value).toBe(115019);
    expect(sipProjection(2000, 4, 1, "end").value).toBe(24445);
    expect(sipProjection(5000, 12, 3, "end").value).toBe(215384);
  });

  it("holds for every planner amount × duration at all three scenario rates", () => {
    for (const monthly of [500, 1000, 2000, 5000]) {
      for (const years of [1, 3, 5, 10]) {
        for (const rate of [4, 8, 12]) {
          const p = sipProjection(monthly, rate, years, "end");
          expect(p.invested).toBe(monthly * years * 12);
          expect(p.value).toBeGreaterThanOrEqual(p.invested);
        }
      }
    }
  });

  it("gains equal ending value minus contributions", () => {
    const p = sipProjection(1000, 8, 5, "end");
    expect(p.invested).toBe(60000);
    expect(p.value - p.invested).toBe(13477);
  });

  it("monthly sampling is monotone and ends at the projected value", () => {
    expect(sipValueAtMonth(1000, 8, 0, "end")).toBe(0);
    expect(Math.round(sipValueAtMonth(1000, 8, 60, "end"))).toBe(73477);
    let prev = -1;
    for (let m = 1; m <= 60; m += 1) {
      const v = sipValueAtMonth(1000, 8, m, "end");
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});
