import { Link } from "@tanstack/react-router";
import { Home, Gauge, Repeat, ShieldAlert, Search, Footprints } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/readiness", label: "Ready?", icon: Gauge },
  { to: "/flex-sip", label: "Flex SIP", icon: Repeat },
  { to: "/risk", label: "Risk", icon: ShieldAlert },
  { to: "/hype-filter", label: "Hype", icon: Search },
  { to: "/my-plan", label: "My plan", icon: Footprints },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2 font-display text-base font-bold">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
              <Footprints className="h-3.5 w-3.5" />
            </span>
            First Step
          </Link>
          <nav aria-label="Main" className="hidden min-w-0 md:block">
            <ul className="flex items-center gap-1">
              {nav.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    activeOptions={{ exact: true }}
                    className="relative block px-3 py-4 text-sm font-medium text-muted-foreground hover:text-foreground"
                    activeProps={{ className: "!text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Prototype</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-10 pt-6">{children}</main>
      <footer className="mx-auto w-full max-w-xl border-t px-5 pb-24 pt-5 text-xs leading-relaxed text-muted-foreground md:pb-8">
        Educational prototype for a product case study. Not affiliated with or endorsed by Groww. Not investment advice.
        Mutual fund investments are subject to market risks; read all scheme documents carefully. No real money moves here.
      </footer>
      <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card md:hidden">
        <ul className="grid grid-cols-6">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 truncate text-[11px] text-muted-foreground"
                activeProps={{ className: "!text-primary font-semibold" }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageTitle({ step, title, sub }: { step?: string; title: string; sub?: string }) {
  return (
    <div className="mb-6">
      {step && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{step}</p>}
      <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SimLabel({ children = "Simulated" }: { children?: ReactNode }) {
  return <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">{children}</span>;
}

export function StatusPill({ status }: { status: "active" | "paused" | "resumed" }) {
  const map = {
    active: ["Active", "bg-primary-soft text-primary", "bg-primary"],
    resumed: ["Resumed", "bg-primary-soft text-primary", "bg-primary"],
    paused: ["Paused", "bg-warning-soft text-warning", "bg-warning"],
  } as const;
  const [label, tone, dot] = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}
    </span>
  );
}
