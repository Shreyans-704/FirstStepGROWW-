import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, Footprints, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NAV_ITEMS } from "@/config/site";
import { cn } from "@/lib/utils";

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isReadiness = location.pathname === "/readiness";
  const isFlexSip = location.pathname === "/flex-sip";
  const isRisk = location.pathname === "/risk";
  const isMyPlan = location.pathname === "/my-plan";

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || open
            ? "border-b border-white/10 bg-[#050807]/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:h-[72px] md:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg"
            aria-label="First Step — home"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-primary-foreground shadow-[0_0_24px_-6px_rgb(0_230_184/0.7)]">
              <Footprints className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight">First Step</span>
          </Link>

          <nav aria-label="Primary" className="hidden min-w-0 lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  {"hash" in item && item.hash ? (
                    <Link
                      to={item.to}
                      hash={item.hash}
                      className="relative block rounded-md px-3.5 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      activeProps={{
                        className:
                          "!text-foreground after:absolute after:inset-x-3.5 after:-bottom-[13px] after:h-[2px] after:rounded-full after:bg-primary after:shadow-[0_0_12px_rgb(0_230_184/0.9)]",
                      }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="relative block rounded-md px-3.5 py-2.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      activeProps={{
                        className:
                          "!text-foreground after:absolute after:inset-x-3.5 after:-bottom-[13px] after:h-[2px] after:rounded-full after:bg-primary after:shadow-[0_0_12px_rgb(0_230_184/0.9)]",
                      }}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link
              to="/readiness"
              className="btn btn-primary hidden !min-h-10 !rounded-full !px-5 !text-[14px] sm:inline-flex"
            >
              Get My Money Plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-foreground lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile"
            className="border-t border-white/10 bg-[#050807]/95 px-5 pb-6 pt-3 backdrop-blur-xl lg:hidden"
          >
            <ul className="divide-y divide-white/[0.06]">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  {"hash" in item && item.hash ? (
                    <Link
                      to={item.to}
                      hash={item.hash}
                      className="flex items-center justify-between py-3.5 text-[15px] font-medium text-muted-foreground hover:text-foreground"
                      activeProps={{ className: "!text-primary font-semibold" }}
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 opacity-40" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="flex items-center justify-between py-3.5 text-[15px] font-medium text-muted-foreground hover:text-foreground"
                      activeProps={{ className: "!text-primary font-semibold" }}
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 opacity-40" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <Link to="/readiness" className="btn btn-primary mt-4 w-full !rounded-full">
              Get My Money Plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        )}
      </header>

      <div className="relative mx-auto w-full max-w-7xl flex-1">
        <main id="main" className="relative z-10 mx-auto w-full flex-1">
          {isHome || isRisk ? (
            children
          ) : (
            <div
              className={cn(
                "mx-auto w-full px-5 pb-10 pt-24 md:pt-28",
                isReadiness
                  ? "max-w-[1320px]"
                  : isFlexSip
                    ? "max-w-[1400px]"
                    : isMyPlan
                      ? "max-w-[640px]"
                      : "max-w-xl",
              )}
            >
              {children}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-white/10 bg-[#050807]">
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/15 text-primary">
                <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              First Step
            </p>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Educational prototype for a product case study. Not affiliated with or endorsed by
              Groww. Not investment advice. Mutual fund investments are subject to market risks;
              read all scheme documents carefully. No real money moves here.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageTitle({ step, title, sub }: { step?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {step && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{step}</p>
      )}
      <h1 className="text-2xl font-bold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SimLabel({ children = "Simulated" }: { children?: ReactNode }) {
  return (
    <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: "active" | "paused" | "resumed" }) {
  const map = {
    active: ["Active", "bg-primary-soft text-primary", "bg-primary"],
    resumed: ["Resumed", "bg-primary-soft text-primary", "bg-primary"],
    paused: ["Paused", "bg-warning-soft text-warning", "bg-warning"],
  } as const;
  const [label, tone, dot] = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
