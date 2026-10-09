import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Footprints } from "lucide-react";
import { PageTitle, SimLabel } from "@/components/Shell";
import { PauseControls } from "@/components/PauseControls";
import { fmtDate, inr, nextScheduled, planTotal, reduceToBase } from "@/lib/firststep";
import { usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/my-plan")({
  head: () => ({
    meta: [
      { title: "My First Step — Your plan" },
      { name: "description", content: "See your saved flexible plan, next contribution date and pause or resume it." },
      { property: "og:title", content: "My First Step — Your plan" },
      { property: "og:description", content: "Your flexible first-investment plan, saved on your device." },
    ],
  }),
  component: MyPlan,
});

const learn = [
  "Keep your base small enough to survive a bad month.",
  "An emergency fund comes before investing.",
  "Avoid F&O and 'sure-shot' tips — they're speculation, not investing.",
];

function MyPlan() {
  const { plan, loaded, save } = usePlan();
  const [fb, setFb] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [fbState, setFbState] = useState<"idle" | "error" | "sent">("idle");

  if (!loaded) return <p className="text-muted-foreground">Loading your plan…</p>;

  function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || fb.trim().length < 5) { setFbState("error"); return; }
    const list = JSON.parse(localStorage.getItem("firststep.feedback") ?? "[]");
    list.push({ rating, text: fb.trim(), at: new Date().toISOString() });
    localStorage.setItem("firststep.feedback", JSON.stringify(list));
    setFbState("sent"); setFb(""); setRating(null);
  }

  return (
    <div className="space-y-5">
      <PageTitle title="My first step" />
      {!plan ? (
        <section className="card py-10 text-center">
          <Footprints className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No plan yet</p>
          <p className="text-sm text-muted-foreground">Build a Flex SIP to see it here.</p>
          <Link to="/flex-sip" className="btn btn-primary mt-5">Build my plan</Link>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Monthly plan</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${plan.status === "active" ? "bg-primary-soft text-primary" : "bg-warning-soft text-warning"}`}>{plan.status === "active" ? "Active" : "Paused"}</span>
            </div>
            <p className="font-display text-3xl font-bold">{inr(planTotal(plan))}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-2.5"><p className="text-muted-foreground">Base</p><p className="font-semibold">{inr(plan.base)}</p></div>
              <div className="rounded-lg bg-muted p-2.5"><p className="text-muted-foreground">Optional</p><p className="font-semibold">{inr(plan.optional)}</p></div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-primary" /> Next contribution: <strong>{fmtDate(nextScheduled(plan))}</strong></p>
          </section>
          <section className="card space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">Controls</h2><SimLabel /></div>
            <PauseControls plan={plan} onChange={(p) => save(p)} />
            {plan.optional > 0 && <button className="btn btn-outline w-full" onClick={() => save(reduceToBase(plan))}>Reduce to base ({inr(plan.base)})</button>}
            <Link to="/flex-sip" className="btn w-full text-primary">Edit amounts</Link>
            <button className="w-full text-sm text-destructive" onClick={() => save(null)}>Delete plan</button>
          </section>
        </>
      )}

      <section className="card">
        <h2 className="mb-3 font-bold">Keep in mind</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">{learn.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>

      <form onSubmit={sendFeedback} noValidate className="card space-y-3">
        <h2 className="font-bold">Was this helpful?</h2>
        <div role="radiogroup" aria-label="Rating" className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => <button type="button" key={r} role="radio" aria-checked={rating === r} className="chip flex-1 px-0" onClick={() => setRating(r)}>{r}</button>)}
        </div>
        <textarea rows={3} className="field py-3" placeholder="What would make this better?" value={fb} onChange={(e) => { setFb(e.target.value); setFbState("idle"); }} aria-label="Feedback" />
        {fbState === "error" && <p className="text-sm text-destructive">Pick a rating and write at least a few words.</p>}
        {fbState === "sent" && <p className="text-sm text-primary">Thanks! Feedback saved on this device.</p>}
        <button className="btn btn-primary w-full">Send feedback</button>
      </form>
    </div>
  );
}
