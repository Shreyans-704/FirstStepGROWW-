/**
 * Beginner-friendly growth visuals — stacked bars, donut, summary.
 * Hand-rolled divs/SVG, no new dependencies. Every figure derives from
 * sipProjection at render time; nothing is hardcoded.
 */
import { inr } from "@/lib/firststep";
import { sipProjection } from "@/lib/learn";

export const GROWTH_SCENARIOS = [
  { label: "Conservative", rate: 4, color: "#7DD3C0" },
  { label: "Moderate", rate: 8, color: "#00E6B8" },
  { label: "Higher-growth", rate: 12, color: "#65F5D2" },
] as const;

function scenarioRows(monthly: number, years: number) {
  const invested = Math.max(0, monthly) * Math.max(0, Math.floor(years)) * 12;
  const rows = GROWTH_SCENARIOS.map((s) => {
    const value = sipProjection(monthly, s.rate, years, "end").value;
    return { ...s, invested, value, gain: value - invested };
  });
  return { invested, rows, max: Math.max(...rows.map((r) => r.value), 1) };
}

export function GrowthBars({ monthly, years }: { monthly: number; years: number }) {
  const { invested, rows, max } = scenarioRows(monthly, years);
  const moderate = rows[1] ?? rows[0];
  const yearWord = years === 1 ? "year" : "years";

  return (
    <section className="card space-y-5" aria-label="Scenario comparison">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          What your money could become
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare how different assumed returns affect your ending value.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {r.label} <span className="font-normal text-muted-foreground">· {r.rate}%</span>
              </p>
              <p className="font-display text-xl font-bold tracking-tight text-foreground">
                {inr(r.value)}
              </p>
            </div>
            <div
              className="mt-2 flex h-8 overflow-hidden rounded-lg bg-white/[0.05]"
              role="img"
              aria-label={`${r.label}: ${inr(r.invested)} contributed and ${inr(r.gain)} illustrative growth, ending at ${inr(r.value)}`}
            >
              <div
                className="h-full shrink-0 bg-muted-foreground/50"
                style={{ width: `${(r.invested / max) * 100}%` }}
              />
              <div
                className="h-full shrink-0"
                style={{
                  width: `${(Math.max(0, r.gain) / max) * 100}%`,
                  background: r.color,
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {inr(r.invested)} put in + {inr(Math.max(0, r.gain))} growth
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/60" />
          Contributions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Illustrative growth
        </span>
        <span aria-hidden="true" className="w-full sm:w-auto sm:flex-1" />
        <span>Total value = Contributions + Illustrative growth.</span>
      </div>

      <p aria-live="polite" className="text-[15px] leading-relaxed text-foreground/90">
        Over {years} {yearWord}, you would contribute {inr(invested)}. Under the 8% annual-return
        assumption, that could be worth approximately {inr(moderate?.value ?? invested)}. Actual
        outcomes can differ.
      </p>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Illustrative calculations only. Actual investment returns may be higher or lower, including
        losses. These scenarios are not forecasts or investment advice.
      </p>
    </section>
  );
}

const DONUT_R = 54;
const DONUT_C = 2 * Math.PI * DONUT_R;

export function GrowthDonut({ monthly, years }: { monthly: number; years: number }) {
  const invested = Math.max(0, monthly) * Math.max(0, Math.floor(years)) * 12;
  const value = sipProjection(monthly, 8, years, "end").value;
  const gain = value - invested;
  const valid = value > 0 && gain >= 0;
  const growthLen = valid ? (gain / value) * DONUT_C : 0;

  return (
    <section className="card space-y-4" aria-label="Contributions versus growth">
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Where your money comes from
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The Moderate 8% sketch, split into what you put in and hypothetical growth.
        </p>
      </div>

      {valid ? (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <svg
            viewBox="0 0 140 140"
            className="h-44 w-44 shrink-0"
            role="img"
            aria-label={`Donut chart: ${inr(invested)} contributions and ${inr(gain)} illustrative growth, ending at ${inr(value)}`}
          >
            <circle
              cx="70"
              cy="70"
              r={DONUT_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="16"
            />
            <circle
              cx="70"
              cy="70"
              r={DONUT_R}
              fill="none"
              stroke="#00e6b8"
              strokeWidth="16"
              strokeDasharray={`${growthLen} ${DONUT_C}`}
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="66" textAnchor="middle" fontSize="19" fontWeight="700" fill="#F5F7F6">
              {inr(value)}
            </text>
            <text x="70" y="84" textAnchor="middle" fontSize="10" fill="#A3AEA9">
              illustrative value
            </text>
          </svg>
          <ul className="w-full min-w-0 flex-1 space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm bg-muted-foreground/60"
              />
              <span className="text-muted-foreground">You contribute:</span>
              <strong className="ml-auto text-foreground">{inr(invested)}</strong>
            </li>
            <li className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary" />
              <span className="text-muted-foreground">Illustrative growth:</span>
              <strong className="ml-auto text-primary">+{inr(gain)}</strong>
            </li>
            <li className="flex items-center gap-2.5 border-t border-white/10 pt-3">
              <span className="text-muted-foreground">Estimated ending value:</span>
              <strong className="ml-auto font-display text-lg text-foreground">{inr(value)}</strong>
            </li>
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Growth here is zero or negative, so there is nothing to split — the bar below is your
            contributions alone.
          </p>
          <div
            className="h-8 overflow-hidden rounded-lg bg-white/[0.05]"
            role="img"
            aria-label={`Contributions of ${inr(invested)} with no positive growth to show`}
          >
            <div className="h-full bg-muted-foreground/50" style={{ width: "100%" }} />
          </div>
          <p className="text-sm text-muted-foreground">
            You contribute: <strong className="text-foreground">{inr(invested)}</strong>
          </p>
        </div>
      )}
    </section>
  );
}
