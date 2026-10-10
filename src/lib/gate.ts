/**
 * Mandatory declaration gate — session-scoped, by design.
 *
 * The four readiness declarations unlock every non-landing route for the
 * current tab session and nothing else. The unlock is held in module state
 * and mirrored to sessionStorage so refresh, back/forward, and direct URLs
 * in the same tab keep working; a new tab or visit starts locked.
 * localStorage, cookies, and other persistent browser data are never read
 * here, so previously stored data cannot bypass the gate.
 */

const REQUIRED_DECLARATIONS = 4;
const SESSION_KEY = "firststep.unlocked.v1";

let unlocked = false;

function readSession(): boolean {
  try {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSession(): void {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Private-mode or unavailable storage — module state still unlocks this visit.
  }
}

function clearSession(): void {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing persisted, nothing to clear.
  }
}

export function isUnlocked(): boolean {
  return unlocked || readSession();
}

/** Unlock only when all declarations were selected in this visit. */
export function unlock(declarationCount: number): boolean {
  if (declarationCount >= REQUIRED_DECLARATIONS) {
    unlocked = true;
    writeSession();
    return true;
  }
  return false;
}

export function lock(): void {
  unlocked = false;
  clearSession();
}
