import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "@/routes/__root";

let scrollSpy: ReturnType<typeof vi.spyOn>;

function renderPages(initialPath: string) {
  const rootRoute = createRootRoute();
  const pageA = createRoute({
    getParentRoute: () => rootRoute,
    path: "/a",
    component: () => (
      <>
        <ScrollToTop />
        <p>Page A</p>
      </>
    ),
  });
  const pageB = createRoute({
    getParentRoute: () => rootRoute,
    path: "/b",
    component: () => (
      <>
        <ScrollToTop />
        <p>Page B</p>
      </>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageA, pageB]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return router.load().then(() => {
    const view = render(<RouterProvider router={router} />);
    return { ...view, router };
  });
}

// The router itself may issue scroll calls on load; these tests assert only
// the component-owned instant scroll-to-top contract.
const instantTop = expect.objectContaining({ top: 0, behavior: "instant" });

describe("ScrollToTop", () => {
  beforeEach(() => {
    scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not scroll on initial page load", async () => {
    await renderPages("/a");
    await screen.findByText("Page A");
    expect(scrollSpy).not.toHaveBeenCalledWith(instantTop);
  });

  it("scrolls to top when navigating to a different page", async () => {
    const { router } = await renderPages("/a");
    await screen.findByText("Page A");
    scrollSpy.mockClear();
    router.history.push("/b");
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledWith(instantTop));
    await screen.findByText("Page B");
  });

  it("does not reset scroll for same-page hash navigation", async () => {
    const { router } = await renderPages("/b");
    await screen.findByText("Page B");
    scrollSpy.mockClear();
    router.history.push("/b#section");
    await screen.findByText("Page B");
    // Let any stray effects flush, then confirm nothing fired.
    await waitFor(() => expect(scrollSpy).not.toHaveBeenCalledWith(instantTop));
  });

  it("does not scroll again on re-render without navigation", async () => {
    const view = await renderPages("/a");
    await screen.findByText("Page A");
    scrollSpy.mockClear();
    view.rerender(
      // Re-render the same tree: no navigation, no scroll.
      <RouterProvider router={view.router} />,
    );
    await screen.findByText("Page A");
    expect(scrollSpy).not.toHaveBeenCalledWith(instantTop);
  });
});
