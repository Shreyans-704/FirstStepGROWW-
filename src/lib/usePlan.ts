import { useCallback, useEffect, useState } from "react";
import { normalizePlan, validatePlan, type Plan } from "./firststep";

const KEY = "firststep.plan.v1";
const READY_KEY = "firststep.readiness.v1";

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
      if (err) { setError(err); return false; }
      localStorage.setItem(KEY, JSON.stringify(p));
    } else localStorage.removeItem(KEY);
    setError(null);
    setPlanState(p);
    return true;
  }, []);

  return { plan, loaded, save, error };
}

export type StoredReadiness = { outcome: "cushion" | "tiny" | "ready"; spare: number };
export const saveReadiness = (r: StoredReadiness) => localStorage.setItem(READY_KEY, JSON.stringify(r));
export const loadReadiness = () => read<StoredReadiness>(READY_KEY);
