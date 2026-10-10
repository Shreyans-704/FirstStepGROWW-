import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route as FlexSipRoute } from "@/routes/flex-sip";
import { Route as MyPlanRoute } from "@/routes/my-plan";
import { Route as ReadinessRoute } from "@/routes/readiness";
import { quickAssess, type QuickAnswers } from "@/lib/quickstart";

const FlexSip = FlexSipRoute.options.component!;
const MyPlan = MyPlanRoute.options.component!;
const Readiness = ReadinessRoute.options.component!;

function renderJourney(initialPath: string) {
  const rootRoute = createRootRoute();
  const myPlanRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/my-plan",
    component: MyPlan,
  });
  const readinessRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/readiness",
    component: Readiness,
  });
  const flexSipRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/flex-sip",
    component: FlexSip,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([myPlanRoute, readinessRoute, flexSipRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return router.load().then(() => {
    const view = render(<RouterProvider router={router} />);
    return { ...view, router };
  });
}

const quickAnswers: QuickAnswers = {
  situation: "professional",
  incomeRange: "35-50k",
  typicalRange: null,
  expenseRange: "10-20k",
  priority: "start-investing",
  buffer: "several",
};

function seedQuick() {
  const assessed = quickAssess(quickAnswers);
  if (!assessed.repInput) throw new Error("expected a representative input");
  localStorage.setItem(
    "firststep.assessment.v1",
    JSON.stringify({
      input: assessed.repInput,
      outcome: assessed.outcome,
      scenarios: [],
      goalTarget: null,
      goalSaved: 0,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
      source: "quick",
      quick: quickAnswers,
    }),
  );
}

const detailedInput = {
  baseIncome: 40000,
  additionalIncome: 0,
  incomeType: "fixed",
  essential: 15000,
  discretionary: 8000,
  emi: 2000,
  upcoming: 0,
  emergencySavings: 60000,
  hasEmergencyFund: true,
  savingsGoalTarget: null,
  goal: "",
  horizonYears: 5,
  needSoon: false,
  familiarity: "beginner",
} as const;

function seedDetailed() {
  localStorage.setItem(
    "firststep.assessment.v1",
    JSON.stringify({
      input: detailedInput,
      outcome: "small-start",
      scenarios: [{ label: "Typical month", income: 40000 }],
      goalTarget: null,
      goalSaved: 0,
      goalMonths: 12,
      savedAt: new Date().toISOString(),
      source: "detailed",
    }),
  );
}

describe("edit navigation across the real journey", () => {
  it("1. quick assessment → My Plan → Edit opens the current Quick Start UI", async () => {
    localStorage.clear();
    seedQuick();
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    // Current Quick Start result, not the exact-amount wizard.
    expect(await screen.findByText("Your quick result")).toBeInTheDocument();
    expect(screen.queryByText("What comes in?")).not.toBeInTheDocument();
  });

  it("2. latest Quick Start answers are prefilled when editing", async () => {
    localStorage.clear();
    seedQuick();
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    await screen.findByText("Your quick result");
    // Summary reflects the submitted ranges.
    expect(screen.getByText("₹35,000–₹50,000")).toBeInTheDocument();
    // Walk back through the questions: selections are restored.
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));
    expect(screen.getByRole("radio", { name: "₹35,000–₹50,000" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));
    expect(screen.getByRole("radio", { name: "Working professional" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("3. detailed assessment → My Plan → Edit opens the current Detailed Plan UI", async () => {
    localStorage.clear();
    seedDetailed();
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    // Restored detailed result (not Quick Start, not a blank form).
    expect(await screen.findByText("Why this result")).toBeInTheDocument();
    expect(screen.queryByText("Your quick result")).not.toBeInTheDocument();
  });

  it("4. exact Detailed Plan values are restored for editing", async () => {
    localStorage.clear();
    seedDetailed();
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    await screen.findByText("Why this result");
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/ }));
    expect(await screen.findByText("What comes in?")).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly income/)).toHaveValue(40000);
  });

  it("5. quick→refined saves edit as detailed: exact values win over older ranges", async () => {
    localStorage.clear();
    // Simulates a save written after refining Quick Start into Detailed Plan.
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: detailedInput,
        outcome: "small-start",
        scenarios: [],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
        source: "detailed",
        quick: quickAnswers,
      }),
    );
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    await screen.findByText("Why this result");
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/ }));
    await screen.findByText("What comes in?");
    // Exact ₹40,000 — not the older ₹35,000 range representative.
    expect(screen.getByLabelText(/Monthly income/)).toHaveValue(40000);
  });

  it("6. modifying an answer updates the saved result and My Plan", async () => {
    localStorage.clear();
    seedDetailed();
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    await screen.findByText("Why this result");
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/ }));
    await screen.findByText("What comes in?");
    fireEvent.change(screen.getByLabelText(/Monthly income/), { target: { value: "50000" } });
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));
    // 50000 − 15000 − 8000 − 2000 = ₹25,000 remaining.
    expect((await screen.findAllByText("₹25,000")).length).toBeGreaterThanOrEqual(1);
    const stored = JSON.parse(localStorage.getItem("firststep.assessment.v1") ?? "{}") as {
      input?: { baseIncome?: number };
    };
    expect(stored.input?.baseIncome).toBe(50000);
    fireEvent.click(screen.getByRole("link", { name: /See my financial plan/ }));
    expect((await screen.findAllByText("₹25,000")).length).toBeGreaterThanOrEqual(1);
  });

  it("7. remounting (refresh) still opens the correct Quick Start form", async () => {
    localStorage.clear();
    seedQuick();
    const first = await renderJourney("/readiness");
    expect(await screen.findByText("Your quick result")).toBeInTheDocument();
    first.unmount();
    await renderJourney("/readiness");
    expect(await screen.findByText("Your quick result")).toBeInTheDocument();
    expect(screen.queryByText("What comes in?")).not.toBeInTheDocument();
  });

  it("8a. legacy source-less save with valid data restores into Detailed Plan", async () => {
    localStorage.clear();
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: detailedInput,
        outcome: "small-start",
        scenarios: [],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
      }),
    );
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    await screen.findByText("Why this result");
    fireEvent.click(screen.getByRole("button", { name: /Edit answers/ }));
    await screen.findByText("What comes in?");
    expect(screen.getByLabelText(/Monthly income/)).toHaveValue(40000);
  });

  it("8b. legacy malformed save falls back to current Quick Start, not a broken form", async () => {
    localStorage.clear();
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: { baseIncome: 40000 },
        outcome: "small-start",
        scenarios: [],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
      }),
    );
    await renderJourney("/my-plan");
    fireEvent.click(await screen.findByRole("link", { name: /Review or edit answers/ }));
    expect(await screen.findByText("Know where you stand, in under a minute.")).toBeInTheDocument();
    expect(screen.queryByText("What comes in?")).not.toBeInTheDocument();
  });

  it("9. no saved data enters the current Quick Start", async () => {
    localStorage.clear();
    await renderJourney("/readiness");
    expect(await screen.findByText("Know where you stand, in under a minute.")).toBeInTheDocument();
    expect(screen.queryByText("What comes in?")).not.toBeInTheDocument();
  });
});

describe("quick result CTA hierarchy", () => {
  it("shows exactly one refinement CTA alongside Explore Flex SIP", async () => {
    localStorage.clear();
    seedQuick();
    await renderJourney("/readiness");
    await screen.findByText("Your quick result");
    expect(screen.getAllByText(/refine/i)).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Refine my details/ })).toBeInTheDocument();
    expect(screen.queryByText(/Refine with exact amounts/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Flex SIP/ })).toHaveAttribute(
      "href",
      "/flex-sip",
    );
  });

  it("navigating Explore Flex SIP renders the actual Flex SIP experience", async () => {
    localStorage.clear();
    seedQuick();
    const { router } = await renderJourney("/readiness");
    await screen.findByText("Your quick result");
    fireEvent.click(screen.getByRole("link", { name: /Explore Flex SIP/ }));
    expect(router.state.location.pathname).toBe("/flex-sip");
    expect(await screen.findByText("Flex SIP builder")).toBeInTheDocument();
  });

  it("frames Flex SIP as a simulation when the user is not ready", async () => {
    localStorage.clear();
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: quickAssess({ ...quickAnswers, buffer: "none" }).repInput,
        outcome: "safety-net",
        scenarios: [],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
        source: "quick",
        quick: { ...quickAnswers, buffer: "none" },
      }),
    );
    await renderJourney("/readiness");
    await screen.findByText("Build your safety net");
    expect(screen.getByRole("link", { name: /Explore Flex SIP/ })).toBeInTheDocument();
    expect(screen.getByText(/hypothetical simulation to explore/i)).toBeInTheDocument();
  });

  it("Start over returns to the Quick Start welcome screen", async () => {
    localStorage.clear();
    seedQuick();
    await renderJourney("/readiness");
    await screen.findByText("Your quick result");
    fireEvent.click(screen.getByRole("button", { name: /Start over/ }));
    expect(await screen.findByText("Know where you stand, in under a minute.")).toBeInTheDocument();
  });
});
