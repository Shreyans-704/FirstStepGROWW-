import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { MutualFunds } from "@/components/landing/MutualFunds";
import { Readiness } from "@/components/landing/Readiness";
import { Showcase } from "@/components/landing/Showcase";
import { StatusPill } from "@/components/Shell";
import { SECTION_ANCHORS } from "@/config/site";
import { fmtDate, inr, nextScheduled, planTotal } from "@/lib/firststep";
import { usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "First Step | Your first investment should fit your life." },
      {
        name: "description",
        content:
          "Stocks, mutual funds and SIPs — understand how they work and build a money plan that fits your life. Free to explore, no account needed.",
      },
      { property: "og:title", content: "First Step | Your first investment should fit your life." },
      {
        property: "og:description",
        content: "The money playbook for your 20s. Build a money plan that fits your life.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { plan } = usePlan();
  return (
    <div id={SECTION_ANCHORS.top}>
      <Hero />

      {plan && (
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
          <Link
            to="/my-plan"
            className="group mb-10 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-surface/80 px-5 py-4 backdrop-blur transition-colors hover:border-primary/50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Your simulated plan</p>
                <StatusPill status={plan.status} />
              </div>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                {inr(planTotal(plan))}
                <span className="text-sm font-normal text-muted-foreground"> /month</span>
              </p>
              <p className="text-sm text-muted-foreground">Next: {fmtDate(nextScheduled(plan))}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              Open plan{" "}
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      )}

      {/* Part 2 journey — hero and graph above are preserved untouched.
          The Knowledge Hub now lives below the Growth Simulator on /risk. */}
      <Readiness />
      <Showcase />
      <MutualFunds />
    </div>
  );
}
