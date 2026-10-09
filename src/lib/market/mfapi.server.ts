/**
 * Mutual-fund NAV snapshot served through the existing TanStack server.
 * Source: AMFI data mirrored by mfapi.in (free, no credentials).
 * NAV is published once daily — always labelled as latest published NAV,
 * never as a live price. 12-hour cache; trailing returns are computed
 * from the real NAV history, never invented.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { monthlySamples, parseNavDate, trailingCagr, type NavPoint } from "./calc";
import { FUNDS, type MfCategory } from "./universe";

export type FundSnapshot = {
  code: number;
  name: string;
  plan: string;
  category: MfCategory;
  blurb: string;
  nav: number;
  navDateISO: string;
  r1: number | null;
  r3: number | null;
  r5: number | null;
  spark: number[];
};

export type FundUniverse = {
  funds: FundSnapshot[];
  source: string;
};

const TTL_MS = 12 * 3600 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

let cached: { at: number; data: FundUniverse } | null = null;

const mfSchema = z.object({
  meta: z.object({ scheme_name: z.string() }).passthrough(),
  data: z.array(z.object({ date: z.string(), nav: z.string() }).passthrough()),
});

async function fetchFund(
  code: number,
  name: string,
  plan: string,
  category: MfCategory,
  blurb: string,
): Promise<FundSnapshot | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${code}`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const parsed = mfSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    const points: NavPoint[] = [];
    for (const row of parsed.data.data) {
      const t = parseNavDate(row.date);
      const nav = Number(row.nav);
      if (Number.isFinite(t) && Number.isFinite(nav) && nav > 0) points.push({ t, nav });
    }
    if (points.length < 30) return null;
    points.sort((a, b) => a.t - b.t);
    const latest = points[points.length - 1];
    if (!latest) return null;
    return {
      code,
      name,
      plan,
      category,
      blurb,
      nav: latest.nav,
      navDateISO: new Date(latest.t).toISOString(),
      r1: trailingCagr(points, 1),
      r3: trailingCagr(points, 3),
      r5: trailingCagr(points, 5),
      spark: monthlySamples(points, 12),
    };
  } catch {
    return null;
  }
}

export const getFundSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
  const funds = (
    await Promise.all(FUNDS.map((f) => fetchFund(f.code, f.name, f.plan, f.category, f.blurb)))
  ).filter((f): f is FundSnapshot => f !== null);
  if (funds.length === 0) {
    throw new Error(
      "Fund data is unreachable right now. NAVs are published daily — retry in a bit.",
    );
  }
  const data: FundUniverse = { funds, source: "AMFI via mfapi.in" };
  cached = { at: Date.now(), data };
  return data;
});
