import { useEffect, useRef, useState } from "react";
import { HUB_VIDEOS, type HubVideo, type VideoCategory } from "@/config/videos";

/** Pure helpers for Part 2 sections — covered by vitest. */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* ---------- Scroll-reveal hook (no animation libraries) ---------- */

export function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ---------- Knowledge Hub filtering ---------- */

export function filterVideos(videos: HubVideo[], category: VideoCategory): HubVideo[] {
  if (category === "All Videos") return videos;
  return videos.filter((v) => v.category === category);
}

export function categoryCount(videos: HubVideo[], category: VideoCategory): number {
  return filterVideos(videos, category).length;
}

export function allCategoriesPresent(): boolean {
  const cats = new Set(HUB_VIDEOS.map((v) => v.category));
  return (
    cats.has("Stock Market Basics") &&
    cats.has("Mutual Funds") &&
    cats.has("SIPs & Compounding") &&
    cats.has("Risk Management") &&
    cats.has("Financial Myths")
  );
}

/* ---------- Readiness checklist (in-memory only — never persisted) ---------- */

export type ChecklistId = "safety-net" | "budget" | "goals" | "age";

export const CHECKLIST_ITEMS: { id: ChecklistId; title: string; text: string }[] = [
  {
    id: "safety-net",
    title: "Your safety net",
    text: "I know roughly how many months of expenses my savings could cover.",
  },
  {
    id: "budget",
    title: "Your monthly budget",
    text: "I've tracked what I earn, spend, and pay as EMI in a typical month.",
  },
  {
    id: "goals",
    title: "Your financial goals",
    text: "I know when I might need this money — my time horizon.",
  },
  {
    id: "age",
    title: "Age 20 or older",
    text: "I confirm I am 20 years old or older.",
  },
];

export function checklistProgress(checked: ChecklistId[]): number {
  return Math.min(checked.length, CHECKLIST_ITEMS.length);
}

export function toggleChecklist(checked: ChecklistId[], id: ChecklistId): ChecklistId[] {
  return checked.includes(id) ? checked.filter((c) => c !== id) : [...checked, id];
}

/* ---------- Financial snapshot (readiness companion) ---------- */

export type SnapshotValues = {
  income?: string;
  expenses?: string;
  emi?: string;
  emergencyMonths?: string;
  horizonYears?: string;
};

export type FinanceSummary = {
  hasAny: boolean;
  income: number | undefined;
  expenses: number | undefined;
  emi: number | undefined;
  commitments: number | undefined;
  leftover: number | undefined;
  emergencyMonths: number | undefined;
  horizonYears: number | undefined;
};

function snapshotNum(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/**
 * Derive displayable metrics from raw form strings.
 * Missing or invalid fields stay undefined — never treated as zero.
 * No essential/discretionary split is invented: fixed expenses are
 * summed as-is, and no emergency-fund amount is derived from them.
 */
export function summarizeFinances(values: SnapshotValues): FinanceSummary {
  const income = snapshotNum(values.income);
  const expenses = snapshotNum(values.expenses);
  const emi = snapshotNum(values.emi);
  const emergencyMonths = snapshotNum(values.emergencyMonths);
  const horizonYears = snapshotNum(values.horizonYears);
  const hasAny =
    income !== undefined ||
    expenses !== undefined ||
    emi !== undefined ||
    emergencyMonths !== undefined ||
    horizonYears !== undefined;
  const commitments = expenses !== undefined && emi !== undefined ? expenses + emi : undefined;
  const leftover =
    income !== undefined && commitments !== undefined ? income - commitments : undefined;
  return { hasAny, income, expenses, emi, commitments, leftover, emergencyMonths, horizonYears };
}

/* ---------- Illustrative SIP projection (explicitly hypothetical) ---------- */

export type SipProjection = {
  invested: number;
  value: number;
  /** Cumulative illustrative value sampled once per year (years+1 points). */
  yearly: number[];
};

/**
 * Future value of a monthly SIP at a hypothetical fixed annual rate.
 * `timing: "due"` (default) treats contributions as start-of-month, matching
 * earlier behaviour; `"end"` treats them as end-of-month.
 * Educational illustration only — not a prediction of any real return.
 */
export function sipValueAtMonth(
  monthly: number,
  annualRatePct: number,
  month: number,
  timing: "due" | "end" = "due",
): number {
  const p = Math.max(0, monthly);
  const n = Math.max(0, Math.floor(month));
  if (n === 0 || p === 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return p * n;
  const fv = p * ((Math.pow(1 + r, n) - 1) / r);
  return timing === "due" ? fv * (1 + r) : fv;
}

export function sipProjection(
  monthly: number,
  annualRatePct: number,
  years: number,
  timing: "due" | "end" = "due",
): SipProjection {
  const safeMonthly = Math.max(0, monthly);
  const safeYears = Math.max(0, Math.floor(years));
  const totalMonths = safeYears * 12;
  const invested = safeMonthly * totalMonths;
  if (totalMonths === 0 || safeMonthly === 0) {
    return { invested, value: invested, yearly: [invested] };
  }
  const fv = (n: number) => sipValueAtMonth(safeMonthly, annualRatePct, n, timing);
  const yearly: number[] = [];
  for (let y = 0; y <= safeYears; y += 1) yearly.push(Math.round(fv(y * 12)));
  return { invested, value: Math.round(fv(totalMonths)), yearly };
}
