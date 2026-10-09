/**
 * NSE equity snapshot served through the existing TanStack server.
 * Why server-side: Yahoo Finance has no browser CORS headers, and free
 * NSE data is delayed/end-of-day — never labelled live here.
 * No credentials. 5-minute cache; mount + manual refresh only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidQuote, type MoverRow } from "./calc";
import { UNIVERSES, type IndexKey } from "./universe";

export type MarketStatus = "delayed" | "closed" | "stale";

export type MarketSnapshot = {
  quotes: MoverRow[];
  sessionDate: string;
  status: MarketStatus;
  source: string;
  universe: IndexKey;
};

const TTL_MS = 5 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const cache = new Map<string, { at: number; data: MarketSnapshot }>();

const barSchema = z
  .object({
    close: z.array(z.number().nullable()),
    high: z.array(z.number().nullable()),
    low: z.array(z.number().nullable()),
    volume: z.array(z.number().nullable()),
  })
  .passthrough();

const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z
          .object({
            meta: z
              .object({
                fiftyTwoWeekHigh: z.number().nullable().optional(),
                fiftyTwoWeekLow: z.number().nullable().optional(),
              })
              .passthrough(),
            timestamp: z.array(z.number()),
            indicators: z.object({ quote: z.array(barSchema) }),
          })
          .passthrough(),
      )
      .nullable(),
    error: z.unknown().nullable().optional(),
  }),
});

const IST_MS = 5.5 * 3600 * 1000;

function istDay(ms: number): string {
  const d = new Date(ms + IST_MS);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function marketStatus(latestMs: number, nowMs: number): MarketStatus {
  if (latestMs > nowMs || nowMs - latestMs > 7 * 86400000) return "stale";
  const now = new Date(nowMs + IST_MS);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const weekday = now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
  const sameSession = istDay(latestMs) === istDay(nowMs);
  if (weekday && sameSession && mins >= 555 && mins <= 930) return "delayed";
  return "closed";
}

async function fetchSymbol(symbol: string, name: string, ticker: string): Promise<MoverRow | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return null;
    const parsed = chartSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    const row = parsed.data.chart.result?.[0];
    const bar = row?.indicators.quote[0];
    const stamps = row?.timestamp;
    if (!row || !bar || !stamps || bar.close.length !== stamps.length) return null;

    const closes: { t: number; c: number }[] = [];
    for (let i = 0; i < stamps.length; i += 1) {
      const c = bar.close[i];
      const t = stamps[i];
      if (typeof c === "number" && Number.isFinite(c) && typeof t === "number") {
        closes.push({ t: t * 1000, c });
      }
    }
    if (closes.length < 2) return null;
    const last = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    if (!last || !prev || prev.c <= 0) return null;

    const vols: number[] = [];
    for (const v of bar.volume) {
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) vols.push(v);
    }
    if (vols.length === 0) return null;
    const lastVol = vols[vols.length - 1];
    const recent = vols.slice(-20);
    if (lastVol === undefined || recent.length === 0) return null;
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;

    const fin = (xs: (number | null | undefined)[]): number | null => {
      for (let i = xs.length - 1; i >= 0; i -= 1) {
        const n = xs[i];
        if (typeof n === "number" && Number.isFinite(n)) return n;
      }
      return null;
    };
    const dayHigh = fin(bar.high);
    const dayLow = fin(bar.low);
    const w52h = row.meta.fiftyTwoWeekHigh;
    const w52l = row.meta.fiftyTwoWeekLow;
    if (dayHigh === null || dayLow === null) return null;
    if (typeof w52h !== "number" || !Number.isFinite(w52h)) return null;
    if (typeof w52l !== "number" || !Number.isFinite(w52l)) return null;

    const change = last.c - prev.c;
    const quote: MoverRow = {
      symbol,
      ticker,
      name,
      price: last.c,
      prevClose: prev.c,
      change,
      changePct: (change / prev.c) * 100,
      dayHigh,
      dayLow,
      volume: lastVol,
      avgVolume20: avg,
      week52High: w52h,
      week52Low: w52l,
      spark: closes.slice(-30).map((p) => p.c),
      sessionDate: new Date(last.t).toISOString(),
    };
    return isValidQuote(quote) ? quote : null;
  } catch {
    return null;
  }
}

export const getMarketSnapshot = createServerFn({ method: "GET" })
  .validator(
    z.object({
      universe: z.enum(["nifty-50", "nifty-next-50"]),
      refresh: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const uni = UNIVERSES[data.universe];
    if (!uni) throw new Error("Unknown market universe.");
    const key = `market:${data.universe}`;
    const hit = cache.get(key);
    if (hit && !data.refresh && Date.now() - hit.at < TTL_MS) return hit.data;

    const quotes = (
      await Promise.all(uni.stocks.map((s) => fetchSymbol(s.symbol, s.name, s.ticker)))
    ).filter((q): q is MoverRow => q !== null);

    if (quotes.length === 0) {
      throw new Error(
        "Market data is unreachable right now. Check your connection and retry — nothing here is estimated.",
      );
    }
    const latest = quotes.reduce((a, b) => (a.sessionDate > b.sessionDate ? a : b)).sessionDate;
    const snapshot: MarketSnapshot = {
      quotes,
      sessionDate: latest,
      status: marketStatus(Date.parse(latest), Date.now()),
      source: "Yahoo Finance (NSE)",
      universe: data.universe,
    };
    cache.set(key, { at: Date.now(), data: snapshot });
    return snapshot;
  });
