/**
 * Hypothetical growth sketch — hand-rolled SVG, no new dependencies.
 * Three assumed-rate lines plus an invested-amount reference, with a
 * hover/tap/keyboard tooltip and a screen-reader data table.
 * All numbers derive from sipValueAtMonth; nothing is hardcoded.
 */
import { useMemo, useRef, useState } from "react";
import { inr } from "@/lib/firststep";
import { sipValueAtMonth } from "@/lib/learn";
import { cn } from "@/lib/utils";

export const GROWTH_SCENARIOS = [
  { label: "Conservative", rate: 4, color: "#7DD3C0" },
  { label: "Moderate", rate: 8, color: "#00E6B8" },
  { label: "Higher-growth", rate: 12, color: "#65F5D2" },
] as const;

const W = 560;
const H = 260;
const PAD = { l: 10, r: 14, t: 16, b: 10 };

function linePath(values: number[], max: number, months: number): string {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  return values
    .map((v, i) => {
      const x = PAD.l + (i / Math.max(months, 1)) * iw;
      const y = H - PAD.b - (v / max) * ih;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function GrowthChart({ monthly, years }: { monthly: number; years: number }) {
  const months = Math.max(1, Math.round(years) * 12);
  const raf = useRef(0);
  const [active, setActive] = useState(months);

  const series = useMemo(() => {
    const invested: number[] = [];
    const lines = GROWTH_SCENARIOS.map(() => [] as number[]);
    for (let m = 0; m <= months; m += 1) {
      invested.push(monthly * m);
      GROWTH_SCENARIOS.forEach((s, i) => {
        lines[i]?.push(sipValueAtMonth(monthly, s.rate, m, "end"));
      });
    }
    const max = Math.max(...(lines[2] ?? [1]), 1);
    return { invested, lines, max };
  }, [monthly, months]);

  const clamped = Math.min(Math.max(active, 0), months);
  const activeInvested = monthly * clamped;
  const activeValues = GROWTH_SCENARIOS.map((s) =>
    Math.round(sipValueAtMonth(monthly, s.rate, clamped, "end")),
  );

  function setFromClientX(clientX: number, el: Element | null) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    const frac = (clientX - r.left) / r.width;
    setActive(Math.round(Math.min(Math.max(frac, 0), 1) * months));
  }

  function queueMove(clientX: number, el: Element | null) {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setFromClientX(clientX, el));
  }

  const tipX = (clamped / months) * 100;
  const yOf = (v: number) => H - PAD.b - (v / series.max) * (H - PAD.t - PAD.b);
  const tipTop = (yOf(activeValues[1] ?? 0) / H) * 100;
  const tipSide =
    tipX > 70
      ? "translate(-106%, -50%)"
      : tipX < 20
        ? "translate(6%, -50%)"
        : "translate(-50%, -118%)";

  const yearRows = useMemo(() => {
    const rows: { year: number; invested: number; values: number[] }[] = [];
    for (let y = 1; y <= Math.round(years); y += 1) {
      rows.push({
        year: y,
        invested: monthly * y * 12,
        values: GROWTH_SCENARIOS.map((s) =>
          Math.round(sipValueAtMonth(monthly, s.rate, y * 12, "end")),
        ),
      });
    }
    return rows;
  }, [monthly, years]);

  return (
    <div>
      <div
        tabIndex={0}
        role="img"
        aria-label={`Hypothetical growth sketch for ${inr(monthly)} per month over ${years} ${years === 1 ? "year" : "years"} at 4, 8 and 12 percent assumed annual growth. Use left and right arrow keys to explore months.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((a) => Math.max(0, a - 1));
          if (e.key === "ArrowRight") setActive((a) => Math.min(months, a + 1));
        }}
        className="relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
          <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
            {[0.25, 0.5, 0.75].map((f) => {
              const y = PAD.t + f * (H - PAD.t - PAD.b);
              return <line key={f} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} />;
            })}
          </g>
          <path
            d={linePath(series.invested, series.max, months)}
            fill="none"
            stroke="#A3AEA9"
            strokeOpacity="0.65"
            strokeWidth="1.6"
            strokeDasharray="5 5"
          />
          {GROWTH_SCENARIOS.map((s, i) => (
            <path
              key={s.label}
              d={linePath(series.lines[i] ?? [], series.max, months)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.rate === 8 ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={s.rate === 8 ? 1 : 0.85}
            />
          ))}
          <circle
            cx={PAD.l + (W - PAD.l - PAD.r)}
            cy={yOf(series.lines[1]?.[months] ?? 0)}
            r={10}
            fill="#00e6b8"
            opacity={0.18}
          />
          <circle
            cx={PAD.l + (W - PAD.l - PAD.r)}
            cy={yOf(series.lines[1]?.[months] ?? 0)}
            r={4}
            fill="#00e6b8"
          />
          {/* active marker */}
          <line
            x1={PAD.l + (clamped / months) * (W - PAD.l - PAD.r)}
            y1={PAD.t}
            x2={PAD.l + (clamped / months) * (W - PAD.l - PAD.r)}
            y2={H - PAD.b}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          <circle
            cx={PAD.l + (clamped / months) * (W - PAD.l - PAD.r)}
            cy={yOf(activeValues[1] ?? 0)}
            r={4.5}
            fill="#0a100e"
            stroke="#00e6b8"
            strokeWidth={2.5}
          />
          <rect
            x={PAD.l}
            y={0}
            width={W - PAD.l - PAD.r}
            height={H}
            fill="transparent"
            onMouseMove={(e) => queueMove(e.clientX, e.currentTarget)}
            onMouseLeave={() => {
              cancelAnimationFrame(raf.current);
              setActive(months);
            }}
            onClick={(e) => setFromClientX(e.clientX, e.currentTarget)}
          />
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 w-max max-w-[210px] rounded-xl border border-white/10 bg-[#0a100e]/95 p-2.5 opacity-100 shadow-xl motion-safe:transition-opacity"
          style={{ left: `${tipX}%`, top: `${tipTop}%`, transform: tipSide }}
        >
          <p className="text-[11px] font-bold text-foreground">
            Month {clamped} · Put in {inr(activeInvested)}
          </p>
          <div className="mt-1 space-y-0.5">
            {GROWTH_SCENARIOS.map((s, i) => (
              <p
                key={s.label}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                {s.rate}% sketch{" "}
                <strong className="ml-auto text-foreground">{inr(activeValues[i] ?? 0)}</strong>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-[#A3AEA9]" />
          Put in
        </span>
        {GROWTH_SCENARIOS.map((s) => (
          <span
            key={s.label}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={cn("inline-block h-[3px] w-5 rounded-full", s.rate === 8 && "h-1")}
              style={{ background: s.color }}
            />
            {s.label} · {s.rate}%
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>
          Hypothetical year-end values for {inr(monthly)} per month over {years}{" "}
          {years === 1 ? "year" : "years"}
        </caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Put in</th>
            {GROWTH_SCENARIOS.map((s) => (
              <th key={s.label} scope="col">
                {s.label} {s.rate}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yearRows.map((r) => (
            <tr key={r.year}>
              <th scope="row">{r.year}</th>
              <td>{inr(r.invested)}</td>
              {r.values.map((v, i) => (
                <td key={GROWTH_SCENARIOS[i]?.label ?? i}>{inr(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
