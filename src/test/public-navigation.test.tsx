import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { lock } from "@/lib/gate";
import { Showcase } from "@/components/landing/Showcase";
import { MutualFunds } from "@/components/landing/MutualFunds";

function renderSection(component: () => React.JSX.Element) {
  lock();
  localStorage.clear();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component,
  });
  const riskRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/risk",
    component: () => <p>Growth Simulator</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, riskRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return router.load().then(() => {
    const view = render(<RouterProvider router={router} />);
    return { ...view, router };
  });
}

describe("public educational entry points (no assessment required)", () => {
  it("'Explore the Experience' navigates directly to the Growth Simulator", async () => {
    const { router } = await renderSection(Showcase);
    fireEvent.click(await screen.findByRole("link", { name: /Explore the Experience/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/risk"));
  });

  it("'Understand Mutual Funds' navigates directly to the Knowledge Hub", async () => {
    const { router } = await renderSection(MutualFunds);
    fireEvent.click(await screen.findByRole("link", { name: /Understand Mutual Funds/ }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/risk");
      expect(router.state.location.hash).toBe("knowledge-hub");
    });
  });
});
