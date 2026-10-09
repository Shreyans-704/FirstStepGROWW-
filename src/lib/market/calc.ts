/**
 * Pure market calculations shared by server functions and UI.
 * Everything here is unit-tested; providers only supply raw numbers.
 */

export type MoverTab = "gainers" | "losers" | "volume";

export type MoverRow = {
  symbol: string;
  ticker: string;
  name: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume20: number;
  week52High: number;
  week52Low: number;
  spark: number[];
  sessionDate: string;
};

export function shockRatio(r: Pick<MoverRow, "volume" | "avgVolume20">): number {
  if (!Number.isFinite(r.volume) || !Number.isFinite(r.avgVolume20) || r.avgVolume20 <= 0) return 0;
  return r.volume / r.avgVolume20;
}

/** Rank rows for a tab. Never invents rows — only orders what exists. */
export function rankMovers(rows: MoverRow[], tab: MoverTab, limit = 8): MoverRow[] {
  const list = [...rows];
  if (tab === "gainers") list.sort((a, b) => b.changePct - a.changePct);
  else if (tab === "losers") list.sort((a, b) => a.changePct - b.changePct);
  else list.sort((a, b) => shockRatio(b) - shockRatio(a));
  return list.slice(0, limit);
}

export type SortKey = "changePct" | "price" | "volume";

export function sortRows(rows: MoverRow[], key: SortKey, dir: "asc" | "desc"): MoverRow[] {
  const list = [...rows];
  const val = (r: MoverRow) => (key === "volume" ? r.volume : r[key]);
  list.sort((a, b) => (dir === "asc" ? val(a) - val(b) : val(b) - val(a)));
  return list;
}

export function isValidQuote(q: Partial<MoverRow>): q is MoverRow {
  const nums = [
    q.price,
    q.prevClose,
    q.change,
    q.changePct,
    q.dayHigh,
    q.dayLow,
    q.volume,
    q.avgVolume20,
  ];
  if (!nums.every((n) => typeof n === "number" && Number.isFinite(n))) return false;
  if (typeof q.symbol !== "string" || q.symbol.length === 0) return false;
  if (!Array.isArray(q.spark) || q.spark.length < 2) return false;
  if (typeof q.sessionDate !== "string" || Number.isNaN(Date.parse(q.sessionDate))) return false;
  return true;
}

/* ---------- NAV-based trailing returns (computed from real NAV history) ---------- */

export type NavPoint = { t: number; nav: number };

export function parseNavDate(s: string): number {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
  if (!m) return NaN;
  return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

/**
 * CAGR between the latest NAV and the NAV nearest `yearsBack` years earlier.
 * Returns null when history doesn't cover the period honestly.
 */
export function trailingCagr(points: NavPoint[], yearsBack: number): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.t - b.t);
  const latest = sorted[sorted.length - 1];
  if (!latest || latest.nav <= 0) return null;
  const target = latest.t - yearsBack * 365.25 * 86400000;
  const base = sorted.find((p) => p.t >= target);
  if (!base || base.nav <= 0) return null;
  const daysCovered = (latest.t - base.t) / 86400000;
  if (daysCovered < yearsBack * 365.25 * 0.9) return null;
  return Math.pow(latest.nav / base.nav, 365.25 / daysCovered) - 1;
}

/** One NAV sample per ~30 days over the trailing year, for sparklines. */
export function monthlySamples(points: NavPoint[], count = 12): number[] {
  if (points.length === 0) return [];
  const sorted = [...points].sort((a, b) => a.t - b.t);
  const latest = sorted[sorted.length - 1];
  if (!latest) return [];
  const out: number[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const target = latest.t - i * 30.44 * 86400000;
    const pt = sorted.find((p) => p.t >= target) ?? sorted[0];
    if (pt) out.push(pt.nav);
  }
  return out;
}
