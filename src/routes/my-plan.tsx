import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Footprints,
  Info,
  Lock,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { PageTitle, SimLabel, StatusPill } from "@/components/Shell";
import { PauseControls } from "@/components/PauseControls";
import { fmtDate, inr, nextScheduled, planTotal, reduceToBase } from "@/lib/firststep";
import { usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/my-plan")({
  head: () => ({
    meta: [
      { title: "My First Step — Your plan" },
      {
        name: "description",
        content: "See your saved flexible plan, next contribution date and pause or resume it.",
      },
      { property: "og:title", content: "My First Step — Your plan" },
      {
        property: "og:description",
        content: "Your flexible first-investment plan, saved on your device.",
      },
    ],
  }),
  component: MyPlan,
});

const FEEDBACK_KEY = "firststep.feedback";

type FeedbackItem = { rating: number; text: string; at: string };

function readFeedback(): { items: unknown[]; malformed: boolean } {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return { items: [], malformed: false };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { items: [], malformed: true };
    return { items: parsed, malformed: false };
  } catch {
    return { items: [], malformed: true };
  }
}

function MyPlan() {
  const { plan, loaded, save, error: planError } = usePlan();
  const [fb, setFb] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [fbState, setFbState] = useState<"idle" | "error" | "storage-error" | "sent">("idle");
  const [fbCount, setFbCount] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [justResumed, setJustResumed] = useState(false);

  if (!loaded) return <p className="text-muted-foreground">Loading your plan…</p>;

  const today = new Date();
  const nextDate = plan ? nextScheduled(plan, today) : null;
  const isPaused = plan?.status === "paused";
  const showResumed = justResumed && !isPaused && !!plan;

  function handleStatusChange(next: typeof plan) {
    if (!next) return;
    const wasPaused = isPaused;
    setJustResumed(wasPaused && next.status === "active");
    setConfirmingDelete(false);
    save(next);
  }

  function handleReduceToBase() {
    if (!plan) return;
    setJustResumed(false);
    setConfirmingDelete(false);
    save(reduceToBase(plan));
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    setJustResumed(false);
    save(null);
  }

  function sendFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || fb.trim().length < 5) {
      setFbState("error");
      return;
    }
    const { items, malformed } = readFeedback();
    if (malformed) {
      // Never overwrite feedback we cannot read.
      setFbState("storage-error");
      return;
    }
    const entry: FeedbackItem = {
      rating,
      text: fb.trim(),
      at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...items, entry]));
    } catch {
      setFbState("storage-error");
      return;
    }
    setFbCount(items.length + 1);
    setFbState("sent");
    setFb("");
    setRating(null);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="My first step"
        sub="Your saved flexible plan, its status and next contribution."
      />

      {showResumed && plan && nextDate && (
        <section aria-live="polite" className="card space-y-1 border-primary/40 bg-primary-soft/40">
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Check className="h-4 w-4" /> Plan resumed — active again
          </p>
          <p className="text-sm text-muted-foreground">
            Next contribution on <strong className="text-foreground">{fmtDate(nextDate)}</strong>{" "}
            for <strong className="text-foreground">{inr(planTotal(plan))}</strong>.
          </p>
        </section>
      )}

      {!plan ? (
        <section className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0A100E] px-6 py-10 text-center shadow-[0_32px_80px_-32px_rgb(0_0_0/0.8)] md:px-10 md:py-12">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Footprints className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mx-auto mt-5 max-w-sm font-display text-2xl font-bold tracking-tight text-foreground">
            Your plan starts here
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Build a flexible SIP plan that fits your income, goals, and changing circumstances.
          </p>
          <div className="mx-auto mt-7 flex max-w-xs flex-col gap-2">
            <Link to="/flex-sip" className="btn btn-primary w-full">
              Build my plan <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/risk"
              className="w-fit self-center px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              Explore Growth Simulator
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="card space-y-4" aria-label="Plan status">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Monthly plan</p>
                <p className="truncate text-xs text-muted-foreground">
                  {plan.createdAt ? `Saved ${fmtDate(new Date(plan.createdAt))}` : "Saved plan"}
                </p>
              </div>
              <StatusPill status={showResumed ? "resumed" : plan.status} />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Planned total per month</p>
              <p className="font-display text-4xl font-bold leading-tight">
                {inr(planTotal(plan))}
                <span className="text-base font-normal text-muted-foreground"> /month</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isPaused ? (
                  <>
                    <strong className="text-warning">Paused</strong> — nothing is collected while
                    paused.
                  </>
                ) : (
                  <>
                    <strong className="text-primary">Active</strong> — contributions scheduled
                    normally.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-primary/25 bg-secondary p-3">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-primary" /> Base · fixed
                </p>
                <p className="mt-1 text-lg font-bold">{inr(plan.base)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Paid every active month</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-3">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Plus className="h-3.5 w-3.5 text-primary" /> Top-up · optional
                </p>
                <p className="mt-1 text-lg font-bold">
                  {plan.optional ? `+${inr(plan.optional)}` : "None"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Only in good months</p>
              </div>
            </div>

            {nextDate && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {isPaused && plan.resumeDate ? (
                    <>
                      Paused
                      {plan.pauseMonths
                        ? ` for ${plan.pauseMonths} month${plan.pauseMonths === 1 ? "" : "s"}`
                        : ""}
                      . Scheduled to resume on{" "}
                      <strong className="text-foreground">
                        {fmtDate(new Date(plan.resumeDate))}
                      </strong>
                      , when the next contribution of{" "}
                      <strong className="text-foreground">{inr(planTotal(plan))}</strong> is
                      expected.
                    </>
                  ) : (
                    <>
                      Next contribution on{" "}
                      <strong className="text-foreground">{fmtDate(nextDate)}</strong> for{" "}
                      <strong className="text-foreground">{inr(planTotal(plan))}</strong>.
                    </>
                  )}
                </span>
              </p>
            )}
          </section>

          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Plan actions</h2>
              <SimLabel />
            </div>
            {planError && (
              <p role="alert" className="text-sm text-destructive">
                {planError}
              </p>
            )}
            <PauseControls plan={plan} onChange={handleStatusChange} />
            {plan.optional > 0 && (
              <button type="button" className="btn btn-outline w-full" onClick={handleReduceToBase}>
                Reduce to base ({inr(plan.base)})
              </button>
            )}
            <div className="grid gap-2">
              <Link to="/flex-sip" className="btn btn-outline w-full">
                <Pencil className="h-4 w-4" /> Edit plan
              </Link>
              <Link to="/risk" className="btn btn-outline w-full">
                <ShieldAlert className="h-4 w-4" /> Explore growth scenarios
              </Link>
            </div>
            <div className="border-t pt-3">
              {!confirmingDelete ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 py-1 text-sm text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" /> Delete plan
                </button>
              ) : (
                <div
                  role="alertdialog"
                  aria-label="Confirm plan deletion"
                  className="space-y-2 rounded-xl border border-destructive/40 bg-destructive-soft/30 p-3"
                >
                  <p className="text-sm font-semibold">Delete this simulated plan?</p>
                  <p className="text-sm text-muted-foreground">
                    This removes it from this device only. Your readiness answers stay saved.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline flex-1"
                      onClick={() => setConfirmingDelete(false)}
                    >
                      Keep plan
                    </button>
                    <button type="button" className="btn btn-primary flex-1" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4" /> Yes, delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <section className="flex items-start gap-3 rounded-2xl border border-white/10 bg-surface/60 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Info className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-[17px] font-bold tracking-tight text-foreground">
            Before you begin
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Keep your SIP affordable, maintain an emergency fund, and treat additional contributions
            as optional. Your plan is a simulation — no real money moves through this page.
          </p>
        </div>
      </section>

      <form onSubmit={sendFeedback} noValidate className="card space-y-3" aria-label="Feedback">
        <div>
          <h2 className="font-display text-[17px] font-bold tracking-tight text-foreground">
            Help us improve
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How useful was this experience?
            {fbCount !== null && fbCount > 0 ? ` ${fbCount} saved on this device.` : ""}
          </p>
        </div>
        <div role="radiogroup" aria-label="Rating" className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              type="button"
              key={r}
              role="radio"
              aria-checked={rating === r}
              aria-label={`Rate ${r} out of 5`}
              className="chip flex-1 px-0"
              onClick={() => {
                setRating(r);
                setFbState("idle");
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          className="field py-3"
          placeholder="What would make this better?"
          value={fb}
          onChange={(e) => {
            setFb(e.target.value);
            setFbState("idle");
          }}
          aria-label="Feedback"
        />
        {fbState === "error" && (
          <p role="alert" className="text-sm text-destructive">
            Pick a rating and write at least a few words.
          </p>
        )}
        {fbState === "storage-error" && (
          <p role="alert" className="text-sm text-destructive">
            Could not save feedback on this device — existing saved feedback was left unchanged.
            Check browser storage and try again.
          </p>
        )}
        {fbState === "sent" && (
          <p role="status" className="text-sm text-primary">
            Thanks! Feedback saved on this device.
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full">
          Save feedback on this device
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Stored on this device only — never sent to a server.
        </p>
      </form>
    </div>
  );
}
