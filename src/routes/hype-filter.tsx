import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, BookOpen, Check, Loader2, OctagonX, X } from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { analyzeClaim } from "@/lib/firststep";

export const Route = createFileRoute("/hype-filter")({
  head: () => ({
    meta: [
      { title: "Hype Filter — First Step" },
      { name: "description", content: "Paste an investment tip and see the warning signs, using transparent rules." },
      { property: "og:title", content: "Hype Filter — First Step" },
      { property: "og:description", content: "Spot guaranteed-return promises, pressure tactics and missing sources." },
    ],
  }),
  component: Hype,
});

const example = "Guaranteed 5% returns every month! Join our Telegram group today only — pay ₹999 registration fee to get sure-shot tips.";
const verdicts = {
  learn: { title: "Learn more", icon: BookOpen, tone: "bg-primary-soft text-primary", text: "Few red flags found. Still verify the source and read the official documents." },
  caution: { title: "Be cautious", icon: AlertTriangle, tone: "bg-warning-soft text-warning", text: "Some warning signs. Don't act until you can verify who's behind it." },
  avoid: { title: "Avoid the claim", icon: OctagonX, tone: "bg-destructive-soft text-destructive", text: "Strong scam-like signals. Don't pay, share details, or move money." },
};

function Hype() {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof analyzeClaim> | null>(null);

  function run() {
    if (text.trim().length < 15) { setErr("Paste at least a sentence (15+ characters)."); setRes(null); return; }
    setErr(""); setLoading(true);
    setTimeout(() => { setRes(analyzeClaim(text)); setLoading(false); }, 400);
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Hype filter" sub="Got a tip on Instagram, Telegram or WhatsApp? Check it for red flags." />
      <div>
        <label htmlFor="claim" className="mb-1.5 block font-medium">Paste the claim</label>
        <textarea id="claim" rows={5} className="field py-3" value={text} aria-invalid={!!err} onChange={(e) => setText(e.target.value)} placeholder="e.g. Earn 30% in 2 months, DM now…" />
        {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
        <button type="button" className="mt-1 text-sm font-medium text-primary" onClick={() => { setText(example); setErr(""); }}>Try an example</button>
      </div>
      <button className="btn btn-primary w-full" onClick={run} disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : "Check this claim"}</button>

      {res && !loading && (() => {
        const v = verdicts[res.verdict];
        return (
          <section aria-live="polite" className="card space-y-4">
            <div className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${v.tone}`}><v.icon className="h-5 w-5" /></span>
              <div><p className="text-xs text-muted-foreground">{res.flags} of 5 warning signs</p><h2 className="text-xl font-bold">{v.title}</h2></div>
            </div>
            <p className="text-sm">{v.text}</p>
            <ul className="space-y-2">
              {res.checks.map((c) => (
                <li key={c.id} className="flex gap-3 rounded-xl border p-3 text-sm">
                  {c.flagged ? <X className="h-5 w-5 shrink-0 text-destructive" /> : <Check className="h-5 w-5 shrink-0 text-primary" />}
                  <div><p className="font-medium">{c.label}</p><p className="text-muted-foreground">{c.detail}</p></div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Keyword-based educational check, not a verdict on any security. We never recommend buying or selling anything. Verify advisers on sebi.gov.in.</p>
          </section>
        );
      })()}
    </div>
  );
}
