/**
 * Mandatory declaration gate — in-memory only, by design.
 *
 * The four readiness declarations unlock every non-landing route for the
 * current visit and nothing else. This module holds plain module state:
 * it starts locked on every fresh application load (full reload, new tab,
 * new visit) and can never be restored from localStorage, sessionStorage,
 * cookies, or any other persistent browser data — none of those are read
 * here, so previously stored data cannot bypass the gate.
 */

const REQUIRED_DECLARATIONS = 4;

let unlocked = false;

export function isUnlocked(): boolean {
  return unlocked;
}

/** Unlock only when all declarations were selected in this visit. */
export function unlock(declarationCount: number): boolean {
  if (declarationCount >= REQUIRED_DECLARATIONS) {
    unlocked = true;
    return true;
  }
  return false;
}

export function lock(): void {
  unlocked = false;
}

export function requiredDeclarations(): number {
  return REQUIRED_DECLARATIONS;
}
