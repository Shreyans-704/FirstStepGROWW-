import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FlexSipBuilder } from "@/components/flexsip/FlexSipBuilder";

function renderBuilder({ clear = true }: { clear?: boolean } = {}) {
  if (clear) localStorage.clear();
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: FlexSipBuilder,
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

describe("FlexSipBuilder", () => {
  it("renders the planner with default base and no top-up", async () => {
    await renderBuilder();
    expect(await screen.findByText("Flex SIP builder")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "₹500" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "None" })).toHaveAttribute("aria-checked", "true");
  });

  it("updates the planned total when base and top-up change", async () => {
    await renderBuilder();
    await screen.findByText("Flex SIP builder");
    fireEvent.click(screen.getByRole("radio", { name: "₹2,000" }));
    fireEvent.click(screen.getByRole("radio", { name: "+₹500" }));
    expect(screen.getByText("₹2,500")).toBeInTheDocument();
  });

  it("saves the plan to localStorage and restores it on reload", async () => {
    const first = await renderBuilder();
    await screen.findByText("Flex SIP builder");
    fireEvent.click(screen.getByRole("radio", { name: "₹1,000" }));
    fireEvent.click(screen.getByRole("button", { name: "Save My Plan" }));
    expect(await screen.findByText("Plan Saved")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem("firststep.plan.v1") ?? "null") as {
      base: number;
      optional: number;
    } | null;
    expect(stored?.base).toBe(1000);
    first.unmount();

    await renderBuilder({ clear: false });
    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "₹1,000" })).toHaveAttribute("aria-checked", "true");
  });

  it("pauses and resumes the saved plan", async () => {
    await renderBuilder();
    await screen.findByText("Flex SIP builder");
    fireEvent.click(screen.getByRole("button", { name: "Save My Plan" }));
    await screen.findByText("Plan Saved");
    fireEvent.click(screen.getByRole("button", { name: "Pause for 1 mo" }));
    expect(await screen.findByText(/Paused for 1 month/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume now" }));
    expect(await screen.findByText("Plan resumed — active again")).toBeInTheDocument();
  });
});
