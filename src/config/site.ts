/**
 * First Step — Part 1 design system.
 * Phase architecture: tokens + hero + nav. Later phases add homepage
 * sections (discover, your-money, risk-lab, my-plan) without
 * touching these tokens.
 */

export const SECTION_ANCHORS = {
  top: "top",
  discover: "discover",
  yourMoney: "your-money",
  flexSip: "flex-sip",
  riskLab: "risk-lab",
  myPlan: "my-plan",
  knowledgeHub: "knowledge-hub",
  learningLibrary: "learning-library",
} as const;

export type NavItem =
  | { label: string; to: "/"; hash?: string }
  | { label: string; to: "/readiness" | "/flex-sip" | "/risk" | "/my-plan" };

/**
 * Part 1 navigation.
 * - Discover points at a reserved homepage anchor for Phase 2+.
 *   An empty anchor target lives below the hero so the link never 404s.
 * - All other items point at real, working routes (no dead links).
 * - Phases 2–5 may migrate these to full homepage sections.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Discover", to: "/", hash: SECTION_ANCHORS.discover },
  { label: "Your Money", to: "/readiness" },
  { label: "Flex SIP", to: "/flex-sip" },
  { label: "Growth Simulator", to: "/risk" },
  { label: "My Plan", to: "/my-plan" },
];

export const HERO_COPY = {
  eyebrow: "FOR FIRST-TIME INVESTORS, 20–26",
  lines: ["Your first investment", "should fit your life."] as const,
  support:
    "Understand your financial readiness and build a flexible investing plan around your goals, budget, and comfort with risk.",
  primaryCta: "Build My Money Plan",
  secondaryCta: "Explore How It Works",
  micro: ["Free to explore", "No account needed", "Educational experience"] as const,
} as const;
