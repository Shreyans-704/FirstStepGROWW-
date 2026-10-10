/**
 * Your Financial Snapshot — right-hand companion to the readiness form.
 * Reads live form values (no duplicated state) and explains them back.
 * Missing fields stay missing: nothing is treated as zero, no fund
 * amounts are invented, and no readiness verdict is claimed.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleAlert, IndianRupee, ShieldCheck, Wallet } from "lucide-react";
import { EMERGENCY_MONTH_OPTIONS, HORIZON_YEAR_OPTIONS, inr } from "@/lib/firststep";
import { summarizeFinances, type SnapshotValues } from "@/lib/learn";
import { cn } from "@/lib/utils";

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined,
  fallback: string,
): string {
  if (value === undefined) return fallback;
  return options.find((o) => o.value === value)?.label ?? fallback;
}

const INTRO_BENEFITS = [
  { icon: Wallet, text: "Understand your monthly cash flow." },
  { icon: IndianRupee, text: "See how much remains after commitments." },
  { icon: ShieldCheck, text: "Check whether your emergency buffer needs attention." },
] as const;

function MetricRow({
  label,
  display,
  sub,
  tone = "default",
}: {
  label: string;
  display: string;
  sub?: string | undefined;
  tone?: "default" | "mint" | "warning";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-white/[0.07] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground/80">{sub}</p>}
      </div>
      <p
        className={cn(
          "shrink-0 font-display text-lg font-bold tracking-tight",
          tone === "mint" && "text-primary",
          tone === "warning" && "text-warning",
          tone === "default" && "text-foreground",
        )}
      >
        {display}
      </p>
    </div>
  );
}

export function FinancialSnapshot({ values }: { values: SnapshotValues }) {
  const s = summarizeFinances(values);

  const notes: { title: string; text: string }[] = [];
  if (s.leftover !== undefined && s.leftover > 0) {
    notes.push({
      title: "A starting point, not a verdict",
      text: "Your remaining cash flow is a starting point for planning. Keep enough available for everyday needs and unexpected expenses before deciding how much to invest.",
    });
  }
  if (s.leftover !== undefined && s.leftover < 0) {
    notes.push({
      title: "Review before committing",
      text: "Your current commitments exceed your entered income. Review your budget before taking on additional investment commitments.",
    });
  }
  if (s.leftover !== undefined && s.leftover === 0) {
    notes.push({
      title: "Nothing left over on paper",
      text: "Your commitments match your income. Look for room in everyday spending before planning investments.",
    });
  }
  if (s.emergencyMonths !== undefined && s.emergencyMonths < 1) {
    notes.push({
      title: "Buffer needs attention",
      text: "Consider building an accessible emergency fund before committing too much money to investments.",
    });
  } else if (s.emergencyMonths !== undefined && s.emergencyMonths >= 3) {
    notes.push({
      title: "Buffer looks steady",
      text: "An emergency buffer can help you handle unexpected expenses without disrupting your financial goals.",
    });
  }

  return (
    <div className="space-y-5">
      <section
        aria-label="Your financial snapshot"
        className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0A100E] shadow-[0_32px_80px_-32px_rgb(0_0_0/0.8)]"
      >
        <div
          aria-hidden="true"
          className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        />
        <div className="p-6 md:p-7">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-primary">
            YOUR FINANCIAL SNAPSHOT
          </p>
          <h2 className="mt-2 font-display text-[28px] font-bold leading-tight tracking-tight text-foreground">
            Know where you stand.
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Understand what your money is doing before deciding what to invest.
          </p>

          {!s.hasAny ? (
            <div className="mt-6">
              <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
                Your money, made clearer.
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Add five simple details to understand your monthly commitments, emergency buffer,
                and potential savings capacity.
              </p>
              <ul className="mt-5 space-y-3">
                {INTRO_BENEFITS.map((b) => (
                  <li key={b.text} className="flex items-center gap-3 text-sm text-foreground/90">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <b.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-6" aria-live="polite">
              {s.leftover !== undefined && s.leftover < 0 && (
                <p className="mb-4 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft/40 p-3 text-sm">
                  <CircleAlert
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <span>
                    Your entered commitments{" "}
                    <strong className="text-foreground">{inr(s.commitments ?? 0)}</strong> exceed
                    your income <strong className="text-foreground">{inr(s.income ?? 0)}</strong>.
                    Review your budget before investing.
                  </span>
                </p>
              )}
              <MetricRow
                label="Monthly income"
                display={s.income !== undefined ? inr(s.income) : "—"}
                sub={s.income === undefined ? "Not entered yet" : undefined}
              />
              <MetricRow
                label="Monthly commitments"
                display={s.commitments !== undefined ? inr(s.commitments) : "—"}
                sub={s.commitments === undefined ? "Needs expenses + EMIs" : "Expenses + EMIs"}
              />
              <MetricRow
                label="Left after commitments"
                display={s.leftover !== undefined ? inr(s.leftover) : "—"}
                sub={
                  s.leftover === undefined
                    ? "Needs income, expenses + EMIs"
                    : s.leftover > 0
                      ? "Potential monthly surplus"
                      : s.leftover < 0
                        ? "Over budget"
                        : "Nothing left over"
                }
                tone={
                  s.leftover !== undefined && s.leftover > 0
                    ? "mint"
                    : s.leftover !== undefined && s.leftover < 0
                      ? "warning"
                      : "default"
                }
              />
              <MetricRow
                label="Emergency buffer"
                display={
                  s.emergencyMonths !== undefined
                    ? optionLabel(
                        EMERGENCY_MONTH_OPTIONS,
                        values.emergencyMonths,
                        `${s.emergencyMonths} mo`,
                      )
                    : "—"
                }
                sub={s.emergencyMonths === undefined ? "Not entered yet" : "Entered duration"}
              />
              {s.horizonYears !== undefined && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Planning horizon: {optionLabel(HORIZON_YEAR_OPTIONS, values.horizonYears, "—")}
                </p>
              )}
              {s.leftover !== undefined && s.leftover > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Surplus is potential, not promised — everyday spending and other obligations may
                  reduce what&apos;s actually available.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {notes.length > 0 && (
        <section
          aria-label="Before you start investing"
          className="rounded-2xl border border-white/10 bg-surface/70 p-5"
        >
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-primary">
            BEFORE YOU START INVESTING
          </h3>
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li key={n.title} className="flex gap-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70"
                />
                <span>
                  <strong className="font-semibold text-foreground">{n.title}. </strong>
                  <span className="text-muted-foreground">{n.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-label="Next step"
        className="rounded-2xl border border-white/10 bg-surface/70 p-5"
      >
        <h3 className="font-display text-[17px] font-bold tracking-tight text-foreground">
          Ready for your next step?
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Use your financial picture to explore a plan that fits your circumstances.
        </p>
        <Link to="/flex-sip" className="btn btn-outline mt-4 w-full">
          Explore Flex SIP <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
