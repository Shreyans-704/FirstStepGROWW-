import { describe, expect, it } from "vitest";
import {
  monthlySamples,
  parseNavDate,
  rankMovers,
  shockRatio,
  sortRows,
  trailingCagr,
  type MoverRow,
} from "@/lib/market/calc";
import { fmtChangeAbs, fmtPct, fmtPrice, fmtSessionDate, fmtVolume } from "@/lib/market/format";
import { FUNDS, MF_CATEGORIES, UNIVERSES } from "@/lib/market/universe";

const row = (over: Partial<MoverRow>): MoverRow => ({
  symbol: "X.NS",
  ticker: "X",
  name: "X Ltd",
  price: 100,
  prevClose: 98,
  change: 2,
  changePct: 2.04,
  dayHigh: 101,
  dayLow: 97,
  volume: 100000,
  avgVolume20: 50000,
  week52High: 120,
  week52Low: 80,
  spark: [97, 98, 99, 100],
  sessionDate: new Date("2026-10-08T10:00:00Z").toISOString(),
  ...over,
});

describe("indian formatting", () => {
  it("formats prices with 2 decimals and indian grouping", () => {
    expect(fmtPrice(1245.6)).toBe("₹1,245.60");
    expect(fmtPrice(1245614)).toBe("₹12,45,614.00");
  });

  it("signs changes with minus sign, not hyphen", () => {
    expect(fmtChangeAbs(2.45)).toBe("+2.45");
    expect(fmtChangeAbs(-1.2)).toBe("−1.20");
    expect(fmtPct(-0.654)).toBe("-0.65%");
    expect(fmtPct(4.72)).toBe("+4.72%");
  });

  it("groups volumes indian-style", () => {
    expect(fmtVolume(1245678)).toBe("12,45,678");
  });

  it("handles garbage gracefully", () => {
    expect(fmtPrice(NaN)).toBe("—");
    expect(fmtVolume(-5)).toBe("—");
    expect(fmtSessionDate("not-a-date")).toBe("—");
    expect(fmtSessionDate(new Date("2026-10-08T04:00:00Z").toISOString())).toContain("2026");
  });
});

describe("mover ranking", () => {
  const rows = [
    row({ symbol: "a", changePct: 5 }),
    row({ symbol: "b", changePct: -3 }),
    row({ symbol: "c", changePct: 1, volume: 500000, avgVolume20: 50000 }),
    row({ symbol: "d", changePct: -0.5, volume: 10000, avgVolume20: 100000 }),
  ];

  it("ranks gainers, losers and volume shockers", () => {
    expect(rankMovers(rows, "gainers")[0]?.symbol).toBe("a");
    expect(rankMovers(rows, "losers")[0]?.symbol).toBe("b");
    expect(rankMovers(rows, "volume")[0]?.symbol).toBe("c");
  });

  it("sorts by price and volume both ways", () => {
    const byVol = sortRows(rows, "volume", "desc");
    expect(byVol[0]?.symbol).toBe("c");
    expect(sortRows(rows, "price", "asc")).toHaveLength(4);
  });

  it("computes shock ratios safely", () => {
    expect(shockRatio(rows[2]!)).toBe(10);
    expect(shockRatio(row({ volume: 10, avgVolume20: 0 }))).toBe(0);
  });
});

describe("nav maths", () => {
  it("parses dd-mm-yyyy dates", () => {
    expect(parseNavDate("08-10-2026")).toBe(Date.UTC(2026, 9, 8));
    expect(Number.isNaN(parseNavDate("junk"))).toBe(true);
  });

  it("computes cagr only with honest coverage", () => {
    const pts = Array.from({ length: 400 }, (_, i) => ({
      t: Date.UTC(2025, 9, 8) - (399 - i) * 86400000,
      nav: 100 + i * 0.05,
    }));
    const cagr = trailingCagr(pts, 1);
    expect(cagr).not.toBeNull();
    expect(cagr!).toBeGreaterThan(0);
    expect(trailingCagr(pts.slice(0, 100), 1)).toBeNull();
    expect(monthlySamples(pts, 12)).toHaveLength(12);
  });
});

describe("curated universe", () => {
  it("offers two verified index universes and all fund categories", () => {
    expect(Object.keys(UNIVERSES)).toEqual(["nifty-50", "nifty-next-50"]);
    for (const u of Object.values(UNIVERSES)) {
      expect(u.stocks.length).toBeGreaterThanOrEqual(5);
      for (const s of u.stocks) expect(s.symbol).toMatch(/\.NS$/);
    }
    expect(FUNDS.length).toBeGreaterThanOrEqual(5);
    const cats = new Set(FUNDS.map((f) => f.category));
    for (const c of MF_CATEGORIES.filter((c) => c !== "All Funds")) expect(cats.has(c)).toBe(true);
  });
});
