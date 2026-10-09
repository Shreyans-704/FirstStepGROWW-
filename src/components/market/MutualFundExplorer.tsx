/**
 * Mutual fund discovery — real AMFI NAV data (via mfapi.in) served by
 * the existing TanStack server. Latest published NAV only, never a
 * live price; trailing returns computed from real NAV history.
 * Falls back to an educational category explorer with zero statistics
 * when data is unreachable.
 */
import { CircleAlert, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fmtNav, fmtPct, fmtSessionDate } from "@/lib/market/format";
import { FUNDS, MF_CATEGORIES, type MfCategory } from "@/lib/market/universe";
import type { FundSnapshot } from "@/lib/market/mfapi.server";
import { getFundSnapshot } from "@/lib/market/mfapi.server";
import { cn } from "@/lib/utils";

function MiniSpark({ data }: { data: number[] }) {
  const pts = useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    return data
      .map(
        (v, i) =>
          `${((i / (data.length - 1)) * 120).toFixed(1)},${(34 - ((v - min) / span) * 28).toFixed(1)}`,
      )
      .join(" ");
  }, [data]);
  if (!pts) return null;
  return (
    <svg viewBox="0 0 120 36" aria-hidden="true" className="h-9 w-full">
      <polyline points={pts} fill="none" stroke="#00e6b8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MutualFundExplorer() {
  const [category, setCategory] = useState<"All Funds" | MfCategory>("All Funds");
  const [funds, setFunds] = useState<FundSnapshot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFundSnapshot()
      .then((s) => {
        if (!cancelled) {
          setFunds(s.funds);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Fund data failed to load.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!funds) return [];
    return category === "All Funds" ? funds : funds.filter((f) => f.category === category);
  }, [funds, category]);

  return (
    <section aria-labelledby="mf-explore-heading" className="mt-8 min-w-0">
      <h2
        id="mf-explore-heading"
        className="font-display text-2xl font-bold tracking-tight text-foreground"
      >
        Explore Mutual Funds
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Learn how different fund categories work before deciding what suits your goals.
      </p>

      <div role="group" aria-label="Filter funds by category" className="mt-4 flex flex-wrap gap-2">
        {MF_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "min-h-9 rounded-full border px-3.5 text-[13px] font-medium transition-all",
              category === c
                ? "border-primary bg-primary font-semibold text-primary-foreground"
                : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <div aria-label="Loading fund data" role="status" className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/[0.04] motion-safe:animate-pulse" />
            ))}
          </div>
        ) : error || visible.length === 0 ? (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-surface/70 p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Fund numbers unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ??
                    "No funds in this category right now. Live NAVs need the daily AMFI feed — nothing is estimated here."}
                </p>
              </div>
            </div>
            <ul className="space-y-3">
              {FUNDS.filter((f) => category === "All Funds" || f.category === category).map((f) => (
                <li key={f.code} className="rounded-xl border border-white/10 p-3.5">
                  <p className="text-sm font-bold text-foreground">
                    {f.name} <span className="font-normal text-muted-foreground">· {f.plan}</span>
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {f.blurb}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-primary">{f.category}</p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Category guide only — no NAVs, no returns shown until the feed responds. Risk levels,
              costs and objectives live in each fund&apos;s scheme documents.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((f) => (
              <li
                key={f.code}
                className="rounded-2xl border border-white/10 bg-surface/70 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{f.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.plan} · {f.category}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg font-bold text-foreground">
                      {fmtNav(f.nav)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      NAV · {fmtSessionDate(f.navDateISO)}
                    </p>
                  </div>
                </div>
                <MiniSpark data={f.spark} />
                <div
                  className="mt-2 flex flex-wrap gap-1.5"
                  aria-label="NAV-based trailing returns"
                >
                  {(
                    [
                      ["1Y", f.r1],
                      ["3Y", f.r3],
                      ["5Y", f.r5],
                    ] as const
                  ).map(([label, r]) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      <TrendingUp className="h-3 w-3 text-primary" aria-hidden="true" />
                      {label}{" "}
                      <span className="text-foreground">
                        {r === null ? "n/a" : fmtPct(r * 100)}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {f.blurb} Past NAV movement is history, not a promise — and the highest return
                  here is not automatically the best choice. Check risk, costs and objectives.
                </p>
              </li>
            ))}
          </ul>
        )}
        {!loading && !error && funds && funds.length > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Latest published NAVs · AMFI via mfapi.in · NAVs update once daily, not intraday.
          </p>
        )}
      </div>
    </section>
  );
}
