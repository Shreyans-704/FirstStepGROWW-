import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Route } from "@/routes/readiness";

const Readiness = Route.options.component!;

function renderReadiness() {
  localStorage.clear();
  sessionStorage.clear();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: Readiness,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return router.load().then(() => {
    const view = render(<RouterProvider router={router} />);
    return { ...view, router };
  });
}

async function enterDetail() {
  await screen.findByText("Know where you stand, in under a minute.");
  fireEvent.click(screen.getByRole("button", { name: /Enter the Detailed Plan/ }));
  await screen.findByText("What comes in?");
}

function fillIncome() {
  fireEvent.change(screen.getByLabelText(/Monthly income/), { target: { value: "40000" } });
  fireEvent.click(screen.getByRole("radio", { name: /^Fixed/ }));
}

function fillExpenses() {
  fireEvent.change(screen.getByLabelText(/Essential monthly expenses/), {
    target: { value: "15000" },
  });
  fireEvent.change(screen.getByLabelText(/Discretionary monthly spending/), {
    target: { value: "8000" },
  });
  fireEvent.change(screen.getByLabelText(/Monthly EMI or debt payments/), {
    target: { value: "2000" },
  });
}

function fillSafety() {
  fireEvent.change(screen.getByLabelText(/Current emergency savings/), {
    target: { value: "60000" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /^Yes/ }));
}

function fillContext() {
  fireEvent.change(screen.getByLabelText(/When might you need this money/), {
    target: { value: "5" },
  });
  fireEvent.click(screen.getByRole("radio", { name: /^No/ }));
  fireEvent.click(screen.getByRole("radio", { name: /^Beginner/ }));
}

describe("quick start onboarding", () => {
  it("welcomes with a start action and a detailed-plan escape hatch", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    expect(screen.getByRole("button", { name: /Let's start/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enter the Detailed Plan/ })).toBeInTheDocument();
  });

  it("enters the detailed planner without losing the quick entry point", async () => {
    await renderReadiness();
    await enterDetail();
    expect(screen.getByRole("progressbar", { name: "Assessment progress" })).toBeInTheDocument();
  });

  it("walks the quick flow to an approximate small-start result", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));

    fireEvent.click(screen.getByRole("radio", { name: "Working professional" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));

    fireEvent.click(screen.getByRole("radio", { name: "₹35,000–₹50,000" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));

    fireEvent.click(screen.getByRole("radio", { name: "₹10,000–₹20,000" }));
    fireEvent.click(screen.getByRole("radio", { name: "Starting investments" }));
    fireEvent.click(screen.getByRole("radio", { name: "Several months of expenses" }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));

    expect(await screen.findByText("Explore a small starting amount")).toBeInTheDocument();
    expect((await screen.findAllByText(/Approximate/)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("What this tells you")).toBeInTheDocument();
    expect(screen.getByText("What it can't tell you")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refine my details/ })).toBeInTheDocument();
  });

  it("requires a choice before continuing", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("keeps the selected card when going back", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Student" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    await screen.findByText("Roughly how much comes in each month?");
    fireEvent.click(screen.getByRole("button", { name: /^Back/ }));
    expect(screen.getByRole("radio", { name: "Student" })).toHaveAttribute("aria-checked", "true");
  });

  it("handles varies income without a typical range as unknown", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Freelancer / Self-employed" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("radio", { name: "It varies every month" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("radio", { name: "₹5,000–₹10,000" }));
    fireEvent.click(screen.getByRole("radio", { name: "Learning about investing" }));
    fireEvent.click(screen.getByRole("radio", { name: "Some savings" }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));
    expect(await screen.findByText("Review your financial plan")).toBeInTheDocument();
    expect(screen.getByText(/typical monthly income/i)).toBeInTheDocument();
  });

  it("lets users skip expenses and explains what is missing", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Working professional" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("radio", { name: "₹20,000–₹35,000" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("button", { name: /Not sure — skip/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Emergency savings" }));
    fireEvent.click(screen.getByRole("radio", { name: "Several months of expenses" }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));
    expect(await screen.findByText("Review your financial plan")).toBeInTheDocument();
    expect(screen.getByText(/monthly expenses/i)).toBeInTheDocument();
  });

  it("moves to the detailed plan with answers carried over", async () => {
    await renderReadiness();
    await screen.findByText("Know where you stand, in under a minute.");
    fireEvent.click(screen.getByRole("button", { name: /Let's start/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Working professional" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("radio", { name: "₹35,000–₹50,000" }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.click(screen.getByRole("radio", { name: "₹10,000–₹20,000" }));
    fireEvent.click(screen.getByRole("radio", { name: "Starting investments" }));
    fireEvent.click(screen.getByRole("radio", { name: "Several months of expenses" }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));
    await screen.findByText("Explore a small starting amount");
    fireEvent.click(screen.getByRole("button", { name: /Refine my details/ }));
    expect(await screen.findByText("What comes in?")).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly income/)).toHaveValue(35000);
    expect(screen.getByRole("radio", { name: /^Fixed/ })).toHaveAttribute("aria-checked", "true");
  });
});

describe("guided readiness assessment", () => {
  it("starts on step 1 with progress and required/optional labels", async () => {
    await renderReadiness();
    await enterDetail();
    expect(screen.getByRole("progressbar", { name: "Assessment progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getAllByText("REQUIRED").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OPTIONAL").length).toBeGreaterThan(0);
  });

  it("blocks continuing until the step is valid", async () => {
    await renderReadiness();
    await enterDetail();
    fireEvent.click(screen.getByRole("button", { name: /Continue/ }));
    expect(await screen.findByText("Monthly income is required")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Assessment progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });

  it("walks the full flow to a small-start result", async () => {
    await renderReadiness();
    await enterDetail();

    fillIncome();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fillExpenses();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fillSafety();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fillContext();
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));

    expect(await screen.findByText("Explore a small starting amount")).toBeInTheDocument();
    expect((await screen.findAllByText("₹15,000")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Why this result")).toBeInTheDocument();
    expect(screen.getByText("Suggested next steps")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /See my financial plan/ })).toHaveAttribute(
      "href",
      "/my-plan",
    );
  });

  it("keeps entered values when going back", async () => {
    await renderReadiness();
    await enterDetail();
    fillIncome();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    await screen.findByText("What goes out?");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    await screen.findByText("What comes in?");
    expect(screen.getByLabelText(/Monthly income/)).toHaveValue(40000);
  });

  it("produces a safety-net result for tight budgets", async () => {
    await renderReadiness();
    await enterDetail();
    fireEvent.change(screen.getByLabelText(/Monthly income/), { target: { value: "8000" } });
    fireEvent.click(screen.getByRole("radio", { name: /^Irregular/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.change(screen.getByLabelText(/Essential monthly expenses/), {
      target: { value: "5000" },
    });
    fireEvent.change(screen.getByLabelText(/Discretionary monthly spending/), {
      target: { value: "2000" },
    });
    fireEvent.change(screen.getByLabelText(/Monthly EMI or debt payments/), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.change(screen.getByLabelText(/Current emergency savings/), {
      target: { value: "2000" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /Not yet/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    fireEvent.change(screen.getByLabelText(/When might you need this money/), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /^No/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^Beginner/ }));
    fireEvent.click(screen.getByRole("button", { name: /See my result/ }));
    expect(await screen.findByText("Build your safety net")).toBeInTheDocument();
  });

  it("restores a saved assessment on return", async () => {
    localStorage.clear();
    localStorage.setItem(
      "firststep.assessment.v1",
      JSON.stringify({
        input: {
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
        },
        outcome: "small-start",
        scenarios: [{ label: "Typical month", income: 40000 }],
        goalTarget: null,
        goalSaved: 0,
        goalMonths: 12,
        savedAt: new Date().toISOString(),
      }),
    );
    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: Readiness,
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
    expect(screen.getByText("Explore a small starting amount")).toBeInTheDocument();
  });
});
