import { CalendarCheck, IndianRupee, PiggyBank, TrendingUp, Wallet } from "lucide-react";

/**
 * Desktop-only floating fintech decorations for the empty side margins.
 * Rendered once in the shared Shell — hidden below lg (1024px),
 * aria-hidden, pointer-events-none, never over interactive content.
 */
export function DesktopDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
      {/* soft ambient glows */}
      <div className="absolute left-10 top-24 h-56 w-56 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="absolute right-10 top-72 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl" />

      {/* LEFT — wallet motif */}
      <div className="fs-float absolute left-4 top-20 w-44 xl:left-10">
        <div className="rounded-2xl border border-white/10 bg-card/80 p-3.5 backdrop-blur">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Wallet className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-2.5 text-xs font-semibold text-foreground">Cushion first</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            1–3 months of essentials before investing.
          </p>
        </div>
      </div>

      {/* LEFT — savings progress card */}
      <div
        className="fs-float absolute left-6 top-[340px] w-48 xl:left-14"
        style={{ animationDelay: "-3.2s" }}
      >
        <div className="rounded-2xl border border-white/10 bg-card/80 p-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <PiggyBank className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="text-xs font-semibold text-foreground">Savings cushion</p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-2/3 rounded-full bg-primary/80" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">2 of 3 months · steady counts</p>
        </div>
      </div>

      {/* RIGHT — upward-step geometric motif (original line art, no performance claims) */}
      <div
        className="fs-float absolute right-4 top-16 w-44 xl:right-10"
        style={{ animationDelay: "-1.6s" }}
      >
        <div className="rounded-2xl border border-white/10 bg-card/80 p-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <TrendingUp className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="text-xs font-semibold text-foreground">Step up slowly</p>
          </div>
          <svg viewBox="0 0 120 56" className="mt-3 w-full" fill="none" aria-hidden="true">
            <path
              d="M6 50 H34 V36 H62 V22 H90 V8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary/70"
              strokeDasharray="1 0"
            />
            <circle cx="90" cy="8" r="4" className="fill-primary/90" />
            <circle cx="34" cy="50" r="2.5" className="fill-primary/40" />
            <circle cx="62" cy="36" r="2.5" className="fill-primary/40" />
          </svg>
          <p className="mt-1 text-[11px] text-muted-foreground">Small base, optional top-ups.</p>
        </div>
      </div>

      {/* RIGHT — flexible contribution mini card */}
      <div
        className="fs-float absolute right-6 top-[300px] w-48 xl:right-14"
        style={{ animationDelay: "-5s" }}
      >
        <div className="rounded-2xl border border-white/10 bg-card/80 p-3.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <CalendarCheck className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <p className="text-xs font-semibold text-foreground">Flex SIP · ₹500 base</p>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  i === 2
                    ? "h-5 w-full rounded-sm border border-dashed border-warning/60 bg-transparent"
                    : "h-5 w-full rounded-sm bg-primary/25"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Pause when life happens.</p>
        </div>
      </div>

      {/* RIGHT — coin motif */}
      <div
        className="fs-float absolute right-10 top-[500px] xl:right-16"
        style={{ animationDelay: "-7s" }}
      >
        <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-card/80 py-2 pl-2 pr-4 backdrop-blur">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-primary/30 bg-primary-soft text-primary">
            <IndianRupee className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-semibold leading-none text-foreground">Start tiny</p>
            <p className="mt-1 text-[11px] leading-none text-muted-foreground">Habit over amount</p>
          </div>
        </div>
      </div>
    </div>
  );
}
