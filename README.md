# First Step

**Your first investment should fit your life.**

First Step is an independent product-design prototype exploring how first-time investors can approach starting a SIP with more confidence and flexibility. It walks users through checking financial readiness, building a flexible "Safe-Start Flex SIP" plan and understanding risk in rupees — all simulated locally in the browser.

> **Educational prototype — not an official Groww product.** No real money moves here. No investment advice, no guaranteed returns, no real transactions.

Live Link : https://first-step-groww.vercel.app/

[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start-red)](https://tanstack.com/start)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-teal)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Vitest-4-green)](https://vitest.dev)
[![Bun](https://img.shields.io/badge/Bun-1.4-black)](https://bun.sh)

## Contents

- [The problem](#the-problem)
- [The product approach](#the-product-approach)
- [Key features](#key-features)
- [How the experience works](#how-the-experience-works)
- [Product design principles](#product-design-principles)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Testing and quality](#testing-and-quality)
- [Data, privacy, and financial disclaimers](#data-privacy-and-financial-disclaimers)
- [Current limitations](#current-limitations)
- [Future scope](#future-scope-proposed-not-implemented)
- [Screenshots](#screenshots)
- [Contributing and license](#contributing-and-license)

## The problem

First-time investors face a cold-start problem: there is no obvious answer to "am I ready, and how much can I start with?" This prototype explores four related pain points as product hypotheses:

1. **Readiness uncertainty.** Surplus income, EMIs, emergency savings, and time horizon all matter, but beginners have no simple way to weigh them together.
2. **Unsustainable starting amounts.** A rigid monthly commitment that ignores irregular income can break in a bad month.
3. **Hype and social pressure.** Tips promising guaranteed returns or pushing urgency over private chats are hard for beginners to evaluate.
4. **Abstract risk.** Percentages and jargon don't convey what a market fall means in rupees.

These are framed as hypotheses explored by the prototype. The repository contains no user research validating them.

## The product approach

First Step's answer is the **Safe-Start Flex SIP** concept: readiness before commitment, flexibility over rigidity, and risk awareness over hype. The experience deliberately orders the journey — check readiness, then build a small flexible plan, then confront downside scenarios — so users encounter caution *before* they simulate committing money. Every simulation is labelled as such, and every limitation (illustrative scenarios, local-only storage) is stated in the interface rather than hidden.

## Key features

### Financial Readiness Assessment (`/readiness`)

- **Purpose:** give beginners an explainable starting signal from five numbers.
- **Interaction:** five inputs (take-home income, fixed expenses, EMIs, emergency-savings months, time horizon), validated inline; submitting shows one of three outcomes — **Build a cushion first** (amber), **Start tiny** (teal), or **Ready to plan** (green) — each with its own icon, heading, the computed monthly surplus, the reasons that produced it, and a supportive next step.
- **Rationale:** thresholds are transparent rules (e.g. spare < ₹500 or < 1 month of savings → cushion; < 3 months, EMI > 30%, horizon < 3 years, or surplus < ₹3,000 → tiny), so the result can be explained rather than trusted blindly.
- **Limitation:** simple heuristics, not financial advice; only the outcome and surplus are persisted.

### Safe-Start Flex SIP (`/flex-sip`)

- **Purpose:** let users shape a contribution they could sustain.
- **Interaction:** preset base amounts (₹500–₹5,000, minimum ₹500) plus optional top-ups (₹0–₹2,000) with an immediately recalculated total; save/update the plan; a monthly timeline shows upcoming contributions, or paused months plus the resume date when paused.
- **Pause/resume:** active plans show the next contribution date and offer 1–3 month pauses; pausing skips the next N contributions on the 5th of each month. Paused plans show duration, resume date, and a resume action; resuming shows a confirmation and the restored schedule. Unsaved amount edits are merged into pause actions so they are never silently discarded.
- **Limitation:** pausing and resuming are simulated and touch no real SIP mandate.

### Growth Simulator (`/risk`)

- **Purpose:** show what regular monthly investments could become under illustrative assumptions.
- **Interaction:** pick a monthly amount (₹500–₹5,000) and duration (1–10 years) to see total contributions, three simplified scenario cards (4%, 8%, 12% assumed annual returns, end-of-month contributions) with ending values and gains, a stacked-bar comparison with a plain-words summary, and a donut splitting the moderate sketch into contributions versus growth.
- **Limitation:** all growth figures are hypothetical illustrations, labelled as such; falls are illustrative scenarios, not predictions.

### My Plan (`/my-plan`)

- **Purpose:** a dashboard for the saved simulated plan.
- **Interaction:** prominent Active/Paused status, base/optional/total figures, next-contribution or resume explanation, and working actions: edit amounts, pause/resume, reduce to base, explore growth scenarios, and delete (two-step confirmation). Includes a compact educational tip and a feedback form (1–5 rating + comment) saved to local browser storage with a local-only confirmation.
- **Limitation:** deleting the plan removes only the plan; readiness answers stay saved.

## How the experience works

1. **Home (`/`)** introduces the concept and links the four steps; once a plan exists, a summary card shows its total and next date.
2. **Readiness (`/readiness`)** — enter five numbers, submit, read the outcome and reasons; the outcome and surplus persist to `firststep.readiness.v1`.
3. **Flex SIP (`/flex-sip`)** — choose base and top-up, save the plan to `firststep.plan.v1`; optionally simulate a 1–3 month pause or resume.
4. **Growth Simulator (`/risk`)** — explore illustrative growth scenarios, check the downside context, take the quiz, then keep learning with the Knowledge Hub videos and Learning Library below.
5. **My Plan (`/my-plan`)** — review status, amounts, and dates; edit, pause/resume, reduce, or delete the plan; leave locally-stored feedback (`firststep.feedback`).

All persisted data lives in the browser's `localStorage`; nothing is sent to a server.

## Product design principles

Demonstrated by the implementation (not validated by user research):

- **Readiness before commitment** — the journey starts with a check, not a checkout.
- **Flexible rather than rigid planning** — base plus optional top-up, pausable by design.
- **Risk awareness over hype** — downside scenarios precede commitment.
- **Transparent limitations** — simulation labels, keyword-check caveats, and illustrative-scenario disclaimers are in the UI.
- **Low-friction exploration** — no login, no backend; everything runs locally.

## Tech stack

| Technology | Role |
| --- | --- |
| React 19 + TypeScript 5 | UI and type-safe application logic |
| TanStack Start / Router / Query | File-based routing, SSR shell, data layer |
| Vite 8 (+ `@lovable.dev/vite-tanstack-config`) | Dev server and production build |
| Tailwind CSS 4 | Dark fintech styling system |
| Radix UI + shadcn components, Lucide icons | Accessible primitives and iconography |
| Vitest + Testing Library + jsdom | Automated tests |
| `localStorage` (`firststep.plan.v1`, `firststep.readiness.v1`, `firststep.feedback`) | Browser-only persistence, no backend |
| Bun 1.4 + `bun.lock` | Package management and script runner |
| ESLint + Prettier + `tsc` | Linting, formatting, type checks |

## Getting started

Prerequisites: [Bun](https://bun.sh) 1.4+ (this repo resolves dependencies with Bun; `npm install` is known to fail on this dependency tree). Node.js 22 is used under the hood by the toolchain.

```sh
git clone https://github.com/Shreyans-704/FirstStepGROWW-.git
cd FirstStepGROWW-/FirstStepGROWW--main
bun install
bun run dev
```

| Task | Command |
| --- | --- |
| Development server | `bun run dev` |
| Tests | `bun run test` |
| Production build | `bun run build` |
| Type check | `bunx tsc --noEmit` |
| Lint | `bun run lint` |
| Format | `bun run format` |

Note: the project directory is nested (`FirstStepGROWW--main/FirstStepGROWW--main`); run all commands from the inner folder containing `package.json`. The `npm i` snippet in the original scaffold is not recommended for this repo.

## Project structure

```text
FirstStepGROWW--main/
  package.json          # scripts: dev (vite dev), build, test (vitest), lint, format
  bun.lock / bunfig.toml
  vite.config.ts        # via @lovable.dev/vite-tanstack-config (TanStack Start)
  src/
    routes/
      index.tsx         # Home (/)
      readiness.tsx     # Readiness assessment (/readiness)
      flex-sip.tsx      # Flex SIP builder (/flex-sip)
      risk.tsx          # Risk education + quiz (/risk)
      my-plan.tsx       # Dashboard (/my-plan)
      __root.tsx        # app shell, header/nav, footer, error + 404 states
    components/
      Shell.tsx         # navigation, PageTitle, StatusPill, disclaimers
      PauseControls.tsx # shared pause/resume controls
      ui/               # shadcn primitives (mostly unused)
    lib/
      firststep.ts      # readiness and plan/date rules
      usePlan.ts        # localStorage plan + readiness persistence
    test/
      firststep.test.ts # rules coverage
      app-routing.test.tsx
```

`node_modules`, `.output`, and other generated artifacts are not part of the repo.

## Testing and quality

- Framework: Vitest with jsdom; commands `bun run test` / `bun run test:watch`.
- Coverage: 20 automated tests across 2 files — readiness outcomes and validation, pause/resume dates (1–3 months), totals, minimum-base rule, and reduce-to-base.
- Also verified: `tsc --noEmit` clean, production build passing, all five routes returning HTTP 200 with correct titles, and worked files lint-clean (remaining repo-wide lint items are pre-existing formatting issues).
- Manual browser testing has not been performed; interactive and responsive checks remain a manual step.

## Data, privacy, and financial disclaimers

- All data stays in the browser (`localStorage` keys above); nothing is transmitted to any server, and feedback confirmations say "saved on this device."
- `localStorage` is plain, unencrypted browser storage — not production-grade financial data security.
- This is an **independent educational/product-design prototype**, not an official Groww product and not affiliated with or endorsed by Groww.
- It does not provide personalized investment advice, execute real investment transactions, modify real SIP mandates, recommend securities, or guarantee returns.

## Current limitations

- Readiness uses fixed heuristic thresholds, not a financial plan.
- Pause/resume only simulates dates; auto-resume of an expired pause happens on app load, not while a tab sits open.
- Risk scenarios are fixed 10/20/35% illustrations, not forecasts.
- Feedback is a local list with no sync, search, or moderation.
- Route pages for saved plans render a loading state during SSR and hydrate client-side.

## Future scope (proposed, not implemented)

- Readiness inputs review/edit from My Plan.
- Pause history and scheduled-reminder display.
- Additional quiz questions and a progress indicator on Risk.
- Component-level UI tests for the plan flows.
- Accessibility audit (keyboard-only walkthrough, screen-reader pass, contrast check).

## Screenshots

No screenshots are checked into the repo (only `favicon.ico` and `robots.txt` exist under `public/`). Suggested captures for this README:

1. Home hero + How-it-works section.
2. Readiness result for each outcome (cushion / tiny / ready).
3. Flex SIP overview with pause timeline (active and paused states).
4. Growth simulator scenarios + chart.
5. My Plan dashboard with status and actions.

## Contributing and license

No contribution guide is defined for this case-study repo; please open an issue before proposing changes. There is no `LICENSE` file in the repository, so no license is claimed here — all rights remain with the repository owner.
