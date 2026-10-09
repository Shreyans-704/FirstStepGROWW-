/**
 * Market Lab copy block — shared by the homepage showcase
 * and the readiness page. Stagger animations key off an
 * `.sc-on` ancestor via the existing sc-* system.
 */
import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Crosshair, List } from "lucide-react";
import { Eyebrow } from "./Reveal";

const POINTS = [
  "Candlesticks show opens, highs, lows and closes at a glance.",
  "A watchlist keeps a few baskets in view — no noise.",
  "Marked levels help you ask better questions, not predict.",
];

const ICONS = [Activity, List, Crosshair];

export function MarketLabCopy({ headingId = "showcase-heading" }: { headingId?: string }) {
  return (
    <div className="sc-copy max-w-md">
      <Eyebrow>EXPLORE THE MARKET</Eyebrow>
      <h2
        id={headingId}
        className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl"
      >
        See how the market moves.
      </h2>
      <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
        Explore charts, understand market behaviour, and learn how investment decisions are
        evaluated.
      </p>
      <ul className="mt-6 space-y-3">
        {POINTS.map((p, i) => {
          const Icon = ICONS[i] ?? Activity;
          return (
            <li key={p} className="flex items-start gap-3 text-[15px] text-muted-foreground">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{p}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-8">
        <Link to="/risk" className="btn btn-primary !h-[52px] !rounded-full !px-7 !text-[15px]">
          Explore the Experience <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
