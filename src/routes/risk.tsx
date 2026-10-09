import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/Shell";
import { inr } from "@/lib/firststep";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Rupee-Risk Explainer — First Step" },
      { name: "description", content: "Understand what a market fall could mean for your money, in rupees and plain language." },
      { property: "og:title", content: "Rupee-Risk Explainer — First Step" },
      { property: "og:description", content: "Illustrative downside scenarios, a quick quiz and a jargon-free glossary." },
    ],
  }),
  component: Risk,
});

const amounts = [500, 1000, 2000, 5000];
const durations = [1, 3, 5];
const falls = [10, 20, 35];

const copy = {
  en: {
    what: "Market-linked funds go up and down. In a bad stretch, the value shown in your app can be lower than what you put in.",
    sip: "With a SIP, you keep buying during a fall too. That doesn't remove risk — it just means you're not putting everything in at one moment.",
  },
  hi: {
    what: "Market-linked funds upar-neeche hote rehte hain. Bura time aaye toh app mein dikhne wali value aapke daale paise se kam ho sakti hai.",
    sip: "SIP mein aap girawat ke time bhi kharidte rehte ho. Isse risk khatam nahi hota — bas saara paisa ek hi baar mein nahi lagta.",
  },
};

const quiz = [
  { q: "Your ₹12,000 invested shows ₹9,600 after a fall. What happened?", options: ["You lost ₹2,400 permanently", "The current value is ₹2,400 lower; it's a loss only if you sell now", "The app made a mistake"], answer: 1 },
  { q: "Which is true about market-linked funds?", options: ["Returns are guaranteed after 3 years", "Value can fall below what you invested", "A SIP removes all risk"], answer: 1 },
];

const glossary = [
  ["NAV", "Price of one unit of a fund on a given day."],
  ["CAGR", "Average yearly growth rate, smoothed out. Real years are bumpy."],
  ["Riskometer", "A SEBI-mandated label showing how much a fund's value can swing."],
  ["Drawdown", "How far value falls from its peak, e.g. 20% down."],
];

function Risk() {
  const [amt, setAmt] = useState(1000);
  const [yrs, setYrs] = useState(3);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [answers, setAnswers] = useState<(number | null)[]>([null, null]);
  const [checked, setChecked] = useState(false);
  const invested = amt * 12 * yrs;
  const score = answers.filter((a, i) => a === quiz[i].answer).length;

  return (
    <div className="space-y-5">
      <PageTitle step="Step 3 of 3" title="Risk, in rupees" sub="Not a forecast. Just what a bad stretch could look like." />

      <section className="card space-y-4">
        <div>
          <p className="mb-2 font-medium">Monthly amount</p>
          <div role="radiogroup" className="flex flex-wrap gap-2">{amounts.map((a) => <button key={a} role="radio" aria-checked={amt === a} className="chip" onClick={() => setAmt(a)}>{inr(a)}</button>)}</div>
        </div>
        <div>
          <p className="mb-2 font-medium">For how long</p>
          <div role="radiogroup" className="flex gap-2">{durations.map((d) => <button key={d} role="radio" aria-checked={yrs === d} className="chip flex-1" onClick={() => setYrs(d)}>{d} yr{d > 1 ? "s" : ""}</button>)}</div>
        </div>
        <p className="text-sm">You'd have put in <strong>{inr(invested)}</strong>.</p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between gap-2"><h2 className="font-bold">If the market fell…</h2><span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">Illustrative only</span></div>
        <ul className="space-y-2">
          {falls.map((f) => {
            const shown = invested * (1 - f / 100);
            return (
              <li key={f} className="rounded-xl border p-3">
                <div className="flex justify-between text-sm"><span>{f}% fall</span><span className="font-semibold text-destructive">−{inr(invested - shown)}</span></div>
                <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-destructive" style={{ width: `${f}%` }} /></div>
                <p className="mt-2 text-sm text-muted-foreground">Your {inr(invested)} could show as <strong className="text-foreground">{inr(shown)}</strong>.</p>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">Hypothetical falls applied to the amount you put in. Not a prediction of returns, losses, or how long any recovery would take — there is no guarantee of recovery.</p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">In plain words</h2>
          <div role="radiogroup" aria-label="Language" className="flex gap-1">
            <button role="radio" aria-checked={lang === "en"} className="chip min-h-8 px-3 text-xs" onClick={() => setLang("en")}>English</button>
            <button role="radio" aria-checked={lang === "hi"} className="chip min-h-8 px-3 text-xs" onClick={() => setLang("hi")}>Hinglish</button>
          </div>
        </div>
        <p className="text-sm">{copy[lang].what}</p>
        <p className="text-sm">{copy[lang].sip}</p>
      </section>

      <section className="card space-y-4">
        <h2 className="font-bold">Quick check</h2>
        {quiz.map((item, qi) => (
          <fieldset key={qi} className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{qi + 1}. {item.q}</legend>
            {item.options.map((o, oi) => {
              const sel = answers[qi] === oi;
              const state = checked ? (oi === item.answer ? "border-primary bg-primary-soft" : sel ? "border-destructive bg-destructive-soft" : "") : sel ? "border-primary" : "";
              return (
                <label key={oi} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${state}`}>
                  <input type="radio" name={`q${qi}`} className="mt-0.5 accent-[var(--color-primary)]" checked={sel} onChange={() => { const n = [...answers]; n[qi] = oi; setAnswers(n); setChecked(false); }} />
                  {o}
                </label>
              );
            })}
          </fieldset>
        ))}
        <button className="btn btn-primary w-full" disabled={answers.includes(null)} onClick={() => setChecked(true)}>Check answers</button>
        {checked && <p aria-live="polite" className="text-center font-semibold">{score}/2 correct {score === 2 ? "— nicely done." : "— review the highlighted answers."}</p>}
      </section>

      <section className="card">
        <h2 className="mb-3 font-bold">Glossary</h2>
        <dl className="space-y-2 text-sm">{glossary.map(([t, d]) => <div key={t}><dt className="font-semibold">{t}</dt><dd className="text-muted-foreground">{d}</dd></div>)}</dl>
      </section>
      <Link to="/hype-filter" className="btn btn-outline w-full">Next: Hype filter</Link>
    </div>
  );
}
