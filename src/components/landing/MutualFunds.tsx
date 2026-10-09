/**
 * Section 4 — Mutual fund education with an interactive,
 * explicitly illustrative SIP sketch. No historical returns invented.
 */
import { ArrowRight, CalendarClock, Layers, PiggyBank, Scale } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SECTION_ANCHORS } from "@/config/site";
import { inr } from "@/lib/firststep";
import { sipProjection } from "@/lib/learn";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal } from "./Reveal";

const CONCEPTS = [
  {
    icon: Layers,
    title: "What a mutual fund is",
    text: "Money pooled from many investors and managed as one portfolio — you own units of the whole, not single stocks.",
  },
  {
    icon: PiggyBank,
    title: "What an SIP is",
    text: "A fixed amount invested on a schedule. It builds a habit; it doesn't remove market risk.",
  },
  {
    icon: CalendarClock,
    title: "Why time horizon matters",
    text: "Money you need next year should be treated very differently from money you need in ten.",
  },
  {
    icon: Scale,
    title: "Risk differs by category",
    text: "Equity funds swing more, debt funds relatively less, hybrid sits between. Nothing here is risk-free.",
  },
];

const AMOUNTS = [1000, 2000, 5000];
const RATES = [6, 10, 12];

function curvePath(yearly: number[]): string {
  const W = 400;
  const H = 190;
  const PAD = 10;
  const max = Math.max(...yearly, 1);
  const n = yearly.length - 1;
  const pts = yearly.map((v, i) => {
    const x = PAD + (i / Math.max(n, 1)) * (W - PAD * 2);
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${pts.join(" L")}`;
}

export function MutualFunds() {
  const [amount, setAmount] = useState(2000);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);

  const proj = useMemo(() => sipProjection(amount, rate, years), [amount, rate, years]);
  const line = useMemo(() => curvePath(proj.yearly), [proj]);

  return (
    <section
      id="mutual-funds"
      aria-labelledby="mf-heading"
      className="relative scroll-mt-20 border-t border-white/10 bg-background"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="max-w-2xl">
          <Eyebrow>STEP TWO · UNDERSTAND THE ENGINE</Eyebrow>
          <h2
            id="mf-heading"
            className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl"
          >
            Understand what your money is doing.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <ul className="space-y-6">
              {CONCEPTS.map((c, i) => (
                <Reveal key={c.title} delay={i * 70}>
                  <li className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="font-display text-lg font-bold tracking-tight text-foreground">
                        {c.title}
                      </span>
                      <span className="mt-1 block text-[15px] leading-relaxed text-muted-foreground">
                        {c.text}
                      </span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={120}>
              <p className="mt-8 rounded-2xl border border-warning/30 bg-warning-soft/40 p-4 text-sm leading-relaxed text-foreground">
                <strong>Past returns don&apos;t promise future ones.</strong> A fund that did well
                for five years can still fall. Treat every return number you see as history, not a
                guarantee.
              </p>
              <Link
                to="/risk"
                hash={SECTION_ANCHORS.knowledgeHub}
                className="btn btn-outline mt-6 !h-[52px] !rounded-full !px-7 !text-[15px]"
              >
                Understand Mutual Funds <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 md:p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                  Sketch an SIP
                </h3>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold tracking-wide text-primary">
                  ILLUSTRATIVE — NOT A PREDICTION
                </span>
              </div>

              <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                MONTHLY AMOUNT
              </p>
              <div role="group" aria-label="Monthly amount" className="mt-2 flex flex-wrap gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={amount === a}
                    onClick={() => setAmount(a)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-medium transition-all",
                      amount === a
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
                    )}
                  >
                    {inr(a)}
                  </button>
                ))}
              </div>

              <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-muted-foreground">
                ASSUMED GROWTH — HYPOTHETICAL
              </p>
              <div
                role="group"
                aria-label="Assumed annual growth"
                className="mt-2 flex flex-wrap gap-2"
              >
                {RATES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={rate === r}
                    onClick={() => setRate(r)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-medium transition-all",
                      rate === r
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
                    )}
                  >
                    {r}% p.a.
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-4">
                <label
                  htmlFor="mf-years"
                  className="text-xs font-semibold tracking-[0.14em] text-muted-foreground"
                >
                  TIME HORIZON
                </label>
                <span aria-hidden="true" className="font-display text-sm font-bold text-foreground">
                  {years} {years === 1 ? "year" : "years"}
                </span>
              </div>
              <input
                id="mf-years"
                type="range"
                min={1}
                max={20}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-2 w-full accent-[#00e6b8]"
                aria-valuetext={`${years} years`}
              />

              <div aria-live="polite" className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-xs text-muted-foreground">You put in</p>
                  <p className="mt-1 font-display text-2xl font-bold text-foreground">
                    {inr(proj.invested)}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
                  <p className="text-xs text-muted-foreground">Illustrative value</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">
                    {inr(proj.value)}
                  </p>
                </div>
              </div>

              <svg
                viewBox="0 0 400 200"
                role="img"
                aria-label="Illustrative growth sketch, not real returns"
                className="mt-4 w-full"
              >
                <defs>
                  <linearGradient id="mf-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#00e6b8" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#00e6b8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
                  {[50, 100, 150].map((y) => (
                    <line key={y} x1="0" y1={y} x2="400" y2={y} />
                  ))}
                </g>
                <path d={`${line} L 390,190 L 10,190 Z`} fill="url(#mf-fill)" />
                <path
                  d={line}
                  fill="none"
                  stroke="#00e6b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Hypothetical {rate}% annual growth on {inr(amount)}/month for {years}{" "}
                {years === 1 ? "year" : "years"}. Real funds fluctuate, charge fees, and can lose
                money — this sketch ignores all of that on purpose.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
