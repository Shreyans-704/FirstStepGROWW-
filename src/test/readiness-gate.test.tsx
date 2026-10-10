import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Readiness } from "@/components/landing/Readiness";

function renderSection() {
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

describe("Readiness declaration gate", () => {
  it("blocks continuing until all four declarations are selected", async () => {
    const { router } = await renderSection();
    expect(await screen.findByText("Age 20 or older")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select all 4 basics to continue" })).toBeDisabled();

    for (const label of [
      /Your safety net/,
      /Your monthly budget/,
      /Your financial goals/,
      /Age 20 or older/,
    ]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }

    const cta = await screen.findByRole("button", { name: /Check My Readiness/ });
    expect(cta).not.toBeDisabled();
    expect(screen.getByText("4 of 4 basics considered")).toBeInTheDocument();
    fireEvent.click(cta);
    expect(router.state.location.pathname).toBe("/readiness");
  });

  it("re-locks when a declaration is unmarked", async () => {
    await renderSection();
    await screen.findByRole("button", { name: /Age 20 or older/ });
    for (const label of [
      /Your safety net/,
      /Your monthly budget/,
      /Your financial goals/,
      /Age 20 or older/,
    ]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }
    expect(await screen.findByRole("button", { name: /Check My Readiness/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Age 20 or older/ }));
    expect(screen.getByRole("button", { name: "Select all 4 basics to continue" })).toBeDisabled();
  });
});
