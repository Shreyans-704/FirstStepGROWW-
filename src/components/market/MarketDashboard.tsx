/**
 * Market Intelligence dashboard — real NSE data via the server-side
 * Yahoo Finance integration (see lib/market/yahoo.server.ts).
 * Delayed/end-of-day data, always labelled as such. Never live.
 */
import { ArrowDown, ArrowUp, ChevronDown, CircleAlert, RefreshCw } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { fmtChangeAbs, fmtPct, fmtPrice, fmtSessionDate, fmtVolume } from "@/lib/market/format";
import {
  rankMovers,
  shockRatio,
  sortRows,
  type MoverRow,
  type MoverTab,
  type SortKey,
} from "@/lib/market/calc";
import { INDEX_KEYS, UNIVERSES, type IndexKey } from "@/lib/market/universe";
import type { MarketSnapshot } from "@/lib/market/yahoo.server";
import { getMarketSnapshot } from "@/lib/market/yahoo.server";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/landing/Reveal";

const TABS: { key: MoverTab; label: string; why: string }[] = [
  {
    key: "gainers",
    label: "Gainers",
    why: "Largest one-session percentage gains in this sample.",
  },
  {
    key: "losers",
    label: "Losers",
    why: "Largest one-session percentage falls in this sample.",
  },
  {
    key: "volume",
    label: "Volume Shockers",
    why: "Highest trading volume versus the 20-session average.",
  },
];

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const pts = useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    return data
      .map(
        (v, i) =>
          `${((i / (data.length - 1)) * 96).toFixed(1)},${(26 - ((v - min) / span) * 22).toFixed(1)}`,
      )
      .join(" ");
  }, [data]);
  if (!pts) return null;
  const color = up ? "#00e6b8" : "#f25555";
  return (
    <svg viewBox="0 0 96 28" aria-hidden="true" className="h-7 w-24">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StatusPill({ status }: { status: MarketSnapshot["status"] }) {
  if (status === "delayed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-bold text-warning">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warning" />
        Delayed data
      </span>
    );
  if (status === "stale")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive-soft px-3 py-1 text-xs font-bold text-destructive">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-destructive" />
        Stale data
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold text-muted-foreground">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Market closed
    </span>
  );
}

export function MarketDashboard() {
  const [universe, setUniverse] = useState<IndexKey>("nifty-50");
  const [tab, setTab] = useState<MoverTab>("gainers");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [snap, setSnap] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMarketSnapshot({ data: { universe, refresh: nonce > 0 } })
      .then((s) => {
        if (!cancelled) {
          setSnap(s);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Market data failed to load.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [universe, nonce]);

  function pickTab(t: MoverTab) {
    setTab(t);
    setSort(null);
    setExpanded(null);
  }
  function pickUniverse(u: IndexKey) {
    setUniverse(u);
    setSort(null);
    setExpanded(null);
  }
  function toggleSort(key: SortKey) {
    setSort((s) =>
      s?.key !== key ? { key, dir: "desc" } : { key, dir: s.dir === "desc" ? "asc" : "desc" },
    );
  }

  const rows = useMemo(() => {
    if (!snap) return [];
    const ranked = rankMovers(snap.quotes, tab);
    return sort ? sortRows(ranked, sort.key, sort.dir) : ranked;
  }, [snap, tab, sort]);

  const tabWhy = TABS.find((t) => t.key === tab)?.why ?? "";
  const uni = UNIVERSES[universe];

  function sortBtn(key: SortKey, label: string) {
    const activeSort = sort?.key === key;
    return (
      <button
        type="button"
        onClick={() => toggleSort(key)}
        aria-label={`Sort by ${label}${activeSort ? `, currently ${sort?.dir ?? ""}` : ""}`}
        className="inline-flex items-center gap-1 rounded text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {activeSort &&
          (sort?.dir === "desc" ? (
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
          ))}
      </button>
    );
  }

  function detailRow(r: MoverRow) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1 py-3 text-[13px] sm:grid-cols-4">
        <p className="text-muted-foreground">
          Prev. close <strong className="block text-foreground">{fmtPrice(r.prevClose)}</strong>
        </p>
        <p className="text-muted-foreground">
          Day range{" "}
          <strong className="block text-foreground">
            {fmtPrice(r.dayLow)} – {fmtPrice(r.dayHigh)}
          </strong>
        </p>
        <p className="text-muted-foreground">
          52-week range{" "}
          <strong className="block text-foreground">
            {fmtPrice(r.week52Low)} – {fmtPrice(r.week52High)}
          </strong>
        </p>
        <p className="text-muted-foreground">
          Volume vs avg{" "}
          <strong className="block text-foreground">
            {fmtVolume(r.volume)} · {shockRatio(r).toFixed(1)}×
          </strong>
        </p>
        <p className="col-span-2 text-muted-foreground sm:col-span-4">
          Listed here because: {tabWhy} One session never judges an investment.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="market-intel-heading" className="min-w-0">
      <Eyebrow>MARKET INTELLIGENCE</Eyebrow>
      <h2
        id="market-intel-heading"
        className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        What&apos;s moving today?
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        Explore market movements and understand what is happening across stocks and mutual funds.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {snap && !loading && <StatusPill status={snap.status} />}
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {loading
            ? "Fetching latest session…"
            : snap
              ? `Data as of ${fmtSessionDate(snap.sessionDate)} · ${snap.source} · Delayed`
              : ""}
        </p>
        <button
          type="button"
          onClick={() => setNonce((n) => n + 1)}
          disabled={loading}
          className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-[13px] font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", loading && "motion-safe:animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Market movers view" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => pickTab(t.key)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-all",
                tab === t.key
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <label htmlFor="market-universe" className="sr-only">
            Market index universe
          </label>
          <select
            id="market-universe"
            value={universe}
            onChange={(e) => pickUniverse(e.target.value as IndexKey)}
            className="field !min-h-10 w-auto appearance-none !rounded-full pr-9 text-sm font-semibold"
          >
            {INDEX_KEYS.map((k) => (
              <option key={k} value={k}>
                {UNIVERSES[k]?.label ?? k}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{uni.note} · Session moves only.</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-surface/70">
        {loading ? (
          <div aria-label="Loading market data" className="space-y-2 p-4" role="status">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.04] motion-safe:animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="space-y-2 p-6 text-center">
            <CircleAlert className="mx-auto h-7 w-7 text-destructive" aria-hidden="true" />
            <p className="font-semibold text-foreground">Market data unavailable</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="btn btn-outline mx-auto mt-2 !min-h-10 !rounded-full !px-5 !text-sm"
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p role="status" className="p-6 text-center text-sm text-muted-foreground">
            No rows in this view right now — try another tab or index.
          </p>
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-muted-foreground">
                    <th
                      scope="col"
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    >
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    >
                      Price trend
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {sortBtn("price", "Market price")}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {sortBtn("changePct", "Change")}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider"
                    >
                      {sortBtn("volume", "Volume")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {rows.map((r) => {
                    const up = r.changePct >= 0;
                    const open = expanded === r.symbol;
                    return (
                      <Fragment key={r.symbol}>
                        <tr className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setExpanded(open ? null : r.symbol)}
                              aria-expanded={open}
                              className="block rounded text-left"
                            >
                              <span className="block font-semibold text-foreground hover:text-primary">
                                {r.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {r.ticker} · NSE
                              </span>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <Sparkline data={r.spark} up={up} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {fmtPrice(r.price)}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 text-right font-semibold",
                              up ? "text-primary" : "text-[#f25555]",
                            )}
                          >
                            {fmtChangeAbs(r.change)}
                            <span className="block text-xs">{fmtPct(r.changePct)}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {fmtVolume(r.volume)}
                          </td>
                        </tr>
                        {open && (
                          <tr className="bg-white/[0.02]">
                            <td colSpan={5} className="px-4 py-1">
                              {detailRow(r)}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <ul className="divide-y divide-white/[0.06] md:hidden">
              {rows.map((r) => {
                const up = r.changePct >= 0;
                const open = expanded === r.symbol;
                return (
                  <li key={r.symbol}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : r.symbol)}
                      aria-expanded={open}
                      className="block w-full px-4 py-3 text-left"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground">
                            {r.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {r.ticker} · NSE
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-semibold text-foreground">
                            {fmtPrice(r.price)}
                          </span>
                          <span
                            className={cn(
                              "block text-[13px] font-semibold",
                              up ? "text-primary" : "text-[#f25555]",
                            )}
                          >
                            {fmtPct(r.changePct)}
                          </span>
                        </span>
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-3">
                        <Sparkline data={r.spark} up={up} />
                        <span className="text-xs text-muted-foreground">
                          Vol {fmtVolume(r.volume)}
                        </span>
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-white/[0.06] px-4">{detailRow(r)}</div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-white/10 px-4 py-3 md:hidden">
              <label htmlFor="mover-sort" className="sr-only">
                Sort movers
              </label>
              <select
                id="mover-sort"
                value={sort ? `${sort.key}-${sort.dir}` : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setSort(null);
                    return;
                  }
                  const [key, dir] = v.split("-") as [SortKey, "asc" | "desc"];
                  setSort({ key, dir });
                }}
                className="field !min-h-10 w-full appearance-none text-sm"
              >
                <option value="">
                  Sort:{" "}
                  {tab === "losers"
                    ? "Biggest falls"
                    : tab === "volume"
                      ? "Unusual volume"
                      : "Biggest gains"}
                </option>
                <option value="changePct-desc">Change: highest first</option>
                <option value="changePct-asc">Change: lowest first</option>
                <option value="price-desc">Price: highest first</option>
                <option value="volume-desc">Volume: highest first</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Why is a stock listed?</strong> {tabWhy} Lists reflect
          one session in a small sample — not a recommendation.
        </p>
        <p>
          A stock rising today is not automatically a good investment, and a falling one is not
          automatically a bargain. Educational context only — not financial advice.
        </p>
      </div>
    </section>
  );
}
