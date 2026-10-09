/**
 * Section 1 — Financial readiness checklist (editorial, interactive).
 * The CTA below reads the live checklist state; progress persists on-device.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { SECTION_ANCHORS } from "@/config/site";
import {
  CHECKLIST_ITEMS,
  CHECKLIST_KEY,
  checklistProgress,
  readChecklist,
  toggleChecklist,
  type ChecklistId,
} from "@/lib/learn";
import { cn } from "@/lib/utils";
import { Eyebrow, Reveal } from "./Reveal";

const CTA_COPY = [
  "Start with My Readiness",
  "Continue — Check My Readiness",
  "Almost There — Check My Readiness",
  "All Set — Check My Readiness",
] as const;

const HELPER_COPY = [
  "Tick what you've already thought about — honesty beats speed here.",
  "Good — one basic considered. Two more to see the full picture.",
  "Two down. One more and you've covered the essentials.",
  "All three covered. The full check takes about two minutes.",
] as const;

export function Readiness() {
  const [checked, setChecked] = useState<ChecklistId[]>([]);

  useEffect(() => {
    setChecked(readChecklist());
  }, []);

  const done = checklistProgress(checked);
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((done / total) * 100);

  function toggle(id: ChecklistId) {
    setChecked((prev) => {
      const next = toggleChecklist(prev, id);
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — checklist still works in-memory */
      }
      return next;
    });
  }

  return (
    <section
      id={SECTION_ANCHORS.discover}
      aria-labelledby="readiness-heading"
      className="relative scroll-mt-20 border-t border-white/10 bg-background"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <Reveal>
          <Eyebrow>STEP ONE · KNOW WHERE YOU STAND</Eyebrow>
          <h2
            id="readiness-heading"
            className="mt-5 font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-5xl"
          >
            Before you invest, know where you stand.
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground">
            Your first move isn&apos;t picking a stock. It&apos;s understanding your money.
          </p>

          <div className="mt-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">
                {done} of {total} basics considered
              </p>
              <p aria-hidden="true" className="font-display text-sm font-bold text-primary">
                {pct}%
              </p>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              aria-label="Readiness checklist progress"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_16px_rgb(0_230_184/0.6)] transition-[width] duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/readiness"
              className="btn btn-primary !h-[52px] !rounded-full !px-7 !text-[15px]"
            >
              {CTA_COPY[done] ?? CTA_COPY[0]} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
              {HELPER_COPY[done] ?? HELPER_COPY[0]}
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ul className="divide-y divide-white/[0.07] border-y border-white/10">
            {CHECKLIST_ITEMS.map((item, i) => {
              const on = checked.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(item.id)}
                    className="group flex w-full items-start gap-4 py-6 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300",
                        on
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgb(0_230_184/0.5)]"
                          : "border-white/20 text-transparent group-hover:border-primary/60",
                      )}
                    >
                      <Check
                        key={on ? "on" : "off"}
                        className={cn("h-4 w-4", on && "ck-pop")}
                        strokeWidth={3}
                      />
                    </span>
                    <span>
                      <span className="flex items-baseline gap-3">
                        <span
                          aria-hidden="true"
                          className="font-display text-xs font-bold text-primary/70"
                        >
                          0{i + 1}
                        </span>
                        <span
                          className={cn(
                            "font-display text-xl font-bold tracking-tight transition-colors",
                            on
                              ? "text-foreground"
                              : "text-foreground/90 group-hover:text-foreground",
                          )}
                        >
                          {item.title}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[15px] leading-relaxed text-muted-foreground">
                        {item.text}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Saved on this device only — the full check lives on the readiness page.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
