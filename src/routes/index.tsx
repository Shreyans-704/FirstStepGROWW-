import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Gauge, Repeat, ShieldAlert, Search } from "lucide-react";
import { StatusPill } from "@/components/Shell";
import { fmtDate, inr, nextScheduled, planTotal } from "@/lib/firststep";
import { usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "First Step — Your first investment should fit your life" },
      { name: "description", content: "Understand your financial readiness and create a flexible plan." },
      { property: "og:title", content: "First Step — Your first investment should fit your life" },
      { property: "og:description", content: "A flexible first-investment planner for young Indians with irregular income. Educational prototype." },
    ],
  }),
  component: Welcome,
});

const steps = [
  { icon: Gauge, title: "Check readiness", text: "See if your money basics are in place.", to: "/readiness" },
  { icon: Repeat, title: "Build a Flex SIP", text: "A small base, optional top-ups, pause when life happens.", to: "/flex-sip" },
  { icon: ShieldAlert, title: "See risk in rupees", text: "What a bad stretch could look like, without jargon.", to: "/risk" },
  { icon: Search, title: "Filter the hype", text: "Spot red flags in tips you get online.", to: "/hype-filter" },
] as const;

function Welcome() {
  const { plan } = usePlan();
  return (
    <div className="space-y-8">
      <section className="pt-2">
        <p className="mb-3 text-sm font-medium text-primary">For first-time investors, 20–26</p>
        <h1 className="text-[2rem] font-bold leading-[1.15]">Your first investment should fit your life.</h1>
        <p className="mt-3 text-lg text-muted-foreground">Understand your financial readiness and create a flexible plan.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/readiness" className="btn btn-primary sm:flex-1">Build my first plan <ArrowRight className="h-4 w-4" /></Link>
          <a href="#how" className="btn btn-outline sm:flex-1">Explore how it works</a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">No login. Nothing leaves your device.</p>
      </section>

      {plan && (
        <Link to="/my-plan" className="card flex items-center justify-between gap-4 hover:border-primary">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><p className="text-sm text-muted-foreground">Your simulated plan</p><StatusPill status={plan.status} /></div>
            <p className="mt-1 font-display text-2xl font-bold">{inr(planTotal(plan))}<span className="text-sm font-normal text-muted-foreground"> /month</span></p>
            <p className="text-sm text-muted-foreground">Next: {fmtDate(nextScheduled(plan))}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
      )}

      <section id="how" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold">How it works</h2>
        <ol className="card divide-y p-0">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Link to={s.to} className="flex items-center gap-4 p-4 hover:bg-secondary">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary"><s.icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{i + 1}. {s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
