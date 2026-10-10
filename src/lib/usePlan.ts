import { useCallback, useEffect, useState } from "react";
import { normalizePlan, validatePlan, type Plan } from "./firststep";
import type { AffordabilityOutcome, AssessmentInput } from "./affordability";
import type { QuickAnswers } from "./quickstart";

const KEY = "firststep.plan.v1";
const READY_KEY = "firststep.readiness.v1";
const ASSESS_KEY = "firststep.assessment.v1";

function read<T>(k: string): T | null {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function usePlan() {
  const [plan, setPlanState] = useState<Plan | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = read<Plan>(KEY);
    const n = p ? normalizePlan(p) : null;
    setPlanState(n && !validatePlan(n) ? n : null);
    if (n && n !== p) localStorage.setItem(KEY, JSON.stringify(n));
    setLoaded(true);
  }, []);

  const save = useCallback((p: Plan | null) => {
    if (p) {
      const err = validatePlan(p);
      if (err) {
        setError(err);
        return false;
      }
      localStorage.setItem(KEY, JSON.stringify(p));
    } else localStorage.removeItem(KEY);
    setError(null);
    setPlanState(p);
    return true;
  }, []);

  return { plan, loaded, save, error };
}

export type StoredReadiness = { outcome: "cushion" | "tiny" | "ready"; spare: number };
export const saveReadiness = (r: StoredReadiness) =>
  localStorage.setItem(READY_KEY, JSON.stringify(r));
export const loadReadiness = () => read<StoredReadiness>(READY_KEY);

export type StoredAssessment = {
  input: AssessmentInput;
  outcome: AffordabilityOutcome;
  scenarios: { label: string; income: number }[];
  goalTarget: number | null;
  goalSaved: number;
  goalMonths: number;
  savedAt: string;
  /** "quick" = range-based onboarding (approximate); absent/detailed = exact amounts. */
  source?: "quick" | "detailed";
  quick?: QuickAnswers;
};
export const saveAssessment = (a: StoredAssessment) => {
  try {
    localStorage.setItem(ASSESS_KEY, JSON.stringify(a));
  } catch {
    // Private-mode storage — the in-memory result still works for this visit.
  }
  // Keep the legacy key in sync so the Flex SIP nudge keeps working:
  // safety-net → cushion, anything else → tiny (start small, stay cautious).
  try {
    saveReadiness({
      outcome: a.outcome === "safety-net" ? "cushion" : "tiny",
      spare:
        a.input.baseIncome +
        a.input.additionalIncome -
        a.input.essential -
        a.input.discretionary -
        a.input.emi,
    });
  } catch {
    // Legacy sync is best-effort only.
  }
};
export const loadAssessment = () => read<StoredAssessment>(ASSESS_KEY);
