import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gauge, Repeat, ShieldAlert, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "First Step — Your first investment should fit your life" },
      { name: "description", content: "Check if you're ready to invest, build a flexible SIP plan and understand risk in plain language." },
      { property: "og:title", content: "First Step — Your first investment should fit your life" },
      { property: "og:description", content: "A flexible first-investment planner for young Indians with irregular income. Educational prototype." },
    ],
  }),
  component: Welcome,
});

const steps = [
  { icon: Gauge, title: "Check readiness", text: "See if your money basics are in place." },
  { icon: Repeat, title: "Build a Flex SIP", text: "A small base, optional top-ups, pause when life happens." },
  { icon: ShieldAlert, title: "See risk in rupees", text: "What a bad year could look like, without jargon." },
  { icon: Search, title: "Filter the hype", text: "Spot red flags in tips you get online." },
];

function Welcome() {
  return (
    <div className="space-y-8">
      <section className="pt-4">
        <p className="mb-3 text-sm font-semibold text-primary">For first-time investors, 20–26</p>
        <h1 className="text-[2rem] font-bold leading-[1.15]">Your first investment should fit your life.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Income that changes month to month? Start with an amount you can keep, add more when you can, and pause when you need to.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/readiness" className="btn btn-primary">Build my first plan <ArrowRight className="h-4 w-4" /></Link>
          <a href="#how" className="btn btn-outline">Explore how it works</a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">No login. Nothing leaves your device.</p>
      </section>
      <section id="how" className="scroll-mt-20">
        <h2 className="mb-4 text-lg font-bold">How it works</h2>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="card flex items-start gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><s.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="font-semibold">{i + 1}. {s.title}</p>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
