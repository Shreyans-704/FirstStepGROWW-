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

describe("Your Money snapshot panel", () => {
  it("shows the introductory state when the form is empty", async () => {
    await renderReadiness();
    expect(await screen.findByText("Your money, made clearer.")).toBeInTheDocument();
    expect(screen.getByText("Understand your monthly cash flow.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Flex SIP/ })).toHaveAttribute(
      "href",
      "/flex-sip",
    );
  });

  it("updates income, commitments and leftover live as the user types", async () => {
    await renderReadiness();
    await screen.findByText("Your money, made clearer.");

    fireEvent.change(screen.getByLabelText("Monthly take-home income"), {
      target: { value: "50000" },
    });
    expect(await screen.findByText("₹50,000")).toBeInTheDocument();
    // Commitments need both expenses and EMIs — nothing invented yet.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Monthly fixed expenses"), {
      target: { value: "20000" },
    });
    fireEvent.change(screen.getByLabelText("Monthly EMI payments"), {
      target: { value: "5000" },
    });
    expect(screen.getAllByText("₹25,000")).toHaveLength(2);
    expect(screen.getByText("Potential monthly surplus")).toBeInTheDocument();
    expect(screen.queryByText("Your money, made clearer.")).not.toBeInTheDocument();
  });

  it("warns neutrally when commitments exceed income", async () => {
    await renderReadiness();
    await screen.findByText("Your money, made clearer.");
    fireEvent.change(screen.getByLabelText("Monthly take-home income"), {
      target: { value: "20000" },
    });
    fireEvent.change(screen.getByLabelText("Monthly fixed expenses"), {
      target: { value: "18000" },
    });
    fireEvent.change(screen.getByLabelText("Monthly EMI payments"), {
      target: { value: "5000" },
    });
    expect(await screen.findByText(/Review your budget before investing/)).toBeInTheDocument();
    expect(screen.queryByText("Potential monthly surplus")).not.toBeInTheDocument();
  });

  it("shows the entered emergency duration without inventing an amount", async () => {
    await renderReadiness();
    await screen.findByText("Your money, made clearer.");
    fireEvent.change(screen.getByLabelText("Emergency savings"), {
      target: { value: "3" },
    });
    expect(await screen.findAllByText("3 months")).toHaveLength(2);
  });

  it("leaves the form itself untouched and working", async () => {
    await renderReadiness();
    expect(await screen.findByText("Money readiness check")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Check My Readiness/ })).toBeInTheDocument();
    expect(screen.getByText("Before you start investing")).toBeInTheDocument();
  });
});
