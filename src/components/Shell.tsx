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
    <div className="mx-auto flex min-h-screen max-w-xl flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Footprints className="h-4 w-4" />
          </span>
          First Step
        </Link>
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">Prototype</span>
      </header>
      <main className="flex-1 px-5 pb-28 pt-6">{children}</main>
      <footer className="px-5 pb-28 text-xs leading-relaxed text-muted-foreground">
        Educational prototype for a product case study. Not affiliated with or endorsed by Groww. Not investment advice.
        Mutual fund investments are subject to market risks; read all scheme documents carefully. No real money moves here.
      </footer>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t bg-background">
        <ul className="mx-auto grid max-w-xl grid-cols-6">
          {nav.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
                activeProps={{ className: "text-primary font-semibold" }}
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
