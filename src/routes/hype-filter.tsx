import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, Loader2, OctagonX, RotateCcw, X } from "lucide-react";
import { PageTitle } from "@/components/Shell";
import { analyzeClaim } from "@/lib/firststep";

export const Route = createFileRoute("/hype-filter")({
  head: () => ({
    meta: [
      { title: "Hype Filter — First Step" },
      {
        name: "description",
        content: "Paste an investment tip and see the warning signs, using transparent rules.",
      },
      { property: "og:title", content: "Hype Filter — First Step" },
      {
        property: "og:description",
        content: "Spot guaranteed-return promises, pressure tactics and missing sources.",
      },
    ],
  }),
  component: Hype,
});

const MIN_CHARS = 15;

const samples = [
  {
    label: "Balanced explainer",
    text: "Mutual fund investments are subject to market risks, including possible loss. Read all scheme documents carefully on sebi.gov.in before investing over 5 years.",
  },
  {
    label: "Guaranteed-return tip",
    text: "Fictional tip: earn guaranteed 5% returns every month with no risk and 100% sure-shot profits.",
  },
  {
    label: "Urgency and payment push",
    text: "Fictional tip: guaranteed 5% returns every month! Join our Telegram group today only — pay Rs 999 registration fee to get sure-shot tips.",
  },
] as const;

const verdicts = {
  learn: {
    title: "Learn more",
    icon: BookOpen,
    tone: "bg-primary-soft text-primary",
    text: "Few warning signs found by this keyword check. Still verify the source and read official documents before acting.",
  },
  caution: {
    title: "Be cautious",
    icon: AlertTriangle,
    tone: "bg-warning-soft text-warning",
    text: "Some warning signs found. Pause and verify who is behind the claim before acting or sharing details.",
  },
  avoid: {
    title: "Avoid the claim",
    icon: OctagonX,
    tone: "bg-destructive-soft text-destructive",
    text: "Strong warning-sign combination found. Do not pay, share personal details, or move money based on this claim.",
  },
} as const;

const meaning: Record<string, { flagged: string; clear: string }> = {
  source: {
    flagged:
      "No regulator, registration number, or recognisable institution is named, so there is nothing here to verify.",
    clear:
      "A regulator or registration is mentioned — still verify it independently. A mention alone does not prove trustworthiness.",
  },
  guarantee: {
    flagged:
      "It promises assured or risk-free returns. Market-linked investments can fall, so such promises are a warning sign.",
    clear:
      "No guarantee wording was detected. The absence of keywords does not prove the claim is safe.",
  },
  time: {
    flagged: "No clear timeframe is given, so any return number has no context.",
    clear:
      "A timeframe is mentioned, which helps interpret numbers — still check the full context in official documents.",
  },
  pressure: {
    flagged:
      "It pushes urgency, private chats, or payments. Pressure to act fast is a common warning sign — pause and verify.",
    clear:
      "No urgency or payment push was detected. The absence of keywords does not prove the claim is safe.",
  },
  loss: {
    flagged: "It does not mention that you could lose money.",
    clear: "Risk or possible loss is mentioned — still read the official documents before acting.",
  },
};

function Hype() {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof analyzeClaim> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function run() {
    if (text.trim().length === 0) {
      setErr("Paste an investment claim to evaluate.");
      setRes(null);
      return;
    }
    if (text.trim().length < MIN_CHARS) {
      setErr(`Paste at least a sentence (${MIN_CHARS}+ characters).`);
      setRes(null);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setErr("");
    setLoading(true);
    timer.current = setTimeout(() => {
      setRes(analyzeClaim(text));
      setLoading(false);
      timer.current = null;
    }, 400);
  }

  function clear() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setText("");
    setErr("");
    setRes(null);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Pause before trusting an investment claim"
        sub="Check common warning signs before acting on an investment claim."
      />

      <section className="card space-y-3" aria-label="Claim input">
        <div>
          <label htmlFor="claim" className="mb-1.5 block font-medium">
            Paste the claim
          </label>
          <textarea
            id="claim"
            rows={5}
            className="field py-3"
            value={text}
            aria-invalid={!!err}
            aria-describedby={err ? "claim-err" : undefined}
            onChange={(e) => {
              setText(e.target.value);
              if (err) setErr("");
            }}
            placeholder="e.g. Earn 30% in 2 months, DM now…"
          />
          {err && (
            <p id="claim-err" role="alert" className="mt-1 text-sm text-destructive">
              {err}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary flex-1" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </>
            ) : (
              "Evaluate claim"
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={clear}
            disabled={loading && text.length === 0 && !res}
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted-foreground">Try a fictional sample</p>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.label}
                type="button"
                className="chip"
                onClick={() => {
                  setText(s.text);
                  setErr("");
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {res && !loading && <Result res={res} />}
    </div>
  );
}

function Result({ res }: { res: ReturnType<typeof analyzeClaim> }) {
  const v = verdicts[res.verdict];
  const flaggedLabels = res.checks.filter((c) => c.flagged).map((c) => c.label);
  return (
    <section aria-live="polite" className="card space-y-4" aria-label="Evaluation result">
      <div className="flex items-center gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${v.tone}`}>
          <v.icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">
            {res.flags} of 5 warning signs · {v.title}
          </p>
          <h2 className="text-xl font-bold">{v.title}</h2>
        </div>
      </div>
      <p className="text-sm">{v.text}</p>
      <p className="rounded-xl bg-muted p-3 text-sm">
        <strong>Why this outcome:</strong>{" "}
        {flaggedLabels.length === 0
          ? "fewer than 2 warning signs were found, so the checker suggests learning more and verifying independently."
          : `${flaggedLabels.length} of 5 warning signs found (${flaggedLabels.join("; ")}). Avoid appears when guaranteed promises combine with pressure, or when 4 or more signs appear; caution appears with guarantee or pressure language, or 2 or more signs.`}
      </p>
      <ul className="space-y-2">
        {res.checks.map((c) => (
          <li key={c.id} className="flex gap-3 rounded-xl border p-3 text-sm">
            {c.flagged ? (
              <X className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            ) : (
              <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium">
                {c.label}{" "}
                <span className="font-normal text-muted-foreground">
                  — {c.flagged ? "warning sign" : "no warning sign detected"}
                </span>
              </p>
              <p className="text-muted-foreground">{c.detail}</p>
              <p className="mt-1 text-muted-foreground">
                {meaning[c.id]?.[c.flagged ? "flagged" : "clear"]}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Basic educational keyword check, not proof that a claim or source is legitimate, fraudulent,
        safe, or unsafe. Not investment advice and not a buy or sell recommendation. Always verify
        advisers and claims independently, including on sebi.gov.in, and read official documents.
      </p>
    </section>
  );
}
